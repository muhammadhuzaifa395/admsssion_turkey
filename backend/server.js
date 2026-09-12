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
  const isApiReq = req.path.startsWith("/api") || req.url.startsWith("/api") || (req.originalUrl && req.originalUrl.startsWith("/api")) || req.path.includes("auth") || req.path.includes("applications") || req.path.includes("universities");
  if (isApiReq) {
    try {
      await initDB();
    } catch (error) {
      console.error("DB Connection Middleware Note:", error.message);
    }
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/applications", applicationRoutes);
app.use("/api/universities", universityRoutes);
app.use("/universities", universityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/contact", contactRoutes);

app.get(["/api", "/api/health"], (req, res) => {
  res.json({ status: "success", message: "Admission Turkey Backend is Running!" });
});

// Serve Admin Panel routes & static assets
app.use("/admin", express.static(path.join(__dirname, "../frontend/admin")));
app.get(["/admin", "/admin/"], (req, res) => {
  const adminHtmlPath = path.join(__dirname, "../frontend/admin/admin.html");
  if (fs.existsSync(adminHtmlPath)) {
    res.sendFile(adminHtmlPath);
  } else {
    res.status(404).send("Admin Panel page not found.");
  }
});

// Serve Frontend static assets & root index.html
app.use("/frontend", express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ status: "success", message: "Admission Turkey Backend is Running!" });
  }
});

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