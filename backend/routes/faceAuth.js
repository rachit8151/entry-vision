// backend/routes/faceAuth.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");
const FaceData = require("../models/FaceData");

// --------------------------
// ONNX ArcFace
// --------------------------
let ort = null;
let arcSession = null;
const ARC_MODEL_PATH = path.join(__dirname, "..", "face_models", "arcface.onnx");

try {
  ort = require("onnxruntime-node");
} catch (e) {
  console.log("ArcFace ONNX runtime missing:", e.message);
}

// load ONNX model
async function loadArc() {
  if (!ort) return null;
  if (arcSession) return arcSession;

  if (!fs.existsSync(ARC_MODEL_PATH)) {
    console.log("❌ ArcFace model missing:", ARC_MODEL_PATH);
    return null;
  }

  arcSession = await ort.InferenceSession.create(ARC_MODEL_PATH, {
    executionProviders: ["cpu"]
  });

  console.log("✅ ArcFace session loaded");
  return arcSession;
}

// cosine similarity
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// preprocess + run model
async function runArcface(buffer) {
  const session = await loadArc();
  if (!session) return null;

  const sharp = require("sharp");
  const resized = await sharp(buffer)
    .resize(112, 112)
    .removeAlpha()
    .raw()
    .toBuffer();

  // HWC → CHW + normalize
  const chw = new Float32Array(112 * 112 * 3);
  let hw = 112 * 112;
  for (let i = 0; i < hw; i++) {
    chw[i] = (resized[i * 3] - 127.5) / 128;
    chw[i + hw] = (resized[i * 3 + 1] - 127.5) / 128;
    chw[i + 2 * hw] = (resized[i * 3 + 2] - 127.5) / 128;
  }

  const tensor = new ort.Tensor("float32", chw, [1, 3, 112, 112]);

  const input = session.inputNames[0];
  const out = await session.run({ [input]: tensor });

  const emb = out[session.outputNames[0]].data;

  // L2 normalize
  const norm = Math.sqrt(emb.reduce((a, b) => a + b * b, 0));
  return Array.from(emb).map(x => x / norm);
}

// --------------------------
// MULTER (BUFFER ONLY) — DO NOT SAVE LIVE FRAMES
// --------------------------
const uploadLive = multer({ storage: multer.memoryStorage() });

// --------------------------
// VERIFY FACE
// --------------------------
router.post("/verify", uploadLive.array("faceImages", 10), async (req, res) => {
  try {
    const enrollmentNo = req.body.enrollmentNo?.trim();

    if (!enrollmentNo)
      return res.status(400).json({ success: false, message: "enrollmentNo missing" });

    if (!req.files?.length)
      return res.status(400).json({ success: false, message: "No live images sent" });

    const record = await FaceData.findOne({ enrollmentNo });

    if (!record)
      return res.status(404).json({ success: false, message: "No stored face for this student" });

    // compute live embeddings
    const liveEmbs = [];
    for (const f of req.files) {
      const e = await runArcface(f.buffer);
      if (e) liveEmbs.push(e);
    }

    if (!liveEmbs.length)
      return res.status(500).json({ success: false, message: "Embedding generation failed" });

    // compare with stored
    const stored = record.embeddings.map(e => e.vector);

    let bestSim = -1;
    for (const live of liveEmbs) {
      for (const st of stored) {
        const sim = cosine(live, st);
        if (sim > bestSim) bestSim = sim;
      }
    }

    const matched = bestSim >= 0.75;

    const student = matched
      ? await require("../models/Student").findOne({ enrollmentNo })
      : null;

    return res.json({
      success: matched,
      similarity: bestSim,
      student
    });

  } catch (err) {
    console.error("❌ VERIFY ERROR:", err);
    return res.status(500).json({ success: false, message: "Server verify error" });
  }
});

module.exports = router;
