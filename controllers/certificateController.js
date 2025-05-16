

const Certificate = require("../models/Certificate");
const { buildMetadata } = require("../utils/metadataBuilder");
const { uploadFileToPinata } = require("../services/pinataService"); // NEW: Using Pinata
const dotenv = require("dotenv");

const {
  generateMerkleTree,
  hashCertificate,
  verifyCertificate,
} = require("../utils/merkle");
//require("dotenv").config();
const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
const bs58 = require("bs58").default; // ✅ FIX HERE
const { TransactionInstruction } = require("@solana/web3.js");

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);
//const MemoProgram  = require("@solana/spl-memo");

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const secretKey = bs58.decode(process.env.ADMIN_WALLET_SECRET_KEY);
const payer = Keypair.fromSecretKey(secretKey);

dotenv.config(); // Load environment variables from .env file

const issueCertificate = async (req, res) => {
  try {
    const {
      certId,
      userWallet,
      name,
      issuer,
      recipientName,
      courseTitle,
      issueDate,
      description,
    } = req.body;

    const existingCert = await Certificate.findOne({ certId });
    if (existingCert) {
      return res.status(400).json({ message: "Certificate already exists." });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Certificate file required." });
    }

    const filePath = req.file.path;
    const { ipfsHash, url: imageUrl } = await uploadFileToPinata(filePath);

    if (!imageUrl) {
      return res.status(500).json({ message: "Image upload failed." });
    }

    const metadata = buildMetadata({
      certId,
      name,
      issuer,
      recipientName,
      courseTitle,
      issueDate,
      description,
      imageURL: imageUrl,
      ipfsHash,
      userWallet,
    });

    const newCert = new Certificate({
      userWallet,
      certId,
      imageURL: imageUrl,
      ipfsHash,
      metadata,
      verified: false,
      merkleRoot: null,
      merkleProof: [],
    });
    await newCert.save();

    const allCertificates = await Certificate.find({});

    const validCerts = allCertificates.filter(
      (cert) =>
        cert.metadata?.properties?.recipientName &&
        cert.metadata?.properties?.courseTitle &&
        cert.metadata?.properties?.issueDate &&
        cert.metadata?.properties?.issuer &&
        cert.userWallet
    );

    const certInputs = validCerts.map((cert) => ({
      certId: cert.certId,
      recipientName: cert.metadata.properties.recipientName,
      courseTitle: cert.metadata.properties.courseTitle,
      issueDate: cert.metadata.properties.issueDate,
      issuer: cert.metadata.properties.issuer,
      userWallet: cert.userWallet,
    }));

    const { root, proofs } = generateMerkleTree(certInputs);
    console.log("Generated Merkle root:", root);

    // 🔥 Send Merkle root to Solana devnet as a memo

    const rootHexString = root.replace(/^0x/, "");
    console.log("Root hex string being memo-ed:", rootHexString); // ✅ Add here
    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(rootHexString, "utf8"),
    });

    const transaction = new Transaction().add(memoInstruction);
    const signature = await connection.sendTransaction(transaction, [payer]);
    await connection.confirmTransaction(signature, "confirmed");
    console.log("Merkle root posted to Solana with tx:", signature);

    await Promise.all(
      validCerts.map((cert, i) => {
        cert.merkleRoot = root;
        cert.merkleProof = proofs[i];
        cert.solanaTx = signature; // 🔥 add this
        cert.verified = true;
        return cert.save();
      })
    );

    const updatedNewCert = await Certificate.findOne({ certId });

    res.status(201).json({
      message:
        "Certificate issued, Merkle root posted to Solana, and data saved.",
      certificate: updatedNewCert,
      solanaTx: signature,
    });
  } catch (error) {
    console.error("Issue certificate error:", error);
    res.status(500).json({ message: "Server error." });
  }
};



const getCertificatesByWallet = async (req, res) => {
  try {
    const { wallet } = req.params;

    const certificates = await Certificate.find({ userWallet: wallet });
    if (!certificates.length) {
      return res.status(404).json({ message: "No certificates found for this wallet." });
    }

    res.status(200).json(certificates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




const merkleCertificateNFT = async (req, res) => {
  const { certId, recipientName, courseTitle, issueDate, issuer, userWallet } =
    req.body;

  try {
    // Step 1: Find existing certificate by certId
    const existingCert = await Certificate.findOne({ certId });
    if (!existingCert) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Step 2: Prepare the data for Merkle proof
    const certData = {
      recipientName,
      courseTitle,
      issueDate,
      issuer,
      userWallet,
    };

    const { root, proofs } = generateMerkleTree([certData]);
    const proof = proofs[0];

    // Step 3: Update existing certificate with Merkle data
    existingCert.merkleRoot = root;
    existingCert.merkleProof = proof;
    existingCert.verified = true;

    await existingCert.save();

    res.status(200).json({
      message: "Certificate updated with Merkle data",
      certificate: existingCert,
    });
  } catch (err) {
    console.error("Error updating certificate with Merkle data:", err);
    res.status(500).json({ error: "Failed to update certificate" });
  }
};



const verifyCertificateById = async (req, res) => {
  try {
    const { certId } = req.params;

    const certificate = await Certificate.findOne({ certId });
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    const certData = {
      certId: certificate.certId,
      recipientName: certificate.metadata?.properties?.recipientName,
      courseTitle: certificate.metadata?.properties?.courseTitle,
      issueDate: certificate.metadata?.properties?.issueDate,
      issuer: certificate.metadata?.properties?.issuer,
      userWallet: certificate.userWallet,
    };

    const isValid = verifyCertificate(
      certData,
      certificate.merkleRoot,
      certificate.merkleProof
    );

    if (!isValid) {
      return res
        .status(400)
        .json({
          message:
            "Invalid Merkle proof. This certificate may have been tampered with.",
        });
    }

    return res.status(200).json({
      message: "Certificate is valid.",
      certificate,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Server error." });
  }
};







module.exports = {
  issueCertificate,
  getCertificatesByWallet,
  merkleCertificateNFT,
  verifyCertificateById
};
