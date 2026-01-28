// src/components/StudentVerify.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm";

const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function StudentVerify({ enrollmentNo, onResult, onClose }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const liveRef = useRef(null);

  const detectorRef = useRef(null);
  const rafRef = useRef(null);

  const [modelReady, setModelReady] = useState(false);
  const [facesCount, setFacesCount] = useState(0);
  const [status, setStatus] = useState("Idle");
  const [busy, setBusy] = useState(false);

  const FRAMES = 5; // capture 5 frames

  // ---------------- INIT MODELS ----------------
  useEffect(() => {
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: FACE_MODEL },
        runningMode: "VIDEO",
      });
      detectorRef.current = detector;
      setModelReady(true);
    })();
  }, []);

  // ---------------- CAMERA ----------------
  async function startCamera() {
    setStatus("Opening camera...");
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    setStatus("Camera ready");
    loopDetect();
  }

  function stopCamera() {
    cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }

  // ---------------- DETECTION LOOP ----------------
  function loopDetect() {
    const video = videoRef.current;
    if (!video || video.paused || !detectorRef.current) {
      rafRef.current = requestAnimationFrame(loopDetect);
      return;
    }

    const results = detectorRef.current.detectForVideo(video, performance.now());
    const detections = results?.detections || [];
    setFacesCount(detections.length);

    // draw overlay
    const overlay = overlayRef.current;
    overlay.innerHTML = "";
    if (detections.length > 0) {
      const d = detections[0];
      const box = d.boundingBox;

      const div = document.createElement("div");
      div.style.position = "absolute";
      div.style.left = box.originX + "px";
      div.style.top = box.originY + "px";
      div.style.width = box.width + "px";
      div.style.height = box.height + "px";
      div.style.border = "3px solid #00ff99";
      overlay.appendChild(div);
    }

    rafRef.current = requestAnimationFrame(loopDetect);
  }

  // ---------------- CAPTURE ----------------
  async function captureOne() {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const blob = await (await fetch(dataUrl)).blob();
    return blob;
  }

  // ---------------- VERIFY ----------------
  async function handleVerify() {
    if (busy) return;
    if (!enrollmentNo) return alert("Enrollment number missing");

    setBusy(true);
    setStatus("Capturing 5 frames...");

    const frames = [];
    for (let i = 0; i < FRAMES; i++) {
      const blob = await captureOne();
      frames.push(blob);
      await new Promise((res) => setTimeout(res, 350));
    }

    const fd = new FormData();
    fd.append("enrollmentNo", enrollmentNo);
    frames.forEach((b, i) => fd.append("faceImages", b, `live_${i}.jpg`));

    setStatus("Sending to server...");

    const res = await axios.post(`${API}/api/face/verify`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    stopCamera();

    if (onResult) onResult(res.data);
  }

  // ---------------- UI ----------------
  return (
    <div style={{ padding: 10 }}>
      <h3>Live Face Verification</h3>

      <button onClick={startCamera} disabled={!modelReady || busy}>
        Start Camera
      </button>

      <button onClick={handleVerify} disabled={!modelReady || busy} style={{ marginLeft: 10 }}>
        {busy ? "Verifying..." : "Verify Face"}
      </button>

      <button onClick={onClose} style={{ marginLeft: 10 }}>
        Close
      </button>

      <div
        ref={liveRef}
        style={{ width: 480, height: 360, background: "#000", marginTop: 12, position: "relative" }}
      >
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div ref={overlayRef} style={{ position: "absolute", inset: 0 }} />
      </div>

      <div style={{ marginTop: 10 }}>
        <strong>Status:</strong> {status} &nbsp; | &nbsp;
        <strong>Faces:</strong> {facesCount}
      </div>
    </div>
  );
}
