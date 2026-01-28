// backend/routes/faceVerify.js
const express = require("express");
const router = express.Router();
const FaceData = require("../models/FaceData");
const Student = require("../models/Student");

/* Cosine similarity */
function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return 0;
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = Number(a[i]) || 0;
    const bi = Number(b[i]) || 0;
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/*
  POST /api/face/verify
  Body:
    - enrollmentNo
    - embeddings: array of 1..3 embedding vectors (each is array of floats)
  Algorithm (supporting N-shot):
    - For each stored image j, compute similarity between each live embedding i and stored j
    - Compute average similarity across live embeddings for stored j
    - Pick stored j with highest average similarity (bestAvg)
    - Success if bestAvg >= threshold
*/
router.post("/verify", async (req, res) => {
  const start = Date.now();
  try {
    const { enrollmentNo, embeddings } = req.body;
    if (!enrollmentNo || !Array.isArray(embeddings) || embeddings.length < 1) {
      return res.status(400).json({ success: false, message: "Invalid request. Need enrollmentNo + 1..3 embeddings." });
    }

    // load stored FaceData
    const faceData = await FaceData.findOne({ enrollmentNo });
    if (!faceData || !Array.isArray(faceData.embeddings) || faceData.embeddings.length === 0) {
      return res.status(404).json({ success: false, message: "No face data found for this student." });
    }

    // normalize stored vectors shape: stored e.vector or e.floatEmbedding etc
    const storedVectors = faceData.embeddings.map((e) => {
      if (Array.isArray(e.vector)) return e.vector;
      if (Array.isArray(e.floatEmbedding)) return e.floatEmbedding;
      if (Array.isArray(e)) return e;
      return [];
    }).filter(sv => Array.isArray(sv) && sv.length > 0);

    if (storedVectors.length === 0) {
      return res.status(500).json({ success: false, message: "Stored embeddings missing or malformed." });
    }

    // For each stored vector j, compute average similarity across provided live embeddings
    const live = embeddings.map(e => Array.isArray(e) ? e : (e?.floatEmbedding ?? []));
    const storedCount = storedVectors.length;
    let bestAvg = -Infinity;
    let bestIndex = null;

    for (let j = 0; j < storedCount; j++) {
      let sum = 0;
      let cnt = 0;
      for (let i = 0; i < live.length; i++) {
        const sim = cosineSimilarity(live[i], storedVectors[j]);
        if (!Number.isFinite(sim)) continue;
        sum += sim;
        cnt++;
      }
      if (cnt === 0) continue;
      const avg = sum / cnt;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestIndex = j + 1;
      }
    }

    if (bestIndex === null) {
      return res.status(500).json({ success: false, message: "Unable to compare embeddings." });
    }

    // threshold tuned for 2-shot mode. You can tune this (0.72..0.78 commonly).
    const threshold = 0.75;
    const success = bestAvg >= threshold;

    // fetch student only on success (or optionally return null)
    const student = success ? await Student.findOne({ enrollmentNo }).select("-__v -createdAt -updatedAt") : null;

    return res.json({
      success,
      similarity: Number(bestAvg.toFixed(4)),
      matchedStoredIndex: bestIndex,
      timeTaken: (Date.now() - start) / 1000,
      student: student || null
    });
  } catch (err) {
    console.error("❌ Verify Error:", err);
    return res.status(500).json({ success: false, message: "Server error verifying face" });
  }
});

module.exports = router;
