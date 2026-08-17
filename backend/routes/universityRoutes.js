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

  deleteProgram

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


// Delete program

router.delete(

  "/:universityId/programs/:degreeType/:programId",

  verifyToken,

  isAdmin,

  deleteProgram

);


module.exports =
  router;

















  