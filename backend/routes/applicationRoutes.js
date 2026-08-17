const express = require("express");
const multer = require("multer");
const path = require("path");

const Application = require("../models/Application");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  }
});

function bufferToDataUrl(file) {
  if (!file || !file.buffer) {
    return "";
  }
  const mime = file.mimetype || "application/octet-stream";
  const base64 = file.buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    console.log("Get Applications Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load applications."
    });
  }
});

router.post(
  "/",
  upload.fields([
    { name: "passportDocument", maxCount: 1 },
    { name: "certificateDocument", maxCount: 1 },
    { name: "diplomaDocument", maxCount: 1 },
    { name: "transcriptDocument", maxCount: 1 },
    { name: "masterDocument", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        country,
        nationality,
        dob,
        gender,
        university,
        program,
        level,
        originalFee,
        discountFee,
        universityId,
        message
      } = req.body;

      const passportDocument = bufferToDataUrl(
        req.files?.passportDocument?.[0]
      );
      const certificateDocument = bufferToDataUrl(
        req.files?.certificateDocument?.[0]
      );
      const diplomaDocument = bufferToDataUrl(
        req.files?.diplomaDocument?.[0]
      );
      const transcriptDocument = bufferToDataUrl(
        req.files?.transcriptDocument?.[0]
      );
      const masterDocument = bufferToDataUrl(
        req.files?.masterDocument?.[0]
      );
      const additionalDocuments = (req.files?.additionalDocuments || []).map(
        (file) => bufferToDataUrl(file)
      );

      const newApplication = new Application({
        name,
        email,
        phone,
        country,
        nationality,
        dob,
        gender,
        university,
        program,
        level,
        universityId,
        originalFee: Number(originalFee) || 0,
        discountFee: Number(discountFee) || 0,
        passportDocument,
        certificateDocument,
        diplomaDocument,
        transcriptDocument,
        masterDocument,
        additionalDocuments,
        message
      });

      await newApplication.save();

      res.status(201).json({
        message: "Application submitted successfully!"
      });
    } catch (error) {
      console.log("Application Error:", error);
      res.status(500).json({
        message: error.message || "Server error"
      });
    }
  }
);

// Update Application Status (Admin Only)
router.put("/:id/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required." });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      message: "Application status updated successfully!",
      application
    });
  } catch (error) {
    console.log("Update Status Error:", error);
    res.status(500).json({ success: false, message: "Server error updating status." });
  }
});

// Delete Application (Admin Only)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully!"
    });
  } catch (error) {
    console.log("Delete Application Error:", error);
    res.status(500).json({ success: false, message: "Server error deleting application." });
  }
});

module.exports = router;

