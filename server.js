// server.js

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); // Import db connection
const certificateRoutes = require("./routes/certificateRoutes"); // API routes for certificates
//const { errorHandler } = require("./middleware/errorMiddleware"); // Error handler
const userRoutes = require("./routes/userRoutes");

dotenv.config(); // Load environment variables from .env file

const app = express();

// Connect to MongoDB
connectDB();

// Middlewares
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: false })); // Allows for URL-encoded bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)

// Routes
app.use("/api", certificateRoutes);
// Mount routes
app.use("/api", userRoutes);

// Basic error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);  // Logs the error stack to the console
  res.status(500).json({ message: 'Something went wrong! Please try again later.' });
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
