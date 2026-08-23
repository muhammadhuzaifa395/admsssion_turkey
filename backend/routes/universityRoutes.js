const express = require("express");

const router =
  express.Router();

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

} =
  require(
    "../controllers/universityController"
  );


const {

  verifyToken,

  isAdmin

} =
  require(
    "../middleware/authMiddleware"
  );


// ========================================
// PUBLIC ROUTES
// ========================================

// Get all universities

router.get(
  "/",
  getAllUniversities
);


// Get single university

router.get(
  "/:id",
  getUniversityById
);



// ========================================
// ADMIN ONLY ROUTES
// ========================================

// Parse raw university & program data

router.post(
  "/parse",

  verifyToken,

  isAdmin,

  parseUniversityData
);


// Check duplicate university by name

router.post(
  "/check-duplicate",

  verifyToken,

  isAdmin,

  checkDuplicateUniversity
);


// Import structured university with programs

router.post(
  "/import",

  verifyToken,

  isAdmin,

  importUniversity
);


// Add university

router.post(

  "/",

  verifyToken,

  isAdmin,

  createUniversity

);


// Update university

router.put(

  "/:id",

  verifyToken,

  isAdmin,

  updateUniversity

);


// Delete university

router.delete(

  "/:id",

  verifyToken,

  isAdmin,

  deleteUniversity

);


// Add program

router.post(

  "/:id/programs",

  verifyToken,

  isAdmin,

  addProgram

);


// Update single program

router.put(

  "/:universityId/programs/:programId",

  verifyToken,

  isAdmin,

  updateProgram

);


// Delete program

router.delete(

  "/:universityId/programs/:degreeType/:programId",

  verifyToken,

  isAdmin,

  deleteProgram

);


module.exports =
  router;


















  