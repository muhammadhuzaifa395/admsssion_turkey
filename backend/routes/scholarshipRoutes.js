const express = require("express");
const router = express.Router();

const {
  getAllScholarships,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  toggleSoldOut,
  deleteScholarship,
  submitScholarshipRequest,
  getScholarshipRequests
} = require("../controllers/scholarshipController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// PUBLIC ROUTES
router.get("/", getAllScholarships);
router.get("/:id", getScholarshipById);
router.post("/request", submitScholarshipRequest);

// ADMIN ROUTES
router.post("/", verifyToken, isAdmin, createScholarship);
router.put("/:id", verifyToken, isAdmin, updateScholarship);
router.patch("/:id/sold-out", verifyToken, isAdmin, toggleSoldOut);
router.delete("/:id", verifyToken, isAdmin, deleteScholarship);
router.get("/requests/all", verifyToken, isAdmin, getScholarshipRequests);

module.exports = router;
