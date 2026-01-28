// src/components/About.jsx
import React from "react";
import "../css/About.css";

const About = () => {
  return (
    <div className="about-wrapper">

      {/* LEFT: video shown like an image */}
      <div className="about-left">
        <div className="video-frame">
          <video
            src="/anim/RotateLogo.mp4"
            className="about-video"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>


      {/* RIGHT: content */}
      <div className="about-right fade-in">
        <h1 className="about-title">About Us</h1>

        <p className="about-text">
          The <span>Smart Campus Entry System</span> is an advanced security and
          automation platform designed to ensure that only authorized individuals
          can access university premises.
        </p>

        <p className="about-text">
          Our system integrates <span>role-based access control</span>,{" "}
          <span>AI-powered face recognition</span>, and{" "}
          <span>real-time monitoring</span> to provide a secure and efficient
          entry process for students, faculty, staff, and visitors.
        </p>

        <p className="about-text">
          With powerful dashboards for Admins, automated verification for
          Security Guards, and smart tracking of logs, the system improves
          accuracy, transparency, and overall campus safety.
        </p>

        <div className="about-highlights">
          <div className="highlight-box">
            <h3>🔐 Secure Access</h3>
            <p>Multi-role authentication keeps your campus protected.</p>
          </div>

          <div className="highlight-box">
            <h3>🧠 AI Face Recognition</h3>
            <p>Fast, accurate, and automatic identity validation.</p>
          </div>

          <div className="highlight-box">
            <h3>📊 Smart Analytics</h3>
            <p>Track visitors, students, and logs in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
