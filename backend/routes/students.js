const express = require("express");
const router = express.Router();
const Student = require('../models/Student');
const FaceData = require("../models/FaceData");
const Restricted = require("../models/Restricted");
/* =====================================================
   ✅ SECTION 1 — Fetch students by Department (for face capture)
===================================================== */
router.get("/:deptName", async (req, res) => {
  try {
    const deptName = decodeURIComponent(req.params.deptName); // handle spaces like "Int MSc.IT"
    console.log("✅ Department requested:", deptName);

    // Find all students with matching department name
    const students = await Student.find(
      { deptName: deptName },
      { enrollmentNo: 1, firstName: 1, lastName: 1, _id: 0 }
    );

    if (!students || students.length === 0) {
      console.log("⚠️ No students found for:", deptName);
      return res.status(200).json([]); // ✅ Return empty array instead of 404
    }

    // Get already captured faces
    const capturedFaces = await FaceData.find({}, { enrollmentNo: 1, _id: 0 });
    const capturedEnrollmentNos = capturedFaces.map((f) => f.enrollmentNo);

    // Filter out captured students
    const availableStudents = students.filter(
      (stu) => !capturedEnrollmentNos.includes(stu.enrollmentNo)
    );

    console.log("✅ Available Students:", availableStudents);

    res.status(200).json(availableStudents);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/* =====================================================
   ✅ SECTION 2 — Search Student by EnrollmentNo
      (Used by Security Guard Search Page)
===================================================== */
router.get("/search/:enrollmentNo", async (req, res) => {
  try {
    const query = req.params.enrollmentNo.trim();
    console.log("📌 Search request for:", query);

    // 1️⃣ Find student in DB
    const student = await Student.findOne({
      enrollmentNo: { $regex: new RegExp("^" + query + "$", "i") },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // 2️⃣ AUTO-REMOVE EXPIRED RESTRICTIONS
    const restricted = await Restricted.findOne({
      enrollmentNo: student.enrollmentNo,
    });

    if (restricted && restricted.endDate < new Date()) {
      console.log("⚠️ Restriction expired — updating student");

      await Student.updateOne(
        { enrollmentNo: student.enrollmentNo },
        { $set: { isRestrict: false } }
      );

      await Restricted.deleteOne({ enrollmentNo: student.enrollmentNo });
      student.isRestrict = false; // update object in memory too
    }

    // 3️⃣ Fetch face image
    // 3️⃣ Fetch face image
    const face = await FaceData.findOne(
      { enrollmentNo: student.enrollmentNo },
      { photoUrls: 1 }
    );

    // 4️⃣ Return final data
    res.json({
      success: true,
      student: {
        enrollmentNo: student.enrollmentNo,
        deptName: student.deptName,
        courseName: student.courseName,
        academicYear: student.academicYear,
        isRestrict: student.isRestrict,
        isSuspend: student.isSuspend,
        faceDataUrl: face ? face.photoUrls[0] : null, // <-- FIXED
      },
    });

  } catch (err) {
    console.error("❌ Search Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error searching student",
    });
  }
});

module.exports = router;
