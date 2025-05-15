

//const MerkleTools = require("merkle-tools");
//const crypto = require("crypto");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

function hashCertificate(cert) {
  const str = JSON.stringify({
    certId: cert.certId, // include this if it's part of the hash
    recipientName: cert.recipientName,
    courseTitle: cert.courseTitle,
    issueDate: cert.issueDate,
    issuer: cert.issuer,
    userWallet: cert.userWallet,
  });
  return keccak256(str); // ✅ keep this
}



function generateMerkleTree(certInputs) {
  const leaves = certInputs.map(hashCertificate);
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const root = tree.getHexRoot();
  const proofs = leaves.map((leaf) => tree.getHexProof(leaf));

  return { root, proofs };
}


// function verifyCertificate(cert, rootHex, proofHexArray) {
//   const leaf = hashCertificate(cert); // should match the one used in initial tree
//   const tree = new MerkleTree([], keccak256, { sortPairs: true }); // dummy tree to use `verify`
//   return tree.verify(
//     proofHexArray.map((p) => Buffer.from(p.slice(2), "hex")),
//     leaf,
//     Buffer.from(rootHex.slice(2), "hex")
//   );
// }

function verifyCertificate(cert, rootHex, proofHexArray) {
  const leaf = hashCertificate(cert);
  console.log("Verifying hash:", leaf.toString("hex"));
  const tree = new MerkleTree([], keccak256, { sortPairs: true });

  return tree.verify(
    proofHexArray.map((p) => Buffer.from(p.slice(2), "hex")),
    leaf,
    Buffer.from(rootHex.slice(2), "hex")
  );
}




// // Hashing function for certificate data using keccak256
// function hashCertificate(cert) {
//   const str = JSON.stringify({
//     recipientName: cert.recipientName,
//     courseTitle: cert.courseTitle,
//     issueDate: cert.issueDate,
//     issuer: cert.issuer,
//     userWallet: cert.userWallet,
//   });
//   return keccak256(str); // using keccak256 for hashing
// }

// // Generate Merkle Tree and proofs for all certificates
// function generateMerkleTree(certInputs) {
//   if (certInputs.length === 0) return { root: null, proofs: [] };

//   const merkleTools = new MerkleTools({ hashType: "sha256" });

//   // Map certificate data to hashed leaves
//   const leaves = certInputs.map((data) =>
//     keccak256(
//       JSON.stringify({
//         certId: data.certId,
//         recipientName: data.recipientName,
//         courseTitle: data.courseTitle,
//         issueDate: data.issueDate,
//         issuer: data.issuer,
//         userWallet: data.userWallet,
//       })
//     )
//   );

//   merkleTools.addLeaves(leaves, true); // Add leaves to Merkle tree
//   merkleTools.makeTree(); // Generate the Merkle tree

//   // Get the Merkle root as hex string
//   const root = merkleTools.getMerkleRoot().toString("hex");

//   // Generate proof for each leaf
//   const proofs = leaves.map((_, index) => {
//     const proof = merkleTools.getProof(index);

//     // Ensure proof is valid and contains data before accessing it
//     const validProof = proof.filter((p) => p.data !== undefined);

//     // If valid proof is found, convert it to hex strings
//     return validProof.map((p) => p.data.toString("hex"));
//   });

//   return { root, proofs };
// }


// // Verify a certificate against Merkle root and proof
// function verifyCertificate(cert, rootHex, proofHexArray) {
//   const merkleTools = new MerkleTools({ hashType: "sha256" });

//   const leaf = hashCertificate(cert);

//   // Convert hex strings into buffer with direction (right or left)
//   const proof = proofHexArray.map((hex) => ({
//     data: Buffer.from(hex, "hex"),
//   }));

//   return merkleTools.validateProof(proof, leaf, Buffer.from(rootHex, "hex"));
// }

module.exports = {
  generateMerkleTree,
  verifyCertificate,
  hashCertificate,
};
