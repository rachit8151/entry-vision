import React, { useState } from "react";
import axios from "axios";
import Popup from "./Popup";
import StudentVerify from "./StudentVerify";
import "../css/StudentSearch.css";

export default function GuardSearchStudent() {
  const [enrollmentNo, setEnrollmentNo] = useState("");
  const [popup, setPopup] = useState(null);
  const [verifyStudent, setVerifyStudent] = useState(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleSearch = async () => {
    if (!enrollmentNo.trim()) {
      alert("Enter Enrollment No");
      return;
    }

    try {
      const res = await axios.get(`${API}/api/students/search/${encodeURIComponent(enrollmentNo.trim())}`);
      if (res.data?.success) {
        const s = res.data.student;

        setPopup({
          open: true,
          student: {
            enrollmentNo: s.enrollmentNo,
            deptName: s.deptName,
            courseName: s.courseName,
            academicYear: s.academicYear,
            isRestrict: s.isRestrict,
            isSuspend: s.isSuspend,
            // faceDataUrl returned by your API is relative; prefix API for full URL
            photo: s.faceDataUrl ? `${API}${s.faceDataUrl}` : "/images/default-black-profile.png",
          },
        });
      } else {
        alert("Student not found");
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        alert("Student not found");
      } else {
        console.error("Search error:", err);
        alert("Server error while searching student");
      }
    }
  };

  return (
    <div className="container mt-5">
      {/* Search bar */}
      <div className="d-flex justify-content-end mb-4">
        <input
          type="text"
          className="form-control w-25 me-2"
          placeholder="Enter Enrollment No"
          value={enrollmentNo}
          onChange={(e) => setEnrollmentNo(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* Popup */}
      {popup?.open && (
        <Popup
          open={popup.open}
          data={popup}
          onClose={() => setPopup(null)}
          onVerify={() => {
            // Start verify flow for this enrollment
            setVerifyStudent(popup.student.enrollmentNo);
            setPopup(null);
          }}
        />
      )}

      {/* Start Verification component when verifyStudent is set */}
      {verifyStudent && (
        <StudentVerify
          enrollmentNo={verifyStudent}
          onClose={() => {
            setVerifyStudent(null);
            // reload page to reset UI as you requested
            window.location.reload();
          }}
          onResult={(result) => {
            // show popup with result (reuse Popup)
            setPopup({
              open: true,
              student: result.student || { enrollmentNo: verifyStudent },
              result: result,
            });
            // stop verify component UI
            setVerifyStudent(null);
          }}
        />
      )}
    </div>
  );
}
