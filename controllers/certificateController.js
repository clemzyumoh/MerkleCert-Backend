

const Certificate = require("../models/Certificate");
const { buildMetadata } = require("../utils/metadataBuilder");
//const { mintNFT } = require("../services/solanaService");
const { uploadFileToPinata } = require("../services/pinataService"); // NEW: Using Pinata

const { generateMerkleTree, hashCertificate, verifyCertificate } = require("../utils/merkle");

// const issueCertificate = async (req, res) => {
//   try {
//     const {
//       certId,
//       userWallet,
//       name,
//       issuer,
//       recipientName,
//       courseTitle,
//       issueDate,
//       description,
//     } = req.body;

//     const existingCert = await Certificate.findOne({ certId });
//     if (existingCert) {
//       return res.status(400).json({ message: "Certificate already exists." });
//     }

//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ message: "Certificate file required." });
//     }
//     const filePath = req.file.path; // ✅ define this!
//     console.log("Uploading file at:", filePath);

//     const imageUrl = await uploadFileToPinata(filePath);
//     if (!imageUrl) {
//       return res.status(500).json({ message: "Image upload failed." });
//     }

//     const metadata = buildMetadata({
//       certId,
//       name,
//       issuer,
//       recipientName,
//       courseTitle,
//       issueDate,
//       description,
//       imageURL: imageUrl,
//       userWallet,
//     });

//     const certificate = new Certificate({
//       userWallet,
//       certId,
//       imageURL: imageUrl, // ✅ add this
//       metadata,
//     });

//     await certificate.save();

//     res.status(201).json({
//       message: "Certificate issued and saved. Ready to mint.",
//       certificate,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// const issueCertificate = async (req, res) => {
//   try {
//     const {
//       certId,
//       userWallet,
//       name,
//       issuer,
//       recipientName,
//       courseTitle,
//       issueDate,
//       description,
//     } = req.body;

//     const existingCert = await Certificate.findOne({ certId });
//     if (existingCert) {
//       return res.status(400).json({ message: "Certificate already exists." });
//     }

//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ message: "Certificate file required." });
//     }

//     const filePath = req.file.path;
//     const imageUrl = await uploadFileToPinata(filePath);
//     if (!imageUrl) {
//       return res.status(500).json({ message: "Image upload failed." });
//     }

//     const metadata = buildMetadata({
//       certId,
//       name,
//       issuer,
//       recipientName,
//       courseTitle,
//       issueDate,
//       description,
//       imageURL: imageUrl,
//       userWallet,
//     });

//     // Save the new cert first
//     const certificate = new Certificate({
//       userWallet,
//       certId,
//       imageURL: imageUrl,
//       metadata,
//     });
//     await certificate.save();

//     // 🔄 REBUILD Merkle tree with all certs
//     const allCertificates = await Certificate.find({});
//     const certInputs = allCertificates.map((cert) => ({
//       recipientName: cert.metadata.recipientName,
//       courseTitle: cert.metadata.courseTitle,
//       issueDate: cert.metadata.issueDate,
//       issuer: cert.metadata.issuer,
//       userWallet: cert.userWallet,
//     }));

//     const { root, proofs } = generateMerkleTree(certInputs);

//     // ⛓️ Update each cert with its Merkle proof and shared root
//     await Promise.all(
//       allCertificates.map((cert, i) => {
//         cert.merkleRoot = root;
//         cert.merkleProof = proofs[i];
//         cert.verified = true;
//         return cert.save();
//       })
//     );

//     // Send response with newly issued cert
//     const updatedNewCert = await Certificate.findOne({ certId });

//     res.status(201).json({
//       message: "Certificate issued and Merkle data updated.",
//       certificate: updatedNewCert,
//     });
//   } catch (error) {
//     console.error("Issue certificate error:", error);
//     res.status(500).json({ message: "Server error." });
//   }
// };
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
      ipfsHash, // add this
      userWallet,
    });

    // Step 1: Save the new certificate first (unverified)
    const newCert = new Certificate({
      userWallet,
      certId,
      imageURL: imageUrl,
      ipfsHash, // add this
      metadata,
      verified: false,
      merkleRoot: null,
      merkleProof: [],
    });
    await newCert.save();

    // 🔁 Fetch all certificates before filtering and mapping
    const allCertificates = await Certificate.find({});

    // ✅ Add logging to debug
    console.log("Found", allCertificates.length, "certs");
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

    // 🔎 Filter out any with missing metadata fields
    // const certInputs = allCertificates
    //   .filter(
    //     (cert) =>
    //       cert.metadata &&
    //       cert.metadata.recipientName &&
    //       cert.metadata.courseTitle &&
    //       cert.metadata.issueDate &&
    //       cert.metadata.issuer
    //   )
    //   .map((cert) => ({
    //     recipientName: cert.metadata.recipientName,
    //     courseTitle: cert.metadata.courseTitle,
    //     issueDate: cert.metadata.issueDate,
    //     issuer: cert.metadata.issuer,
    //     userWallet: cert.userWallet,
    //   }));

    console.log("Using", certInputs.length, "certs for Merkle tree");

    // Step 4: Generate Merkle root and proofs
    console.log("certInputs:", certInputs);
    const { root, proofs } = generateMerkleTree(certInputs);
    console.log("Generated Merkle root:", root);

    // Step 5: Assign Merkle data back to each cert
    await Promise.all(
      validCerts.map((cert, i) => {
        cert.merkleRoot = root;
        cert.merkleProof = proofs[i];
        console.log("Proof for cert", i, ":", proofs[i]);
        cert.verified = true;
        return cert.save();
      })
    );

    // Step 6: Return the newly updated certificate
    const updatedNewCert = await Certificate.findOne({ certId });

    res.status(201).json({
      message: "Certificate issued and Merkle data updated.",
      certificate: updatedNewCert,
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


// const verifyCertificateById = async (req, res) => {
//   try {
//     const { certId } = req.params;

//     const certificate = await Certificate.findOne({ certId });
//     if (!certificate) {
//       return res.status(404).json({ message: "Certificate not found." });
//     }

//     if (!certificate.merkleRoot || !certificate.merkleProof) {
//       return res
//         .status(400)
//         .json({
//           message:
//             "Merkle data not found. This cert may not be registered in a Merkle tree yet.",
//         });
//     }

//     const certData = {
//       certId: certificate.certId, // include this if it's part of the hash
//       recipientName: certificate.recipientName,
//       courseTitle: certificate.courseTitle,
//       issueDate: certificate.issueDate,
//       issuer: certificate.issuer,
//       userWallet: certificate.userWallet,
//     };

//     const isValid = verifyCertificate(
//       certData,
//       certificate.merkleRoot,
//       certificate.merkleProof
//     );

//     if (!isValid) {
//       return res
//         .status(400)
//         .json({
//           message:
//             "Invalid Merkle proof. This certificate may have been tampered with.",
//         });
//     }

//     return res.status(200).json({
//       message: "Certificate is valid.",
//       certificate,
//     });
//   } catch (error) {
//     console.error("Verification error:", error);
//     return res.status(500).json({ message: "Server error." });
//   }
// };

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
