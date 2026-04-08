const mongoose = require("mongoose");

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Theatre", theatreSchema);

