// db.js

const mongoose = require("mongoose");
require("dotenv").config(); // To read environment variables from .env file

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
        //useCreateIndex: true, // you can still use this, though it's optional.
        //useFindAndModify: false, // optional if you need to disable `findAndModify`
      });

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
