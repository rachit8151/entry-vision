const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  courseId: { type: Number, required: true, unique: true },
  courseName: { type: String, required: true },
  deptId: { type: Number, required: true }, // foreign reference to Department.deptId
}, { collection: "tblCourses" });

module.exports = mongoose.models.Course || mongoose.model("Course", CourseSchema);
