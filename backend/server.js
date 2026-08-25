const path = require("path");
module.paths.push(path.join(__dirname, "node_modules"));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const ensureDefaultAdmin = authRoutes.ensureDefaultAdmin;
const applicationRoutes = require("./routes/applicationRoutes");
const universityRoutes = require("./routes/universityRoutes");
const contactRoutes = require("./routes/contactRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(uploadsDir));

const ATLAS_URI = process.env.MONGO_URI || "mongodb+srv://huzaifarasheed2006:Fcc986108@huzaifaauth.ylrg6rk.mongodb.net/admission_turkey?retryWrites=true&w=majority&appName=HuzaifaAuth";
let PRIMARY_URI = ATLAS_URI;

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(PRIMARY_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 15000,
      family: 4, // Force IPv4 to eliminate Vercel serverless IPv6 connection drops
      maxPoolSize: 10,
      minPoolSize: 1
    }).then((db) => {
      console.log("MongoDB Atlas Connected Successfully");
      ensureDefaultAdmin().catch((err) => console.error("Admin seed note:", err.message));
      return db;
    }).catch(async (err) => {
      cachedPromise = null;
      console.error(`MongoDB Connection Note: ${err.message}`);
      throw err;
    });
  }

  return cachedPromise;
};

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    try {
      await connectDB();
    } catch (error) {
      console.error("DB Connection Middleware Note:", error.message);
      // Non-blocking: continue so local fail-safe storage can serve student data smoothly
    }
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);

app.get("/api", (req, res) => {
  res.send("Admission Turkey Backend is Running!");
});

app.get("/", (req, res) => {
  res.send("Admission Turkey Backend is Running!");
});

// Serve frontend files locally if needed
app.use("/frontend", express.static(path.join(__dirname, "../frontend")));

if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  connectDB().catch((err) => {
    console.error("Initial DB Connection Error:", err.message);
  });
}

module.exports = app;