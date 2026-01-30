const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  deptId: {   // 👈 match exactly with MongoDB
    type: Number,
    required: true,
    unique: true
  },
  deptName: { // 👈 match exactly with MongoDB
    type: String,
    required: true,
    unique: true
  }
}, { collection: 'tblDepartments' });

module.exports = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
