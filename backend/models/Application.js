const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    country: {
      type: String,
      required: true
    },

    university: {
      type: String,
      required: true
    },

    program: {
      type: String,
      required: true
    },

    level: {
      type: String,
      required: true
    },

    nationality: {
      type: String,
      default: ""
    },

    dob: {
      type: String,
      default: ""
    },

    gender: {
      type: String,
      default: ""
    },

    universityId: {
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

    passportDocument: {
      type: String,
      default: ""
    },

    certificateDocument: {
      type: String,
      default: ""
    },

    diplomaDocument: {
      type: String,
      default: ""
    },

    transcriptDocument: {
      type: String,
      default: ""
    },

    masterDocument: {
      type: String,
      default: ""
    },

    additionalDocuments: {
      type: [String],
      default: []
    },

    message: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      default: "Pending"
    }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);