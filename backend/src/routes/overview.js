const express = require("express");
const Booking = require("../models/Booking");
const Theatre = require("../models/Theatre");
const Movie = require("../models/Movie");
const { todayRange } = require("../lib/date");
const { computeStepTimes } = require("../lib/dpi");

const router = express.Router();

function hourLabel(h) {
  const hh = String(h).padStart(2, "0");
  return `${hh}:00`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildSampleOverview() {
  const sampleTheatres = [
    { id: "1", name: "PVR Cinemas", bookings: 350 },
    { id: "2", name: "Inox", bookings: 223 },
    { id: "3", name: "Cinepolis", bookings: 477 },
  ];

  const sampleMovies = [
    { id: "a", name: "Inception", bookings: 338, delayMin: 12 },
    { id: "b", name: "The Dark Knight", bookings: 133, delayMin: 8 },
    { id: "c", name: "Interstellar", bookings: 83, delayMin: 10 },
  ];

  const trends = [
    { time: "08:00", theatresMin: 45, moviesMin: 30 },
    { time: "09:00", theatresMin: 50, moviesMin: 28 },
    { time: "10:00", theatresMin: 22, moviesMin: 18 },
    { time: "11:00", theatresMin: 33, moviesMin: 15 },
    { time: "12:00", theatresMin: 19, moviesMin: 22 },
    { time: "13:00", theatresMin: 47, moviesMin: 16 },
    { time: "14:00", theatresMin: 18, moviesMin: 14 },
    { time: "15:00", theatresMin: 41, moviesMin: 16 },
    { time: "16:00", theatresMin: 44, moviesMin: 18 },
    { time: "17:00", theatresMin: 20, moviesMin: 20 },
    { time: "18:00", theatresMin: 46, moviesMin: 21 },
    { time: "19:00", theatresMin: 52, moviesMin: 27 },
    { time: "20:00", theatresMin: 49, moviesMin: 33 },
    { time: "21:00", theatresMin: 58, moviesMin: 44 },
    { time: "22:00", theatresMin: 30, moviesMin: 30 },
  ];

  return {
    trends,
    theatreCongestion: sampleTheatres,
    moviePopularity: sampleMovies,
    totalBookings: 1604,
    note: "Sample bottleneck graph generated for demonstration.",
  };
}

router.get("/overview", async (_req, res) => {
  try {
    const { start, end } = todayRange();

    const [theatres, movies, bookings] = await Promise.all([
      Theatre.find({}).sort({ name: 1 }),
      Movie.find({}).sort({ name: 1 }),
      Booking.find({ createdAt: { $gte: start, $lte: end } }).select({
        theatreId: 1,
        movieId: 1,
        seats: 1,
        createdAt: 1,
        timestamps: 1,
      }),
    ]);

    if (!bookings.length) {
      return res.json(buildSampleOverview());
    }

    // ---- Hourly bottleneck trends ----
    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00..22:00
    const hourBuckets = new Map(hours.map((h) => [h, []]));
    for (const b of bookings) {
      const h = new Date(b.createdAt).getHours();
      if (hourBuckets.has(h)) hourBuckets.get(h).push(b);
    }

    const trends = hours.map((h) => {
      const list = hourBuckets.get(h) || [];

      // theatreSeries: max(sum bottleneck per theatre) at this hour
      const theatreSums = new Map();
      const movieSums = new Map();

      for (const b of list) {
        const { bottleneck } = computeStepTimes(b.timestamps);
        const bn = bottleneck.ms;
        const tKey = String(b.theatreId);
        const mKey = String(b.movieId);
        theatreSums.set(tKey, (theatreSums.get(tKey) || 0) + bn);
        movieSums.set(mKey, (movieSums.get(mKey) || 0) + bn);
      }

      const maxTheatreMs = Math.max(0, ...Array.from(theatreSums.values()));
      const maxMovieMs = Math.max(0, ...Array.from(movieSums.values()));

      return {
        time: hourLabel(h),
        theatresMin: Math.round(maxTheatreMs / 60000),
        moviesMin: Math.round(maxMovieMs / 60000),
      };
    });

    // ---- Theatre congestion (tickets/bookings today) ----
    const theatreTickets = new Map(theatres.map((t) => [String(t._id), 0]));
    for (const b of bookings) {
      const k = String(b.theatreId);
      const tickets = Array.isArray(b.seats) ? b.seats.length : 0;
      theatreTickets.set(k, (theatreTickets.get(k) || 0) + tickets);
    }

    const theatreCongestion = theatres
      .map((t) => ({ id: String(t._id), name: t.name, bookings: theatreTickets.get(String(t._id)) || 0 }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // ---- Movie popularity & delay ----
    const movieTickets = new Map(movies.map((m) => [String(m._id), 0]));
    const movieBottleneck = new Map(movies.map((m) => [String(m._id), 0]));

    for (const b of bookings) {
      const k = String(b.movieId);
      const tickets = Array.isArray(b.seats) ? b.seats.length : 0;
      movieTickets.set(k, (movieTickets.get(k) || 0) + tickets);
      const { bottleneck } = computeStepTimes(b.timestamps);
      movieBottleneck.set(k, (movieBottleneck.get(k) || 0) + bottleneck.ms);
    }

    const moviePopularity = movies
      .map((m) => ({
        id: String(m._id),
        name: m.name,
        bookings: movieTickets.get(String(m._id)) || 0,
        delayMin: Math.round((movieBottleneck.get(String(m._id)) || 0) / 60000),
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    const totalBookings = bookings.reduce((sum, b) => sum + (Array.isArray(b.seats) ? b.seats.length : 0), 0);

    return res.json({
      trends,
      theatreCongestion,
      moviePopularity,
      totalBookings,
      note: "Bottleneck time calculated from 8:00 AM today",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch overview" });
  }
});

module.exports = router;

