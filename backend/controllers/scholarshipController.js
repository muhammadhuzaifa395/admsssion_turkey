const Scholarship = require("../models/Scholarship");
const ScholarshipRequest = require("../models/ScholarshipRequest");

// Initial seed dataset matching prompt screenshots
const initialScholarships = [
  {
    universityName: "Istanbul Atlas University",
    programName: "All Bachelor Programs",
    normalPrice: 19280,
    oneTimeFee: 8500,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=200&auto=format&fit=crop&q=80",
    isSoldOut: false,
    note: "Exclusive one-time payment offer"
  },
  {
    universityName: "Bahcesehir University",
    programName: "All Bachelor Programs",
    normalPrice: 36000,
    oneTimeFee: 23000,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=200&auto=format&fit=crop&q=80",
    isSoldOut: false,
    note: "Exclusive one-time payment offer"
  },
  {
    universityName: "Uskudar University",
    programName: "All Bachelor Programs",
    normalPrice: 18000,
    oneTimeFee: 8000,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=200&auto=format&fit=crop&q=80",
    isSoldOut: false,
    note: "Exclusive one-time payment offer"
  },
  {
    universityName: "Antalya Bilim University",
    programName: "All Bachelor Programs",
    normalPrice: 13250,
    oneTimeFee: 7500,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=80",
    isSoldOut: true,
    note: "Exclusive one-time payment offer"
  },
  {
    universityName: "Istanbul Topkapi University",
    programName: "Bachelor Programs",
    normalPrice: 10000,
    oneTimeFee: 4000,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=200&auto=format&fit=crop&q=80",
    isSoldOut: false,
    note: "Exclusive one-time payment offer"
  }
];

// Seed default data if database has no scholarships or update existing seed entries
const ensureInitialScholarships = async () => {
  try {
    const count = await Scholarship.countDocuments();
    if (count === 0) {
      console.log("Seeding initial scholarships into MongoDB...");
      await Scholarship.insertMany(initialScholarships);
    } else {
      // Update seed items to ensure exact prices match Rule 9
      for (const item of initialScholarships) {
        await Scholarship.updateOne(
          { universityName: item.universityName },
          { $set: { normalPrice: item.normalPrice, oneTimeFee: item.oneTimeFee, programName: item.programName } }
        );
      }
    }
  } catch (err) {
    console.error("Error seeding initial scholarships:", err.message);
  }
};

// GET all scholarships
exports.getAllScholarships = async (req, res) => {
  try {
    await ensureInitialScholarships();
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
