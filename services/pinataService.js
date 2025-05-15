// services/pinataService.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PINATA_JWT = process.env.PINATA_API_JWT;

const uploadFileToPinata = async (filePath) => {
  try {
    const data = new FormData();
    data.append("file", fs.createReadStream(filePath));

    const metadata = JSON.stringify({
      name: path.basename(filePath),
    });
    data.append("pinataMetadata", metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    data.append("pinataOptions", options);

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
          Authorization: `Bearer ${PINATA_JWT}`,
        },
      }
    );

    return {
      ipfsHash: res.data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
    };
    
  } catch (err) {
    console.error("Pinata upload failed:", err.message);
    throw new Error("File upload to Pinata failed");
  }
};

module.exports = { uploadFileToPinata };
