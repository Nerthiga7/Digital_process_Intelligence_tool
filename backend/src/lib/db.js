const mongoose = require("mongoose");

function connectDb() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dpi-movie-booking";
  return mongoose.connect(uri, { autoIndex: true });
}

module.exports = { connectDb };

