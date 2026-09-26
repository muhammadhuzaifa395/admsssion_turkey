const Scholarship = require("../models/Scholarship");
const ScholarshipRequest = require("../models/ScholarshipRequest");

// GET all scholarships (Fetches active database records only, without re-seeding)
exports.getAllScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarship.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: scholarships.length,
      data: scholarships
    });
  } catch (err) {
    console.error("Error fetching scholarships:", err);
    res.status(500).json({
      success: false,
      message: "Server Error while fetching scholarships",
      error: err.message
    });
  }
};

// GET scholarship by ID
exports.getScholarshipById = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: "Scholarship not found" });
    }
    res.status(200).json({ success: true, data: scholarship });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// CREATE new scholarship (Admin)
exports.createScholarship = async (req, res) => {
  try {
    const { universityName, programName, image, normalPrice, oneTimeFee, currency, isSoldOut, note } = req.body;

    if (!universityName || oneTimeFee === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide university name and one-time payment fee."
      });
    }

    const scholarship = new Scholarship({
      universityName,
      programName: programName || "All Bachelor Programs",
      image: image || "",
      normalPrice: Number(normalPrice) || 0,
      oneTimeFee: Number(oneTimeFee),
      currency: currency || "USD",
      isSoldOut: isSoldOut === true || isSoldOut === "true",
      note: note || "Exclusive one-time payment offer"
    });

    await scholarship.save();

    res.status(201).json({
      success: true,
      message: "Scholarship created successfully",
      data: scholarship
    });
  } catch (err) {
    console.error("Error creating scholarship:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create scholarship",
      error: err.message
    });
  }
};

// UPDATE scholarship (Admin)
exports.updateScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: "Scholarship not found" });
    }

    const { universityName, programName, image, normalPrice, oneTimeFee, currency, isSoldOut, note } = req.body;

    if (universityName !== undefined) scholarship.universityName = universityName;
    if (programName !== undefined) scholarship.programName = programName;
    if (image !== undefined) scholarship.image = image;
    if (normalPrice !== undefined) scholarship.normalPrice = Number(normalPrice);
    if (oneTimeFee !== undefined) scholarship.oneTimeFee = Number(oneTimeFee);
    if (currency !== undefined) scholarship.currency = currency;
    if (isSoldOut !== undefined) scholarship.isSoldOut = isSoldOut === true || isSoldOut === "true";
    if (note !== undefined) scholarship.note = note;

    await scholarship.save();

    res.status(200).json({
      success: true,
      message: "Scholarship updated successfully",
      data: scholarship
    });
  } catch (err) {
    console.error("Error updating scholarship:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update scholarship",
      error: err.message
    });
  }
};

// TOGGLE Sold Out status (Admin)
exports.toggleSoldOut = async (req, res) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: "Scholarship not found" });
    }

    scholarship.isSoldOut = req.body.isSoldOut !== undefined ? (req.body.isSoldOut === true || req.body.isSoldOut === "true") : !scholarship.isSoldOut;
    await scholarship.save();

    res.status(200).json({
      success: true,
      message: `Scholarship status set to ${scholarship.isSoldOut ? "Sold Out" : "Available"}`,
      data: scholarship
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE scholarship (Admin)
exports.deleteScholarship = async (req, res) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
    if (!scholarship) {
      return res.status(404).json({ success: false, message: "Scholarship not found" });
    }
    res.status(200).json({
      success: true,
      message: "Scholarship deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SUBMIT student request
exports.submitScholarshipRequest = async (req, res) => {
  try {
    const { scholarshipId, universityName, studentName, studentEmail, studentPhone, message } = req.body;

    if (!universityName || !studentName || (!studentEmail && !studentPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide university name, your name, and phone or email."
      });
    }

    const request = new ScholarshipRequest({
      scholarshipId: scholarshipId || null,
      universityName,
      studentName,
      studentEmail: studentEmail || "N/A",
      studentPhone: studentPhone || "N/A",
      message: message || ""
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: "Request submitted successfully. Our office will review and contact you.",
      data: request
    });
  } catch (err) {
    console.error("Error submitting scholarship request:", err);
    res.status(500).json({
      success: false,
      message: "Failed to submit request",
      error: err.message
    });
  }
};

// GET requests for admin
exports.getScholarshipRequests = async (req, res) => {
  try {
    const requests = await ScholarshipRequest.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
