const mongoose = require("mongoose");

const scholarshipSchema = new mongoose.Schema(
  {
    universityName: {
      type: String,
      required: true,
      trim: true
    },
    programName: {
      type: String,
      default: "All Bachelor Programs",
      trim: true
    },
    image: {
      type: String,
      default: ""
    },
    normalPrice: {
      type: Number,
      default: 0
    },
    oneTimeFee: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "USD"
    },
    isSoldOut: {
      type: Boolean,
      default: false
    },
    note: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Scholarship", scholarshipSchema);
