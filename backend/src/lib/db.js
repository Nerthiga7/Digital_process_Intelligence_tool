// const mongoose = require("mongoose");

// function connectDb() {
//   const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dpi-movie-booking";
//   return mongoose.connect(uri, { autoIndex: true });
// }

// module.exports = { connectDb };
const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "MONGODB_URI environment variable is required. " +
        "Set it in your Render service environment variables with your MongoDB Atlas connection string."
      );
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDb };