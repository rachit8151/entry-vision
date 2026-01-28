// src/components/StudentRestrict.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/StudentRestrict.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const StudentRestrict = () => {
  const [departments, setDepartments] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const adminId = sessionStorage.getItem("regId");

  useEffect(() => {
    axios.get(`${API}/api/departments`).then((res) => setDepartments(res.data));
  }, []);

  const fetchStudents = (dept) => {
    axios
      .get(`${API}/api/restrict/students/${dept}`)
      .then((res) => setStudents(res.data.students));
  };

  const handleSubmit = async () => {
    if (!reason || !startDate || !endDate) {
      alert("Please fill all fields.");
      return;
    }

    await axios.post(`${API}/api/restrict/restrict`, {
      enrollmentNo: selectedStudent,
      reason,
      startDate,
      endDate,
      adminId,
    });

    alert("Student restricted successfully!");
    setTimeout(() => {
      window.location.href = "/UniAdminDash";
    }, 1000); // 1 second delay
    setShowPopup(false);
  };

  return (
    <div className="restrict-container">
      <div className="container mt-4">
        <h2>Restrict Student</h2>

        <div className="mb-3">
          <label>Department</label>
          <select
            className="form-control"
            onChange={(e) => {
              setSelectedDept(e.target.value);
              fetchStudents(e.target.value);
            }}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.deptId} value={d.deptName}>
                {d.deptName}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Student</label>
          <select
            className="form-control"
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="">Select Student</option>
            {students.map((s) => (
              <option key={s.enrollmentNo} value={s.enrollmentNo}>
                {s.enrollmentNo} - {s.firstName} {s.lastName}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-danger"
          disabled={!selectedStudent}
          onClick={() => setShowPopup(true)}
        >
          Restrict
        </button>

        {showPopup && (
          <div className="popup">
            <div className="popup-box">
              <h4>Restrict Student</h4>

              <p><b>Enrollment:</b> {selectedStudent}</p>

              <label>Reason</label>
              <textarea
                className="form-control"
                onChange={(e) => setReason(e.target.value)}
              />

              <label>Start Date</label>
              <input
                type="date"
                className="form-control"
                onChange={(e) => setStartDate(e.target.value)}
              />

              <label>End Date</label>
              <input
                type="date"
                className="form-control"
                onChange={(e) => setEndDate(e.target.value)}
              />

              <button className="btn btn-success mt-3" onClick={handleSubmit}>
                Confirm
              </button>

              <button
                className="btn btn-secondary mt-3 ms-2"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentRestrict;
