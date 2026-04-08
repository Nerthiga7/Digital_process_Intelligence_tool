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

