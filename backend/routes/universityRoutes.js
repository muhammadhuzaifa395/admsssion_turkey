const express = require("express");
const router = express.Router();

const {
  getAllUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  addProgram,
  deleteProgram,
  parseUniversityData,
  checkDuplicateUniversity,
  importUniversity,
  updateProgram
} = require("../controllers/universityController");

const { verifyToken, isSuperAdmin } = require("../middleware/authMiddleware");

// PUBLIC ROUTES
router.get("/", getAllUniversities);
router.get("/:id", getUniversityById);

// SUPER ADMIN ONLY ROUTES (University & Program Management)
router.post("/parse", verifyToken, isSuperAdmin, parseUniversityData);
router.post("/check-duplicate", verifyToken, isSuperAdmin, checkDuplicateUniversity);
router.post("/import", verifyToken, isSuperAdmin, importUniversity);
router.post("/", verifyToken, isSuperAdmin, createUniversity);
router.put("/:id", verifyToken, isSuperAdmin, updateUniversity);
router.delete("/:id", verifyToken, isSuperAdmin, deleteUniversity);
router.post("/:id/programs", verifyToken, isSuperAdmin, addProgram);
router.put("/:universityId/programs/:programId", verifyToken, isSuperAdmin, updateProgram);
router.delete("/:universityId/programs/:degreeType/:programId", verifyToken, isSuperAdmin, deleteProgram);

module.exports = router;


















  