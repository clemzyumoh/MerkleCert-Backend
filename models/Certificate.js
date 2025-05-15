
const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    userWallet: {
      type: String,
      required: true,
      //unique: true,
    },
    certId: {
      type: String,
      required: true,
      unique: true,
    },
    ipfsHash: {
      type: String,
      //required: true,
    },
    metadata: {
      type: Object,
      required: true,
    },
    imageURL: {
      type: String,
      required: true,
    },
    // merkleRoot: {
    //   type: String,
    //   required: true,
    // },
    // merkleProof: {
    //   type: [String],
    //   required: true,
    // },

    merkleRoot: {
      type: String,
      default: null,
    },
    merkleProof: {
      type: [String],
      default: [],
    },

    verified: {
      type: Boolean,
      default: false,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
