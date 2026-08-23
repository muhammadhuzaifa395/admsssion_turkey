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
      description,
      thesisType
    } = req.body;

    const allowedTypes = [
      "associate",
      "bachelors",
      "masters",
      "phd"
    ];

    if (!allowedTypes.includes(degreeType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid degree type."
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Program name is required."
      });
    }

    const university = await University.findById(req.params.id);

    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found."
      });
    }

    university.programs[degreeType].push({
      name,
      language: language || "English",
      duration: duration || "",
      originalFee: Number(originalFee) || 0,
      discountFee: Number(discountFee) || 0,
      description: description || "",
      thesisType: thesisType || "N/A"
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


// ========================================
// TEXT PARSER HELPER FOR IMPORTS
// ========================================

function parseRawUniversityText(rawText, uniName = "") {
  if (!rawText || typeof rawText !== "string") return [];

  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split logic: Look for degree level keywords lookahead
  let blocks = [];
  const degreeRegex = /\b(?:Bachelor(?:'s)?|Master(?:'s)?|PhD|Ph\.D\.?|Doctorate|Doktora|Doctor|Associate|Önlisans|Yüksek\s*Lisans)\b/gi;
  const degreeMatches = [...normalized.matchAll(degreeRegex)];

  if (degreeMatches.length > 1) {
    blocks = normalized.split(/(?=\b(?:Bachelor(?:'s)?|Master(?:'s)?|PhD|Ph\.D\.?|Doctorate|Doktora|Doctor|Associate|Önlisans|Yüksek\s*Lisans)\b)/i);
  } else {
    const linesAll = normalized.split("\n").map(l => l.trim()).filter(Boolean);
    if (linesAll.length > 1) {
      blocks = linesAll;
    } else {
      blocks = [normalized];
    }
  }

  const parsedPrograms = [];

  blocks.forEach((block, index) => {
    const cleanBlock = block.trim();
    if (!cleanBlock) return;

    // Skip block if it doesn't look like program data
    if (!/\b(bachelor|master|phd|ph\.d\.?|doctorate|doktora|doctor|associate|önlisans|yüksek\s*lisans)\b|\$[\d\.,]+|[\d\.,]+\$|\bfee\b/i.test(cleanBlock)) {
      return;
    }

    let name = "";
    let degreeLevel = "Bachelor's";
    let faculty = "";
    let language = "English";
    let duration = "4 Years";
    let originalFee = 0;
    let discountFee = 0;
    let currency = "$";
    let applicationFee = "";
    let requirements = "";
    let documents = "";
    let additionalRequirements = "";
    let intake = "";
    let description = "";
    let thesisType = "N/A";

    // 1. Detect Degree Level (Check PhD/Doctorate FIRST so Master's in requirements won't override PhD)
    if (/\b(phd|ph\.d\.?|doctorate|doctor|doktora|dr\.)\b/i.test(cleanBlock)) {
      degreeLevel = "PhD";
      duration = "4 Years";
    } else if (/\b(masters?|msc\b|ma\b|ms\b|yüksek\s*lisans)\b/i.test(cleanBlock)) {
      degreeLevel = "Master's";
      duration = "2 Years";
    } else if (/\b(associate|önlisans|diploma)\b/i.test(cleanBlock)) {
      degreeLevel = "Associate";
      duration = "2 Years";
    } else if (/\b(bachelors?|undergraduate|licence|ba\b|bsc\b|lisans)\b/i.test(cleanBlock)) {
      degreeLevel = "Bachelor's";
      duration = "4 Years";
    }

    // 2. Detect Thesis Type
    if (/with thesis|\bthesis\b/i.test(cleanBlock) && !/non-thesis|without thesis/i.test(cleanBlock)) {
      thesisType = "Thesis";
    } else if (/without thesis|non-thesis/i.test(cleanBlock)) {
      thesisType = "Non-Thesis";
    }

    // 3. Detect Currency
    if (/€|EUR/i.test(cleanBlock)) currency = "€";
    else if (/₺|TRY|TL/i.test(cleanBlock)) currency = "₺";
    else currency = "$";

    // 4. Detect Language
    if (/turkish\s*&\s*english|english\s*&\s*turkish/i.test(cleanBlock)) {
      language = "Turkish & English";
    } else if (/turkish|türkçe/i.test(cleanBlock) && !/english/i.test(cleanBlock)) {
      language = "Turkish";
    } else {
      language = "English";
    }

    // 5. Extract Fees
    const feeMatches = [...cleanBlock.matchAll(/(?:[\$€₺]\s*([\d\.,]+)|([\d\.,]+)\s*[\$€₺])/g)];
    if (feeMatches.length >= 1) {
      const val1 = parseFloat((feeMatches[0][1] || feeMatches[0][2]).replace(/,/g, ""));
      if (!isNaN(val1) && val1 > 0) originalFee = val1;
    }
    if (feeMatches.length >= 2) {
      const val2 = parseFloat((feeMatches[1][1] || feeMatches[1][2]).replace(/,/g, ""));
      if (!isNaN(val2) && val2 > 0) discountFee = val2;
    } else {
      discountFee = originalFee;
    }

    // 6. Detect Duration
    const durMatch = cleanBlock.match(/(\d+)\s*(years?|yıl|semesters?)/i);
    if (durMatch) {
      duration = `${durMatch[1]} Years`;
    }

    // 7. Extract Program Name
    let rawName = cleanBlock;

    // Remove university name if present
    if (uniName && uniName.trim()) {
      const safeUniName = uniName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      rawName = rawName.replace(new RegExp(safeUniName, "gi"), "");
    }
    // Remove general university pattern like "ISTANBUL GELISIM UNIVERSITY"
    rawName = rawName.replace(/[\w\s\.\-&']+\b(UNIVERSITY|UNIVERSITESI|UNIV|INSTITUTE|COLLEGE)\b/gi, "");

    // Remove degree label prefix
    rawName = rawName.replace(/^(ph\.?d\.?|doctorate|doktora|doctor|bachelor's|bachelor|master's|master|associate)\s+/i, "");

    // Clean up language, fees, numbers, nulls
    let progName = rawName
      .replace(/\((English|Turkish|English & Turkish|PhD|Ph\.D\.?|Doctorate|Doktora)\)/gi, "")
      .replace(/\b(English|Turkish|English & Turkish)\b(?=\s*(?:[\$€₺]|[\d\.,]+\$|\d{3,5}|null))/gi, "")
      .replace(/[\$€₺]\s*[\d\.,]+/g, "")
      .replace(/[\d\.,]+\s*[\$€₺]/g, "")
      .replace(/[\$€₺]/g, "")
      .replace(/\bnull\b/gi, "")
      .replace(/\b\d{3,5}\b/g, "")
      .replace(/\b\d\b$/, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!progName || progName.length < 2) {
      progName = cleanBlock.split("\n")[0].trim();
    }

    if (progName && progName.length >= 2) {
      parsedPrograms.push({
        id: `prog_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
        name: progName,
        degreeLevel,
        faculty,
        language,
        duration,
        originalFee: originalFee || 0,
        discountFee: discountFee || originalFee || 0,
        currency,
        applicationFee,
        requirements,
        documents,
        additionalRequirements,
        intake,
        description: "",
        thesisType
      });
    }
  });

  return parsedPrograms;
}


// ========================================
// PARSE UNIVERSITY DATA (ADMIN)
// ========================================

exports.parseUniversityData = async (req, res) => {
  try {
    const { rawText, universityInfo } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please paste university & program data to parse."
      });
    }

    const parsedPrograms = parseRawUniversityText(rawText, universityInfo?.name || "");

    if (parsedPrograms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not parse any valid programs from the provided text. Please check format and retry."
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully parsed ${parsedPrograms.length} program(s)!`,
      universityInfo: universityInfo || {},
      parsedPrograms
    });
  } catch (error) {
    console.error("Parse University Data Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to parse data.",
      error: error.message
    });
  }
};


// ========================================
// CHECK DUPLICATE UNIVERSITY (ADMIN)
// ========================================

exports.checkDuplicateUniversity = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "University name is required."
      });
    }

    const trimmedName = name.trim();
    const existing = await University.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        exists: true,
        universityId: existing._id,
        message: `A university named "${existing.name}" already exists in the database.`
      });
    }

    res.status(200).json({
      success: true,
      exists: false,
      message: "No duplicate found."
    });
  } catch (error) {
    console.error("Check Duplicate University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check for duplicate university."
    });
  }
};


