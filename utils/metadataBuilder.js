

const buildMetadata = ({
  certId,
  name,
  issuer,
  recipientName,
  courseTitle,
  issueDate,
  description,
  imageURL,
  userWallet,
}) => {
  return {
    name,
    symbol: "CERT",
   imageURL, // Link to IPFS or uploaded image
    description,
    properties: {
      certId,
      issuer,
      recipientName,
      courseTitle,
      issueDate,
    
      issuedTo: userWallet,
    },
  };
};

module.exports = { buildMetadata };

// utils/metadataBuilder.js
// const buildMetadata = ({ name, issuer, recipientName, courseTitle, issueDate, expiryDate, description, imageURL }) => {
//   return {
//     name,
//     symbol: "CERT",
//     uri: imageURL,
//     description,
//     properties: {
//       issuer,
//       recipientName,
//       courseTitle,
//       issueDate,
//       expiryDate,
//     },
//   };
// };

// module.exports = { buildMetadata };
