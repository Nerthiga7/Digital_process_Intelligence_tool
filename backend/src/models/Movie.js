const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    theatreId: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
  },
  { timestamps: true }
);

movieSchema.index({ theatreId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Movie", movieSchema);