// ========================================
// IMPORT UNIVERSITY WITH PROGRAMS (ADMIN)
// ========================================

exports.importUniversity = async (req, res) => {
  try {
    const {
      existingUniversityId,
      id,
      name,
      country,
      city,
      type,
      location,
      description,
      website,
      image,
      applicationLink,
      programs
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "University Name is required."
      });
    }

    const rawPrograms = Array.isArray(programs) ? programs : [];
    if (rawPrograms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one program is required to import a university."
      });
    }

    // Validate that every program has a name
    for (let i = 0; i < rawPrograms.length; i++) {
      if (!rawPrograms[i].name || !rawPrograms[i].name.trim()) {
        return res.status(400).json({
          success: false,
          message: `Program #${i + 1} is missing a name.`
        });
      }
    }

    const computedLocation = (location && location.trim())
      ? location.trim()
      : [city, country || "Turkey"].filter(Boolean).join(", ") || "Turkey";

    const categorizedPrograms = {
      associate: [],
      bachelors: [],
      masters: [],
      phd: []
    };

    rawPrograms.forEach(prog => {
      const level = (prog.degreeLevel || prog.degree || "").toLowerCase();

      const formattedProg = {
        name: prog.name.trim(),
        degreeLevel: prog.degreeLevel || "Bachelor's",
        faculty: prog.faculty || "",
        language: prog.language || "English",
        duration: prog.duration || "",
        originalFee: Number(prog.originalFee) || 0,
        discountFee: Number(prog.discountFee) || Number(prog.originalFee) || 0,
        currency: prog.currency || "$",
        applicationFee: prog.applicationFee || "",
        requirements: prog.requirements || "",
        documents: prog.documents || "",
        additionalRequirements: prog.additionalRequirements || "",
        intake: prog.intake || "",
        description: prog.description || "",
        thesisType: prog.thesisType || "N/A"
      };

      if (level.includes("phd") || level.includes("doctor") || level.includes("doktora")) {
        categorizedPrograms.phd.push(formattedProg);
      } else if (level.includes("associate") || level.includes("önlisans")) {
        categorizedPrograms.associate.push(formattedProg);
      } else if (level.includes("master")) {
        categorizedPrograms.masters.push(formattedProg);
      } else {
        categorizedPrograms.bachelors.push(formattedProg);
      }
    });

    const targetId = existingUniversityId || id;
    if (targetId) {
      const existing = await University.findById(targetId);
      if (existing) {
        existing.name = name.trim();
        existing.location = computedLocation;
        existing.country = country || "Turkey";
        existing.city = city || "";
        existing.type = type || "Public";
        existing.description = description || "";
        existing.website = website || "";
        existing.image = image || "";
        existing.applicationLink = applicationLink || "";
        existing.programs = categorizedPrograms;

        const updatedUniversity = await existing.save();
        return res.status(200).json({
          success: true,
          message: "University and programs updated successfully!",
          university: updatedUniversity
        });
      }
    }

    const university = new University({
      name: name.trim(),
      location: computedLocation,
      country: country || "Turkey",
      city: city || "",
      type: type || "Public",
      description: description || "",
      website: website || "",
      image: image || "",
      applicationLink: applicationLink || "",
      programs: categorizedPrograms
    });

    const savedUniversity = await university.save();

    res.status(201).json({
      success: true,
      message: "University and programs imported successfully!",
      university: savedUniversity
    });
  } catch (error) {
    console.error("Import University Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save imported university.",
      error: error.message
    });
  }
};


// ========================================
// UPDATE INDIVIDUAL PROGRAM (ADMIN)
// ========================================

exports.updateProgram = async (req, res) => {
  try {
    const { universityId, programId } = req.params;
    const updateData = req.body;

    const university = await University.findById(universityId);
    if (!university) {
      return res.status(404).json({ success: false, message: "University not found." });
    }

    let updated = false;
    const degreeTypes = ["associate", "bachelors", "masters", "phd"];

    for (const type of degreeTypes) {
      const progIndex = (university.programs[type] || []).findIndex(p => p._id.toString() === programId);
      if (progIndex !== -1) {
        Object.assign(university.programs[type][progIndex], updateData);
        updated = true;
        break;
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: "Program not found." });
    }

    await university.save();
    res.status(200).json({ success: true, message: "Program updated successfully!", university });
  } catch (error) {
    console.error("Update Program Error:", error);
    res.status(500).json({ success: false, message: "Failed to update program." });
  }
};