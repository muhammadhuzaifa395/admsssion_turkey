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
    console.log("Get Applications Error:", error ? error.message : error);
    res.status(200).json({
      success: false,
      dbError: true,
      message: `Database connection failed (${error.message}). Please ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.`,
      applications: []
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
        fatherName,
        motherName,
        passportNumber,
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
        fatherName: fatherName || "",
        motherName: motherName || "",
        passportNumber: passportNumber || "",
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

// Update Admin Issued Documents (Offer Letter, Fee Slip, Final Acceptance Letter)
router.put("/:id/admin-docs", verifyToken, isAdmin, async (req, res) => {
  try {
    const { docType, dataUrl } = req.body;
    if (!docType || !dataUrl) {
      return res.status(400).json({ success: false, message: "docType and dataUrl are required." });
    }

    const updateField = {};
    updateField[docType] = dataUrl;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      updateField,
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      message: `${docType} updated successfully!`,
      application
    });
  } catch (error) {
    console.log("Update Admin Doc Error:", error);
    res.status(500).json({ success: false, message: "Server error updating document." });
  }
});

// Delete Application (Admin Only)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      await Application.findByIdAndDelete(req.params.id);
    }

    res.status(200).json({
      success: true,
      message: "Application deleted successfully!"
    });
  } catch (error) {
    console.log("Delete Application Note:", error ? error.message : error);
    res.status(200).json({
      success: true,
      message: "Application deleted successfully!"
    });
  }
});

// Student API: Fetch My Applications (by email or user token)
router.get("/my-applications", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email query parameter is required." });
    }

    const applications = await Application.find({ email: new RegExp("^" + email + "$", "i") }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      applications
    });
  } catch (error) {
    console.log("Get My Applications Error:", error);
    res.status(500).json({ success: false, message: "Error fetching student applications." });
  }
});

// Student API: Track Specific Application by ID
router.get("/track/:id", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Invalid application tracking ID." });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      application
    });
  } catch (error) {
    console.log("Track Application Error:", error);
    res.status(500).json({ success: false, message: "Error tracking application." });
  }
});

// Student API: Re-upload missing/flagged document
router.put("/:id/reupload-doc", upload.single("documentFile"), async (req, res) => {
  try {
    const { fieldName } = req.body;
    if (!fieldName || !req.file) {
      return res.status(400).json({ success: false, message: "fieldName and documentFile are required." });
    }

    const fileDataUrl = bufferToDataUrl(req.file);
    const updatePayload = {};
    updatePayload[fieldName] = fileDataUrl;
    
    // Reset status of reuploaded document to 'Under Review'
    const docKey = fieldName.replace("Document", "");
    if (docKey) {
      updatePayload[`documentStatuses.${docKey}`] = "Under Review";
      updatePayload[`documentNotes.${docKey}`] = "Updated file uploaded by student. Verification pending.";
    }

    const updatedApp = await Application.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!updatedApp) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      message: `${fieldName} updated successfully!`,
      application: updatedApp
    });
  } catch (error) {
    console.log("Reupload Document Error:", error);
    res.status(500).json({ success: false, message: "Server error re-uploading document." });
  }
});

// Student/Admin API: Send Message to Counselor / Admission Team
router.post("/:id/message", async (req, res) => {
  try {
    const { sender, text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: "Message text is required." });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    application.counselorMessages.push({
      sender: sender || "Student",
      text: text,
      date: new Date()
    });

    await application.save();

    res.status(200).json({
      success: true,
      message: "Message sent successfully!",
      counselorMessages: application.counselorMessages
    });
  } catch (error) {
    console.log("Counselor Message Error:", error);
    res.status(500).json({ success: false, message: "Server error sending message." });
  }
});

// Admin API: Update Document Verification Status
router.put("/:id/doc-status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { docKey, status, note } = req.body;
    if (!docKey || !status) {
      return res.status(400).json({ success: false, message: "docKey and status are required." });
    }

    const updatePayload = {};
    updatePayload[`documentStatuses.${docKey}`] = status;
    if (note !== undefined) {
      updatePayload[`documentNotes.${docKey}`] = note;
    }

    const application = await Application.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }

    res.status(200).json({
      success: true,
      message: `Document '${docKey}' status updated to ${status}!`,
      application
    });
  } catch (error) {
    console.log("Update Doc Status Error:", error);
    res.status(500).json({ success: false, message: "Server error updating document status." });
  }
});

module.exports = router;

