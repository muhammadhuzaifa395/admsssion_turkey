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

const connectDB = require("./config/db");

const initDB = async () => {
  try {
    const db = await connectDB();
    ensureDefaultAdmin().catch((err) => console.error("Admin seed note:", err.message));
    return db;
  } catch (err) {
    console.error("DB Initialization Error:", err.message);
    throw err;
  }
};

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    try {
      await initDB();
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
  initDB().catch((err) => {
    console.error("Initial DB Connection Error:", err.message);
  });
}

module.exports = app;