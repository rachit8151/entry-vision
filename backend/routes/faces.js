// backend/routes/faceUpload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const FaceData = require("../models/FaceData");

// ArcFace for embedding
const ort = require("onnxruntime-node");
const sharp = require("sharp");

const ARC_MODEL_PATH = path.join(__dirname, "..", "face_models", "arcface.onnx");
let arcSession = null;

// Load ONNX model once
async function loadArcFace() {
  if (!arcSession) {
    arcSession = await ort.InferenceSession.create(ARC_MODEL_PATH, {
      executionProviders: ["cpu"],
    });
    console.log("✅ ArcFace model loaded for FACE CAPTURE");
  }
  return arcSession;
}

// Generate embedding from image file path
async function generateEmbedding(filePath) {
  const session = await loadArcFace();

  const resized = await sharp(filePath)
    .resize(112, 112)
    .removeAlpha()
    .raw()
    .toBuffer();

  const chw = new Float32Array(112 * 112 * 3);
  let hw = 112 * 112;

  for (let i = 0; i < hw; i++) {
    chw[i] = (resized[i * 3] - 127.5) / 128;
    chw[i + hw] = (resized[i * 3 + 1] - 127.5) / 128;
    chw[i + 2 * hw] = (resized[i * 3 + 2] - 127.5) / 128;
  }

  const tensor = new ort.Tensor("float32", chw, [1, 3, 112, 112]);

  const out = await session.run({ [session.inputNames[0]]: tensor });
  const emb = Array.from(out[session.outputNames[0]].data);

  // Normalize
  const norm = Math.sqrt(emb.reduce((a, b) => a + b * b, 0));
  return emb.map((x) => x / norm);
}

// --------------------
// UPLOAD FOLDER
// --------------------
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "students_photos");
fs.ensureDirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const enrollmentNo = req.body.enrollmentNo;
    const index = req._fileIndex++;
    const padded = String(index).padStart(2, "0");
    cb(null, `${enrollmentNo}_${padded}.jpg`);
  },
});

const upload = multer({ storage });

// --------------------
// MAIN ROUTE
// --------------------
router.post("/upload", (req, res, next) => {
  req._fileIndex = 1;
  next();
}, upload.array("faceImages", 3), async (req, res) => {
  try {
    const enrollmentNo = req.body.enrollmentNo;
    const files = req.files;

    if (!files || files.length !== 3) {
      return res.status(400).json({ success: false, message: "Need exactly 3 images" });
    }

    // Save URLs
    const photoUrls = files.map((f) => `/uploads/students_photos/${f.filename}`);

    // Generate embeddings
    const embeddings = [];
    for (const f of files) {
      const emb = await generateEmbedding(f.path);
      embeddings.push({ vector: emb });
    }

    // Save to DB
    let record = await FaceData.findOne({ enrollmentNo });

    if (!record) {
      record = new FaceData({
        enrollmentNo,
        photoUrls,
        embeddings,
        latestPhotoUrl: photoUrls[2],
      });
    } else {
      record.photoUrls = photoUrls;
      record.embeddings = embeddings;
      record.latestPhotoUrl = photoUrls[2];
    }

    await record.save();

    res.json({
      success: true,
      message: "Photos + Embeddings stored successfully",
      photoUrls,
    });

  } catch (err) {
    console.error("❌ FACE UPLOAD ERROR:", err);
    res.status(500).json({ success: false, message: "Server error saving face data" });
  }
});

module.exports = router;
