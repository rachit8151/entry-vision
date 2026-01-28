// src/components/StudentFaceCapture.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";
import "../css/StudentFaceCapture.css";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.11/wasm";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

// Change this to your backend endpoint if different
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_UPLOAD_PATH = `${API_BASE}/api/faces/upload`; // adjust if your server expects /api/face/store

export default function StudentFaceCapture() {
  // refs
  const liveViewRef = useRef(null);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);

  // models & state
  const [modelReady, setModelReady] = useState(false);
  const [facesCount, setFacesCount] = useState(0);

  // UI fields
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);

  // capture flow
  const [captureIndex, setCaptureIndex] = useState(0); // 0..2
  const [captures, setCaptures] = useState([null, null, null]); // dataURLs
  const [busy, setBusy] = useState(false);
  const angleHints = [
    "Center — look straight at camera",
    "Slight Left — turn head ~15° left",
    "Slight Right — turn head ~15° right",
  ];

  // --- load models ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
        });
        detectorRef.current = detector;
        if (!cancelled) setModelReady(true);
        console.log("✅ MediaPipe FaceDetector ready");
      } catch (err) {
        console.error("Model init failed:", err);
      }
    })();
    return () => {
      cancelled = true;
      try { detectorRef.current?.close?.(); } catch {}
    };
  }, []);

  // --- load departments (backend must provide /api/departments) ---
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/departments`);
        setDepartments(res.data || []);
      } catch (err) {
        console.warn("Could not load departments:", err?.message || err);
        setDepartments([]);
      }
    })();
  }, []);

  // load students when dept selected (backend must provide /api/students/:deptName)
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDept) return;
      setLoadingStudents(true);
      try {
        const res = await axios.get(`${API_BASE}/api/students/${encodeURIComponent(selectedDept)}`);
        setStudents(res.data || []);
      } catch (err) {
        console.warn("Could not load students:", err?.message || err);
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [selectedDept]);

  // start/stop camera when enrollment selected
  useEffect(() => {
    if (!selectedEnrollment) {
      stopCamera();
      resetCaptures();
      return;
    }
    if (!modelReady) return;
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line
  }, [selectedEnrollment, modelReady]);

  // --- camera control ---
  async function startCamera() {
    resetCaptures();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      // start loop
      rafRef.current = requestAnimationFrame(loopDetect);
    } catch (err) {
      console.error("Camera start error:", err);
      alert("Camera access needed — please allow camera permissions.");
    }
  }

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      const s = videoRef.current?.srcObject;
      if (s) s.getTracks().forEach((t) => t.stop());
    } catch {}
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    clearOverlay();
  }

  function resetCaptures() {
    setCaptureIndex(0);
    setCaptures([null, null, null]);
  }

  // --- overlay helpers ---
  function clearOverlay() {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = "";
    setFacesCount(0);
  }

  function drawBox(boxPx, score = 0) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = "";
    const highlighter = document.createElement("div");
    highlighter.className = "mp-highlighter";
    highlighter.style.left = `${Math.round(boxPx.x)}px`;
    highlighter.style.top = `${Math.round(boxPx.y)}px`;
    highlighter.style.width = `${Math.round(boxPx.w)}px`;
    highlighter.style.height = `${Math.round(boxPx.h)}px`;
    overlay.appendChild(highlighter);
    const label = document.createElement("div");
    label.className = "mp-label";
    label.innerText = `Face ${Math.round(score * 100)}%`;
    label.style.left = `${Math.round(boxPx.x)}px`;
    label.style.top = `${Math.max(0, Math.round(boxPx.y) - 28)}px`;
    overlay.appendChild(label);
  }

  // Map MediaPipe bbox (originX/originY/width/height) to screen pixels.
  function mapBoxToScreen(bbox) {
    const video = videoRef.current;
    const live = liveViewRef.current;
    if (!video || !live) return null;
    const vidW = video.videoWidth || 640;
    const vidH = video.videoHeight || 480;
    const containerW = live.clientWidth;
    const containerH = live.clientHeight;
    const videoAspect = vidW / vidH;
    const containerAspect = containerW / containerH;
    let drawW, drawH, offsetX = 0, offsetY = 0;
    if (videoAspect > containerAspect) {
      drawW = containerW;
      drawH = containerW / videoAspect;
      offsetY = (containerH - drawH) / 2;
    } else {
      drawH = containerH;
      drawW = containerH * videoAspect;
      offsetX = (containerW - drawW) / 2;
    }
    // MediaPipe face detector returns bbox in normalized 0..1 for tasks-vision examples, but may also return px.
    // We'll handle both cases.
    let vpX = bbox.originX;
    let vpY = bbox.originY;
    let vpW = bbox.width;
    let vpH = bbox.height;
    if (vpW <= 1 && vpH <= 1) {
      vpX = vpX * vidW;
      vpY = vpY * vidH;
      vpW = vpW * vidW;
      vpH = vpH * vidH;
    }
    const x = offsetX + vpX * (drawW / vidW);
    const y = offsetY + vpY * (drawH / vidH);
    const w = vpW * (drawW / vidW);
    const h = vpH * (drawH / vidH);
    return { x, y, w, h };
  }

  // --- main detector loop (draw only) ---
  async function loopDetect() {
    try {
      const video = videoRef.current;
      if (!video || !detectorRef.current || video.paused || video.ended) {
        rafRef.current = requestAnimationFrame(loopDetect);
        return;
      }

      const nowMs = performance.now();
      const results = detectorRef.current.detectForVideo(video, nowMs);
      const detections = results?.detections || [];
      setFacesCount(detections.length);

      if (detections.length > 0) {
        // pick largest face
        let best = null;
        for (const d of detections) {
          const area = (d.boundingBox?.width || 0) * (d.boundingBox?.height || 0);
          if (!best || area > best.area) best = { d, area };
        }
        const main = best.d;
        const mapped = mapBoxToScreen(main.boundingBox);
        if (mapped) drawBox(mapped, main.categories?.[0]?.score ?? 0);
      } else {
        clearOverlay();
      }
    } catch (err) {
      console.error("Detector loop error:", err);
    } finally {
      rafRef.current = requestAnimationFrame(loopDetect);
    }
  }

  // --- capture helpers ---
  // capture a full frame dataURL (mirrored horizontally to be user-friendly)
  function captureFullFrameDataURL() {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    // mirror so preview matches what user sees
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  // Align & crop using detection (prefer eye keypoints if available)
  // input: detection object (from tasks-vision) and optional padding ratio
  // returns dataURL of cropped aligned face (112..512 px depending)
  async function cropAlignedFaceFromDetection(detection, outSize = 256, padRatio = 0.25) {
    const video = videoRef.current;
    if (!video || !detection) return null;

    // read bounding box in pixel coords relative to video frame
    let bx = detection.boundingBox.originX;
    let by = detection.boundingBox.originY;
    let bw = detection.boundingBox.width;
    let bh = detection.boundingBox.height;
    // if normalized (<=1), convert to pixels:
    if (bw <= 1 && bh <= 1) {
      bx = Math.round(bx * video.videoWidth);
      by = Math.round(by * video.videoHeight);
      bw = Math.round(bw * video.videoWidth);
      bh = Math.round(bh * video.videoHeight);
    }

    // enlarge slightly with pad
    const pad = Math.round(Math.min(bw, bh) * padRatio);
    bx = Math.max(0, bx - pad);
    by = Math.max(0, by - pad);
    bw = Math.min(video.videoWidth - bx, bw + pad * 2);
    bh = Math.min(video.videoHeight - by, bh + pad * 2);

    // compute rotation angle using eye keypoints if available
    // tasks-vision detection.keypoints is array-like: each keypoint has {x,y} (pixel coords or normalized)
    // We'll attempt to use two eyes by finding the two keypoints with minimal y difference near upper box area
    let angleDeg = 0;
    try {
      const keypoints = detection.keypoints || [];
      // convert keypoints to pixel coordinates if normalized
      const kps = keypoints.map((kp) => {
        let kx = kp.x, ky = kp.y;
        if (kx <= 1 && ky <= 1) {
          kx = Math.round(kx * video.videoWidth);
          ky = Math.round(ky * video.videoHeight);
        }
        return { x: kx, y: ky, name: kp.name ?? null };
      });

      // try to find left/right eyes by name (if available)
      let leftEye = kps.find((k) => k.name && k.name.toLowerCase().includes("left"));
      let rightEye = kps.find((k) => k.name && k.name.toLowerCase().includes("right"));
      if (!leftEye || !rightEye) {
        // fallback: pick two keypoints with smallest y (top-most) within bbox: these often correspond to eyes
        const inBox = kps.filter((kp) => kp.x >= bx && kp.x <= bx + bw && kp.y >= by && kp.y <= by + bh);
        if (inBox.length >= 2) {
          const sorted = inBox.sort((a, b) => a.y - b.y).slice(0, 6);
          // choose pair with largest x-distance among top points
          let bestPair = null;
          let bestDist = -1;
          for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
              const d = Math.hypot(sorted[i].x - sorted[j].x, sorted[i].y - sorted[j].y);
              if (d > bestDist) { bestDist = d; bestPair = [sorted[i], sorted[j]]; }
            }
          }
          if (bestPair) {
            leftEye = bestPair[0].x < bestPair[1].x ? bestPair[0] : bestPair[1];
            rightEye = bestPair[0].x < bestPair[1].x ? bestPair[1] : bestPair[0];
          }
        }
      }

      if (leftEye && rightEye) {
        const dy = rightEye.y - leftEye.y;
        const dx = rightEye.x - leftEye.x;
        angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      } else {
        angleDeg = 0;
      }
    } catch (err) {
      angleDeg = 0;
    }

    // draw into an offscreen canvas with rotation then crop central square
    const off = document.createElement("canvas");
    const ow = bw + pad * 2;
    const oh = bh + pad * 2;
    // we'll render larger and then resize to outSize
    off.width = Math.max(ow, oh);
    off.height = Math.max(ow, oh);
    const ctx = off.getContext("2d");

    // center of the extracted area
    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    // draw rotated video frame centered at (cx,cy)
    ctx.translate(off.width / 2, off.height / 2);
    ctx.rotate((-angleDeg * Math.PI) / 180); // negative to rotate face to upright
    // draw video (mirror horizontally to match preview)
    // to keep orientation consistent with preview, mirror along x
    ctx.scale(-1, 1);
    // compute top-left of source rect in video coordinates (we want box centered)
    const sx = cx - off.width / 2;
    const sy = cy - off.height / 2;
    ctx.drawImage(video, sx, sy, off.width, off.height, -off.width / 2, -off.height / 2, off.width, off.height);

    // now crop central square of size min(width,height) (we want face square)
    const cropSize = Math.min(off.width, off.height);
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = outSize;
    cropCanvas.height = outSize;
    const cctx = cropCanvas.getContext("2d");
    // draw central area scaled to outSize
    const srcX = Math.round((off.width - cropSize) / 2);
    const srcY = Math.round((off.height - cropSize) / 2);
    cctx.drawImage(off, srcX, srcY, cropSize, cropSize, 0, 0, outSize, outSize);

    return cropCanvas.toDataURL("image/jpeg", 0.9);
  }

  // capture slot handler (uses latest detection if possible; otherwise falls back to full-frame capture)
  async function handleCaptureClick() {
    if (!selectedEnrollment) {
      alert("Select enrollment first");
      return;
    }
    setBusy(true);
    try {
      const video = videoRef.current;
      if (!video) throw new Error("Camera not ready");
      // attempt to get latest detection (we call detectForVideo once more synchronously)
      let dataUrl = null;
      try {
        const results = detectorRef.current.detectForVideo(video, performance.now());
        const detections = results?.detections || [];
        if (detections.length > 0) {
          // pick largest face
          let best = null;
          for (const d of detections) {
            const area = (d.boundingBox?.width || 0) * (d.boundingBox?.height || 0);
            if (!best || area > best.area) best = { d, area };
          }
          const main = best.d;
          dataUrl = await cropAlignedFaceFromDetection(main, 256, 0.28);
        }
      } catch (err) {
        console.warn("Detection capture attempt failed:", err);
      }

      // fallback: capture full-frame if crop failed
      if (!dataUrl) dataUrl = captureFullFrameDataURL();
      if (!dataUrl) throw new Error("Capture failed");

      // save capture into current index
      const newCaptures = [...captures];
      newCaptures[captureIndex] = dataUrl;
      setCaptures(newCaptures);

      // if not last slot, advance to next slot automatically (so preview -> next)
      if (captureIndex < 2) {
        setCaptureIndex((ci) => ci + 1);
      }
    } catch (err) {
      console.error("Capture error:", err);
      alert("Capture failed — see console");
    } finally {
      setBusy(false);
    }
  }

  // Retake current (sets current slot to null so user can capture again)
  function handleRetake() {
    // set current slot to null (the preview shows current captureIndex)
    const idx = captureIndex;
    const newCaptures = [...captures];
    if (idx >= 0 && idx <= 2) newCaptures[idx] = null;
    setCaptures(newCaptures);
  }

  function handleNextAfterPreview() {
    if (captureIndex < 2) setCaptureIndex((c) => c + 1);
  }
  function handleBack() {
    if (captureIndex > 0) setCaptureIndex((c) => c - 1);
  }

  // save all: upload 3 images as faceImages and include enrollmentNo
  async function handleSaveAll() {
    if (captures.filter(Boolean).length !== 3) {
      alert("Please capture all 3 photos before saving.");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("enrollmentNo", selectedEnrollment);
      // append in order 01,02,03 naming convention
      for (let i = 0; i < 3; i++) {
        const blob = await (await fetch(captures[i])).blob();
        const filename = `${selectedEnrollment}_${String(i + 1).padStart(2, "0")}.jpg`;
        form.append("faceImages", blob, filename);
      }

      const res = await axios.post(API_UPLOAD_PATH, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        showPopup("Saved 3 photos successfully ✔", "success");
        resetCaptures();
      } else {
        console.warn("Upload response:", res.data);
        showPopup("Save failed — check server logs", "error");
      }
    } catch (err) {
      console.error("SaveAll error:", err);
      showPopup("Save failed — see console", "error");
    } finally {
      setBusy(false);
    }
  }

  function showPopup(message, type = "success") {
    const popup = document.createElement("div");
    popup.className = `capture-popup ${type}`;
    popup.innerText = message;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add("show"), 10);
    setTimeout(() => {
      popup.classList.remove("show");
      setTimeout(() => popup.remove(), 300);
    }, 2000);
  }

  // current preview to show (for preview area)
  const currentPreview = captures[captureIndex];

  return (
    <div className="mp-face-capture-root">
      <h2>📸 Student Face Capture — Step by step</h2>
      <p className="subtitle">Capture 3 photos: Center, Slight Left (~15°), Slight Right (~15°). Use Preview → Retake → Next</p>

      <div className="field-row">
        <label>Department</label>
        <select value={selectedDept} onChange={(e) => { setSelectedDept(e.target.value); setStudents([]); setSelectedEnrollment(""); }}>
          <option value="">-- Choose Department --</option>
          {departments.map(d => <option key={d.deptId} value={d.deptName}>{d.deptName}</option>)}
        </select>
      </div>

      <div className="field-row">
        <label>Enrollment No</label>
        <select value={selectedEnrollment} onChange={(e) => setSelectedEnrollment(e.target.value)}>
          <option value="">{loadingStudents ? "Loading..." : "-- Choose Enrollment --"}</option>
          {students.map(s => <option key={s.enrollmentNo} value={s.enrollmentNo}>{s.enrollmentNo}{s.firstName ? ` - ${s.firstName}` : ""}</option>)}
        </select>
      </div>

      <div className="capture-stage">
        <div ref={liveViewRef} className="mp-liveview">
          <video ref={videoRef} className="mp-video" playsInline muted style={{ transform: "rotateY(180deg)" }} />
          <div ref={overlayRef} className="mp-overlay" />
          <div className="mp-controls">
            <div className="faces-count">Faces: {facesCount}</div>
            <div className={`model-status ${modelReady ? "ready" : "loading"}`}>{modelReady ? "Model Ready" : "Loading models..."}</div>
          </div>
        </div>

        <div className="capture-panel">
          <div className="hint">{angleHints[captureIndex]}</div>

          <div className="preview-area">
            {currentPreview ? (
              <img src={currentPreview} alt={`Preview ${captureIndex + 1}`} className="preview-img" />
            ) : (
              <div className="preview-placeholder">No photo yet for step {captureIndex + 1}</div>
            )}
          </div>

          <div className="capture-buttons">
            {!currentPreview ? (
              <button onClick={handleCaptureClick} className="btn-capture" disabled={!modelReady || busy || !selectedEnrollment}>
                {busy ? "Capturing..." : `Capture Photo ${captureIndex + 1}`}
              </button>
            ) : (
              <>
                <button onClick={handleRetake} className="btn-retake" disabled={busy}>Retake</button>
                {captureIndex < 2 ? (
                  <button onClick={handleNextAfterPreview} className="btn-next" disabled={busy}>Next</button>
                ) : (
                  <button onClick={handleSaveAll} className="btn-save" disabled={busy}>Save All (3 Photos)</button>
                )}
                {captureIndex > 0 && <button onClick={handleBack} className="btn-back">Back</button>}
              </>
            )}
          </div>

          <div className="captured-thumbs">
            {captures.map((c, i) => (
              <div key={i} className={`thumb ${c ? "filled" : ""}`}>
                <div className="thumb-index">{i + 1}</div>
                {c ? <img src={c} alt={`cap-${i}`} /> : <div className="thumb-empty">—</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
