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

// ✅ Domains allowed to access your backend
const allowedOrigins = [
  "https://merkle-cert.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-wallet-address"],
  })
);


// Middlewares
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: false })); // Allows for URL-encoded bodies


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
