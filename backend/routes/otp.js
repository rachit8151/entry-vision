// backend/routes/otp.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ForgetPassword = require('../models/ForgetPassword');
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ------------------------------------------
// ✉️ Create reusable mail transporter
// ------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// ------------------------------------------
// 🔢 Generate random 6-digit OTP
// ------------------------------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ==========================================
// 🆕 SEND OTP FOR SIGNUP (no user check)
// ==========================================
router.post("/signup-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email required" });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    // delete old OTPs for same email
    await ForgetPassword.deleteMany({ email });

    await ForgetPassword.create({
      email,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // mailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "🔐 Signup OTP - Smart Campus Entry",
      text: `Your OTP is: ${otp}\nValid for 10 minutes.`,
    });

    return res.json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error("❌ Signup OTP error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to send OTP",
    });
  }
});
// ==========================================
// 🆕 VERIFY SIGNUP OTP
// ==========================================
router.post('/verify-signup', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ success: false, error: 'Email and OTP are required' });

  try {
    const record = await ForgetPassword.findOne({ email });
    if (!record)
      return res.status(400).json({ success: false, error: 'OTP not found or expired.' });

    if (new Date() > record.expiresAt) {
      await ForgetPassword.deleteOne({ email });
      return res.status(400).json({ success: false, error: 'OTP expired.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch)
      return res.status(400).json({ success: false, error: 'Invalid OTP.' });

    await ForgetPassword.deleteOne({ email });
    res.json({ success: true, message: 'Signup OTP verified successfully!' });
  } catch (err) {
    console.error('Verify Signup OTP Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});


// ==========================================
// ✅ SEND OTP (FOR FORGOT PASSWORD)
// ==========================================
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, error: 'Email not registered.' });

    const otp = generateOTP();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await ForgetPassword.findOneAndUpdate(
      { email },
      { email, otpHash, expiresAt },
      { upsert: true, new: true }
    );

    const html = `
      <div style="font-family: Arial; line-height: 1.5;">
        <h3>Smart Campus Entry System</h3>
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      </div>
    `;

    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: 'Smart Campus - Password Reset OTP',
      html,
    });

    res.json({ success: true, message: 'OTP sent successfully!' });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ==========================================
// ✅ VERIFY OTP (FOR FORGOT PASSWORD)
// ==========================================
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ success: false, error: 'Email and OTP are required.' });

  try {
    const record = await ForgetPassword.findOne({ email });
    if (!record)
      return res.status(400).json({ success: false, error: 'OTP not found or expired.' });

    if (new Date() > record.expiresAt) {
      await ForgetPassword.deleteOne({ email });
      return res.status(400).json({ success: false, error: 'OTP expired.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch)
      return res.status(400).json({ success: false, error: 'Invalid OTP.' });

    await ForgetPassword.deleteOne({ email });
    res.json({ success: true, message: 'OTP verified successfully!' });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ==========================================
// ✅ FORGET PASSWORD AFTER OTP VERIFICATION
// ==========================================
router.post('/resetPassword', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword)
    return res.status(400).json({ success: false, error: 'Email and new password required.' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, error: 'User not found.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.status = true; // if you want to mark verified
    await user.save();

    res.json({ success: true, message: 'Password reset successful! You can now log in.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

module.exports = router;
