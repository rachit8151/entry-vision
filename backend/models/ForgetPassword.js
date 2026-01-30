// backend/models/ForgetPassword.js
const mongoose = require("mongoose");

const ForgetPasswordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true,   // ✅ NOT unique
  },
  otpHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 600 }, // auto delete after 10 min
  },
}, {
  collection: "forgetpasswords",
  timestamps: true,
});

module.exports =
  mongoose.models.ForgetPassword ||
  mongoose.model("ForgetPassword", ForgetPasswordSchema);
