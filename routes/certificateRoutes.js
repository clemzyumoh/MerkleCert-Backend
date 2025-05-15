// routes/certificateRoutes.js

const express = require("express");
const router = express.Router();
const {
  issueCertificate,
  getCertificatesByWallet,
  merkleCertificateNFT,
  verifyCertificateById,
} = require("../controllers/certificateController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // temp local, or configure IPFS

// Route to issue a new certificate (admin)
router.post("/certificates", upload.single("file"), issueCertificate);

// Route to fetch certificates for a specific wallet
router.get("/certificates/:wallet", getCertificatesByWallet);

// Route to verify a certificate by its ID
router.get("/verify/:certId", verifyCertificateById)

// Mint certificate NFT separately
//router.post("/certificates/mint", mintCertificate);


router.post("/certificates/merkle", merkleCertificateNFT);


module.exports = router;
