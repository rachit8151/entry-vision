const express = require("express");
const router = express.Router();

const UniversityAdmin = require("../models/UniversityAdmin");

// GET profile
router.get("/profile/:regId", async (req, res) => {
  try {
    const admin = await UniversityAdmin.findOne({
      regId: Number(req.params.regId),
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT profile (UPSERT FIXED)
router.put("/profile/:regId", async (req, res) => {
  try {
    const regId = Number(req.params.regId);

    const admin = await UniversityAdmin.findOneAndUpdate(
      { regId },
      req.body,
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Profile update failed",
    });
  }
});

module.exports = router;
