//npm install csvtojson
// npm install axios
//npm install stream-browserify
//npm install stream-browserify buffer process

import React, { useState, useRef } from "react";
import axios from "axios";
import StudentFaceCapture from "./StudentFaceCapture";
import "../css/BulkInsert.css";

const BulkStudentInsert = ({ showAlert }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null); // ✅ Reference to file input

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const handleUpload = async () => {
    if (!file) {
      setMessage("❌ Please select an Excel (.xlsx) file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/universityAdmin/uploadStudents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Show result message
      setMessage(
        `${res.data.message}${res.data.duplicates?.length && res.data.duplicates[0] !== "None"
          ? "\nDuplicate Enrollment Nos: " + res.data.duplicates.join(", ")
          : ""
        }`
      );

      // ✅ Reset file input & state after successful upload
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // clear file input visually
      showAlert && showAlert("✅ File uploaded successfully!", "success");

    } catch (err) {
      console.error("❌ Upload error:", err);
      setMessage("❌ Upload failed. Please check Excel format or server logs.");
      showAlert && showAlert("❌ Upload failed!", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-container">

      <div className="bulk-box">
        <h3>📘 Bulk Student Insertion</h3>
        <p>Upload an Excel (.xlsx) file containing student details.</p>

        <div className="mt-4">
          <input
            ref={fileInputRef} // ✅ reference to clear input
            type="file"
            accept=".xlsx"
            onChange={(e) => setFile(e.target.files[0])}
            className="form-control mb-3"
            style={{ maxWidth: "400px", margin: "auto" }}
          />

          <button
            className="btn btn-success"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Uploading..." : "Upload Excel"}
          </button>
        </div>

        {message && (
          <div
            className={`alert mt-4 ${message.startsWith("✅")
              ? "alert-success"
              : message.startsWith("❌")
                ? "alert-danger"
                : "alert-info"
              }`}
            style={{ maxWidth: "600px", margin: "auto", whiteSpace: "pre-line" }}
          >
            {message}
          </div>
        )}

        {/* ✅ Show the StudentFaceCapture component only after upload */}
        <div className="mt-5">
          <StudentFaceCapture />
        </div>
      </div>
    </div>
  );
};

export default BulkStudentInsert;
