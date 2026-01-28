// ==========================================
// ✅ FRONTEND LOGIN COMPONENT (Final)
// ==========================================
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../css/Login.css";

const Login = ({ showAlert, setIsLoggedIn }) => {
  const [credentials, setCredentials] = useState({ identifier: "", password: "" });
  const [popup, setPopup] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [userId, setUserId] = useState(null);
  const [dId, setDId] = useState(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ==========================================
  // ✅ INPUT HANDLER
  // ==========================================
  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // ==========================================
  // ✅ INPUT VALIDATION
  // ==========================================
  const validateInput = () => {
    const { identifier, password } = credentials;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[a-zA-Z0-9._]{3,}$/;

    if (!identifier) {
      showAlert("Please enter username or email", "warning");
      return false;
    }

    if (!emailRegex.test(identifier) && !usernameRegex.test(identifier)) {
      showAlert("Invalid username or email format", "warning");
      return false;
    }

    if (!password || password.length < 6) {
      showAlert("Password must be at least 6 characters", "warning");
      return false;
    }

    return true;
  };

  // ==========================================
  // ✅ LOGIN REQUEST
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInput()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/login`,
        {
          identifier: credentials.identifier,
          password: credentials.password,
        },
        { headers: { "Content-Type": "application/json" } } // ✅ important
      );

      const data = res.data;

      // 🔹 If first-time login => Show password popup
      if (data.forceChange) {
        setUserId(data.userId);
        setDId(data.user.dId);
        setPopup(true);
        showAlert("First-time login detected. Please change your password.", "info");
        return;
      }

      if (!data.user || !data.user.roleId) {
        showAlert("No user role found. Access denied.", "danger");
        return;
      }

      // 🔐 Save token and session data
      localStorage.setItem("token", data.authToken);
      sessionStorage.setItem("username", data.user.username);
      sessionStorage.setItem("roleId", data.user.roleId);
      // sessionStorage.setItem("regId", data.userId);
      // console.log("✅ Stored reg ID:", data.userId);
      if (data.user.regId) {
        sessionStorage.setItem("regId", data.user.regId);
        console.log("✅ Stored regId:", data.user.regId);
      } else {
        console.warn("⚠️ regId not found in user object!");
      }
      // ✅ Store HOD dId only if present
      if (data.user.dId) {
        sessionStorage.setItem("dId", data.user.dId);
        console.log("✅ Stored HOD Department ID:", data.user.dId);
      } else {
        console.log("⚠️ No dId found for this user.");
      }
      // ✅ Store Security Guard sgId only if present
      if (data.user.sgId) {
        sessionStorage.setItem("sgId", data.user.sgId);
        console.log("✅ Stored Security Guard ID:", data.user.sgId);
      } else {
        console.log("⚠️ No sgId found for this user.");
      }

      setIsLoggedIn(true);

      // 🔀 Navigate by role
      switch (data.user.roleId) {
        case 1:
          navigate("/UniAdminDash");
          break;
        case 2:
          navigate("/HODDash");
          break;
        case 3:
          navigate("/GuardDash");
          break;
        default:
          showAlert("Unauthorized access. Contact admin.", "danger");
          return;
      }
      showAlert("Logged in successfully!", "success");
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data) {
        const backendMsg =
          err.response.data.error ||
          err.response.data.message ||
          "Something went wrong. Please try again.";
        showAlert(backendMsg, "danger");
      }
      else if (err.request) {
        showAlert("Unable to reach the server. Check your internet or backend.", "warning");
      }
      else {
        showAlert("Unable to reach the server. Check your internet or backend.", "warning");
      }
    }
  };

  // ==========================================
  // ✅ CHANGE PASSWORD HANDLER (first login)
  // ==========================================
  const handleChangePassword = async () => {
    if (!newPass || newPass.length < 6) {
      showAlert("Password must be at least 6 characters", "warning");
      return;
    }

    try {
      // 🔹 For first-time login (no JWT yet)
      await axios.post(`${API_BASE}/api/changePassword/firstTimeChange`, {
        userId,
        newPassword: newPass,
      });

      showAlert("Password changed successfully. Please login again.", "success");
      setPopup(false);
      setNewPass("");
      setCredentials({ identifier: "", password: "" });
      navigate("/login");
    } catch (err) {
      console.error("Change password error:", err);
      showAlert("Error changing password. Try again.", "danger");
    }
  };

  // ==========================================
  // ✅ COMPONENT UI
  // ==========================================
  return (
    <div className="login-page">
      <div className="login-box">

        <h2 className="login-title">Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            {/* <label className="form-label">Username or Email</label> */}
            <input
              type="text"
              name="identifier"
              className="underline-input"
              placeholder="Enter username or email"
              value={credentials.identifier}
              onChange={onChange}
            />
          </div>

          <div className="mb-4">
            {/* <label className="form-label">Password</label> */}
            <input
              type="password"
              name="password"
              className="underline-input"
              placeholder="Enter password"
              value={credentials.password}
              onChange={onChange}
            />
          </div>

          <div className="d-grid gap-2">
            <button type="submit" className="login-btn">
              Login
            </button>
          </div>

          <p className="mt-3 text-center">
            <Link to="/forgetPassword" className="login-link">
              Forgot Password?
            </Link>
          </p>
        </form>
      </div>

      {/* 🔒 First-time password popup */}
      {popup && (
        <div className="popup-overlay">
          <div className="popup-box shadow-lg p-4 rounded bg-white">
            <h4 className="mb-3 text-center">Change Your Password</h4>
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Enter new password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-success" onClick={handleChangePassword}>
                Update
              </button>
              <button className="btn btn-secondary" onClick={() => setPopup(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
