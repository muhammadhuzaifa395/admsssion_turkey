const University = require("../models/University");


// ========================================
// GET ALL UNIVERSITIES
// PUBLIC
// ========================================

exports.getAllUniversities = async (req, res) => {

  try {

    const universities =
      await University
        .find()
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      universities
    });

  } catch (error) {

    console.error(
      "Get Universities Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load universities."
    });

  }

};


// ========================================
// GET SINGLE UNIVERSITY
// PUBLIC
// ========================================

exports.getUniversityById = async (req, res) => {

  try {

    const university =
      await University.findById(
        req.params.id
      );

    if (!university) {

      return res.status(404).json({
        success: false,
        message: "University not found."
      });

    }

    res.status(200).json({
      success: true,
      university
    });

  } catch (error) {

    console.error(
      "Get University Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load university."
    });

  }

};


// ========================================
// CREATE UNIVERSITY
// ADMIN ONLY
// ========================================

exports.createUniversity = async (req, res) => {

  try {

    const {
      name,
      location,
      description,
      image,
      applicationLink,
      programs
    } = req.body;


    if (!name || !location) {

      return res.status(400).json({
        success: false,
        message:
          "University name and location are required."
      });

    }


    const university =
      new University({

        name,
        location,
        description:
          description || "",

        image:
          typeof image === "string"
            ? image.trim()
            : "",

        applicationLink:
          applicationLink || "",

        programs: {

          associate:
            programs?.associate || [],

          bachelors:
            programs?.bachelors || [],

          masters:
            programs?.masters || [],

          phd:
            programs?.phd || []

        }

      });


    const savedUniversity =
      await university.save();


    res.status(201).json({

      success: true,

      message:
        "University added successfully!",

      university:
        savedUniversity

    });

  } catch (error) {

    console.error(
      "Create University Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to add university.",

      error:
        error.message

    });

  }

};


// ========================================
// UPDATE UNIVERSITY
// ADMIN ONLY
// ========================================

exports.updateUniversity = async (
  req,
  res
) => {

  try {

    const university =
      await University.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new: true,
          runValidators: true
        }

      );


    if (!university) {

      return res.status(404).json({

        success: false,

        message:
          "University not found."

      });

    }


    res.status(200).json({

      success: true,

      message:
        "University updated successfully!",

      university

    });

  } catch (error) {

    console.error(
      "Update University Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to update university."

    });

  }

};


// ========================================
// DELETE UNIVERSITY
// ADMIN ONLY
// ========================================

exports.deleteUniversity = async (
  req,
  res
) => {

  try {

    const university =
      await University.findByIdAndDelete(
        req.params.id
      );


    if (!university) {

      return res.status(404).json({

        success: false,

        message:
          "University not found."

      });

    }


    res.status(200).json({

      success: true,

      message:
        "University deleted successfully!"

    });

  } catch (error) {

    console.error(
      "Delete University Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to delete university."

    });

  }

};


// ========================================
// ADD PROGRAM
// ADMIN ONLY
// ========================================

exports.addProgram = async (
  req,
  res
) => {

  try {

    const {
      degreeType,
      name,
      language,
      duration,
      originalFee,
      discountFee,
      description
    } = req.body;


    const allowedTypes = [

      "associate",

      "bachelors",

      "masters",

      "phd"

    ];


    if (
      !allowedTypes.includes(
        degreeType
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid degree type."

      });

    }


    if (!name) {

      return res.status(400).json({

        success: false,

        message:
          "Program name is required."

      });

    }


    const university =
      await University.findById(
        req.params.id
      );


    if (!university) {

      return res.status(404).json({

        success: false,

        message:
          "University not found."

      });

    }


    university.programs[
      degreeType
    ].push({

      name,

      language:
        language || "English",

      duration:
        duration || "",

      originalFee:
        Number(originalFee) || 0,

      discountFee:
        Number(discountFee) || 0,

      description:
        description || ""

    });


    await university.save();


    res.status(200).json({

      success: true,

      message:
        "Program added successfully!",

      university

    });

  } catch (error) {

    console.error(
      "Add Program Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to add program."

    });

  }

};


// ========================================
// DELETE PROGRAM
// ADMIN ONLY
// ========================================

exports.deleteProgram = async (
  req,
  res
) => {

  try {

    const {
      universityId,
      degreeType,
      programId
    } = req.params;


    const allowedTypes = [

      "associate",

      "bachelors",

      "masters",

      "phd"

    ];


    if (
      !allowedTypes.includes(
        degreeType
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid degree type."

      });

    }


    const university =
      await University.findById(
        universityId
      );


    if (!university) {

      return res.status(404).json({

        success: false,

        message:
          "University not found."

      });

    }


    const programIndex =
      university.programs[
        degreeType
      ].findIndex(

        program =>
          program._id.toString() ===
          programId

      );


    if (programIndex === -1) {

      return res.status(404).json({

        success: false,

        message:
          "Program not found."

      });

    }


    university.programs[
      degreeType
    ].splice(
      programIndex,
      1
    );


    await university.save();


    res.status(200).json({

      success: true,

      message:
        "Program deleted successfully!",

      university

    });

  } catch (error) {

    console.error(
      "Delete Program Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to delete program."

    });

  }

};