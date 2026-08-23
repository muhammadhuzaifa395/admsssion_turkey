const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      default: ""
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["user", "admin", "subadmin"],
      default: "user"
    },

    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
      default: null
    }
  },

  {
    timestamps: true
  }
);

module.exports =
  mongoose.model(
    "User",
    userSchema
  );