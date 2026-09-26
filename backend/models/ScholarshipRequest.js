const mongoose = require("mongoose");

const scholarshipRequestSchema = new mongoose.Schema(
  {
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship"
    },
    universityName: {
      type: String,
      required: true
    },
    studentName: {
      type: String,
      required: true
    },
    studentEmail: {
      type: String,
      required: true
    },
    studentPhone: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["Pending", "Contacted", "Closed"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ScholarshipRequest", scholarshipRequestSchema);
