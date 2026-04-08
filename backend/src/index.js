// const express = require("express");
// const cors = require("cors");
// require("dotenv").config();

// const { connectDb } = require("./lib/db");
// const { authMiddleware } = require("./middleware/auth");

// const authRoutes = require("./routes/auth");
// const theatreRoutes = require("./routes/theatres");
// const movieRoutes = require("./routes/movies");
// const timingRoutes = require("./routes/timings");
// const bookingRoutes = require("./routes/bookings");
// const analyticsRoutes = require("./routes/analytics");
// const overviewRoutes = require("./routes/overview");

// const app = express();

// app.use(
//   cors({
//     origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
//     credentials: true,
//   })
// );
// app.use(express.json({ limit: "1mb" }));

// app.get("/health", (_req, res) => res.json({ ok: true }));

// app.use(authRoutes);

// app.use(authMiddleware);
// app.use(theatreRoutes);
// app.use(movieRoutes);
// app.use(timingRoutes);
// app.use(bookingRoutes);
// app.use(analyticsRoutes);
// app.use(overviewRoutes);

// const port = process.env.PORT || 5000;

// connectDb()
//   .then(() => {
//     app.listen(port, () => {
//       // eslint-disable-next-line no-console
//       console.log(`API listening on http://localhost:${port}`);
//     });
//   })
//   .catch((err) => {
//     // eslint-disable-next-line no-console
//     console.error("Failed to start server", err);
//     process.exit(1);
//   });

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDb } = require("./lib/db");
const { authMiddleware } = require("./middleware/auth");

const authRoutes = require("./routes/auth");
const theatreRoutes = require("./routes/theatres");
const movieRoutes = require("./routes/movies");
const timingRoutes = require("./routes/timings");
const bookingRoutes = require("./routes/bookings");
const analyticsRoutes = require("./routes/analytics");
const overviewRoutes = require("./routes/overview");

const app = express();

// ✅ CORS setup (Render-friendly)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// ✅ Health check (important for Render)
app.get("/", (_req, res) => {
  res.send("API is running 🚀");
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// Routes
app.use(authRoutes);

app.use(authMiddleware);
app.use(theatreRoutes);
app.use(movieRoutes);
app.use(timingRoutes);
app.use(bookingRoutes);
app.use(analyticsRoutes);
app.use(overviewRoutes);

// ✅ Use Render PORT
const PORT = process.env.PORT || 10000;

// ✅ Start server only after DB connects
connectDb()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server", err);
    process.exit(1);
  });