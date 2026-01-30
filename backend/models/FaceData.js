// backend/models/FaceData.js
const mongoose = require("mongoose");

const EmbeddingSchema = new mongoose.Schema(
  {
    vector: {
      type: [Number],
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FaceDataSchema = new mongoose.Schema(
  {
    enrollmentNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    photoUrls: {
      type: [String],
      required: true,
      validate: (arr) => Array.isArray(arr) && arr.length === 3,
    },

    embeddings: {
      type: [EmbeddingSchema],
      required: true,
      validate: (arr) => Array.isArray(arr) && arr.length === 3,
    },

    latestPhotoUrl: {
      type: String,
      required: true,
    },

    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "tblFaceData" }
);

FaceDataSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.FaceData || mongoose.model("FaceData", FaceDataSchema);
//https://github.com/deepinsight/insightface/tree/master/model_zoo