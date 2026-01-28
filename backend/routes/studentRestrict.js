const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Restricted = require("../models/Restricted");

// Fetch students by department
router.get("/students/:deptName", async (req, res) => {
  try {
    const students = await Student.find(
      { deptName: req.params.deptName },
      { enrollmentNo: 1, firstName: 1, lastName: 1 }
    );

    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restrict Student
router.post("/restrict", async (req, res) => {
  try {
    const { enrollmentNo, reason, startDate, endDate, adminId } = req.body;

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    const durationDays =
      Math.ceil((eDate - sDate) / (1000 * 60 * 60 * 24));

    // Set only restrict flag on student
    await Student.updateOne(
      { enrollmentNo },
      { $set: { isRestrict: true } }
    );

    // Insert log
    await Restricted.create({
      enrollmentNo,
      reason,
      startDate: sDate,
      endDate: eDate,
      durationDays,
      createdBy: adminId,
    });

    res.json({ success: true, message: "Student restricted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
