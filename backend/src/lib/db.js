// const mongoose = require("mongoose");

// function connectDb() {
//   const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dpi-movie-booking";
//   return mongoose.connect(uri, { autoIndex: true });
// }

// module.exports = { connectDb };
const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const uri =
      process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/dpi-movie-booking";

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDb };