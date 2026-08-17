const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const { router: authRoutes, ensureDefaultAdmin } = require("./routes/authRoutes");
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
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://huzaifarasheed2006:Fcc986108@huzaifaauth.ylrg6rk.mongodb.net/admission_turkey?appName=HuzaifaAuth";

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    }).then((db) => {
      console.log("MongoDB Connected Successfully");
      ensureDefaultAdmin().catch((err) => console.error("Admin seed error:", err.message));
      return db;
    }).catch((err) => {
      cachedPromise = null;
      console.error("MongoDB Connection Error:", err.message);
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
      console.error("DB Connection Middleware Error:", error.message);
      return res.status(503).json({
        message: `Database connection failed (${error.message}). Please ensure 0.0.0.0/0 is allowed in MongoDB Atlas Network Access.`
      });
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
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

module.exports = app;