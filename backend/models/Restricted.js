const mongoose = require("mongoose");

const RestrictedSchema = new mongoose.Schema(
  {
    enrollmentNo: { type: String, required: true },

    reason: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    durationDays: { type: Number, required: true }, // calculated server-side

    createdBy: { type: Number, required: true }, // University Admin ID
  },
  {
    timestamps: true,
    collection: "tblRestricted",
  }
);

module.exports = mongoose.model("Restricted", RestrictedSchema);
