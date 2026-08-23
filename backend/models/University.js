const mongoose = require("mongoose");


// ========================================
// PROGRAM SCHEMA
// ========================================

const programSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    degreeLevel: {
      type: String,
      default: ""
    },

    faculty: {
      type: String,
      default: ""
    },

    language: {
      type: String,
      default: "English"
    },

    duration: {
      type: String,
      default: ""
    },

    originalFee: {
      type: Number,
      default: 0
    },

    discountFee: {
      type: Number,
      default: 0
    },

    currency: {
      type: String,
      default: "$"
    },

    applicationFee: {
      type: String,
      default: ""
    },

    requirements: {
      type: String,
      default: ""
    },

    documents: {
      type: String,
      default: ""
    },

    additionalRequirements: {
      type: String,
      default: ""
    },

    intake: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    thesisType: {
      type: String,
      enum: ["Thesis", "Non-Thesis", "N/A"],
      default: "N/A"
    }
  },
  {
    _id: true
  }
);


// ========================================
// UNIVERSITY SCHEMA
// ========================================

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    country: {
      type: String,
      default: "Turkey"
    },

    city: {
      type: String,
      default: ""
    },

    type: {
      type: String,
      default: "Public"
    },

    website: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    },

    image: {
      type: String,
      default: ""
    },

    applicationLink: {
      type: String,
      default: ""
    },


    // ========================================
    // PROGRAMS BY DEGREE TYPE
    // ========================================

    programs: {

      associate: {
        type: [programSchema],
        default: []
      },

      bachelors: {
        type: [programSchema],
        default: []
      },

      masters: {
        type: [programSchema],
        default: []
      },

      phd: {
        type: [programSchema],
        default: []
      }

    }

  },

  {
    timestamps: true
  }
);


module.exports =
  mongoose.model(
    "University",
    universitySchema
  );