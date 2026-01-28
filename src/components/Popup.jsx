// src/components/Popup.jsx
import "../css/Popup.css";

export default function Popup({ open, data, onClose, onVerify }) {
  if (!open) return null;

  const s = data.student;

  return (
    <div className="popup-overlay">
      <div className="popup-box">

        <h2>Student Info</h2>

        <img
          src={s.photo}
          alt="student"
          className="popup-photo"
        />

        <p><b>Enrollment:</b> {s.enrollmentNo}</p>
        <p><b>Dept:</b> {s.deptName}</p>
        <p><b>Course:</b> {s.courseName}</p>
        <p><b>Year:</b> {s.academicYear}</p>

        <p>
          <b>Restricted:</b>{" "}
          <span className={s.isRestrict ? "badge-red" : "badge-green"}>
            {s.isRestrict ? "YES" : "NO"}
          </span>
        </p>

        <p>
          <b>Suspend:</b>{" "}
          <span className={s.isSuspend ? "badge-red" : "badge-green"}>
            {s.isSuspend ? "YES" : "NO"}
          </span>
        </p>

        <div className="popup-buttons">
          <button className="btn-gray" onClick={onClose}>OK</button>
          <button className="btn-blue" onClick={onVerify}>VERIFY FACE</button>
        </div>

      </div>
    </div>
  );
}
