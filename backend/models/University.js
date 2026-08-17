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

    description: {
      type: String,
      default: ""
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