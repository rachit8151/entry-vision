// backend/models/UniversityAdmin.js
const mongoose = require("mongoose");

const UniversityAdminSchema = new mongoose.Schema(
  {
    regId: {
      type: Number,
      required: true,
      unique: true,
    },
    adminId: {
      type: String,
      sparse: true,
      unique: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
    },
    aadharNo: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^[0-9]{12}$/, "Invalid Aadhar number (must be 12 digits)"],
    },
    address: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
      match: [/^[0-9]{6}$/, "Invalid pincode (must be 6 digits)"],
    },
    photoUrl: {
      type: String,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
  },
  { collection: "tblUniversityAdmin", timestamps: true }
);

module.exports = mongoose.models.UniversityAdmin || mongoose.model("UniversityAdmin", UniversityAdminSchema);
