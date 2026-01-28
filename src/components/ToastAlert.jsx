// import React, { useEffect } from "react";
// import "../css/ToastAlert.css";

// const ToastAlert = ({ type, message, onClose }) => {
//   useEffect(() => {
//     const timer = setTimeout(() => onClose(), 2500);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className={`toast-alert ${type}`}>
//       <strong>{type === "success" ? "Success" : type === "error" ? "Error" : "Warning"}</strong>
//       <small>{message}</small>
//     </div>
//   );
// };

// export default ToastAlert;
