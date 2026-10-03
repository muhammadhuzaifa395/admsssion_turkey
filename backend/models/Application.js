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

    fatherName: {
      type: String,
      default: ""
    },

    motherName: {
      type: String,
      default: ""
    },

    passportNumber: {
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
    },

    offerLetter: {
      type: String,
      default: ""
    },

    feeSlip: {
      type: String,
      default: ""
    },

    finalAcceptanceLetter: {
      type: String,
      default: ""
    },

    documentStatuses: {
      passport: { type: String, default: "Under Review" },
      certificate: { type: String, default: "Under Review" },
      diploma: { type: String, default: "Under Review" },
      transcript: { type: String, default: "Under Review" },
      master: { type: String, default: "Under Review" }
    },

    documentNotes: {
      passport: { type: String, default: "" },
      certificate: { type: String, default: "" },
      diploma: { type: String, default: "" },
      transcript: { type: String, default: "" },
      master: { type: String, default: "" }
    },

    timeline: [
      {
        title: { type: String },
        description: { type: String },
        date: { type: Date, default: Date.now },
        completed: { type: Boolean, default: false },
        current: { type: Boolean, default: false }
      }
    ],

    counselorMessages: [
      {
        sender: { type: String, default: "Counselor" },
        text: { type: String, required: true },
        date: { type: Date, default: Date.now }
      }
    ]
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);