const express = require("express");
const Movie = require("../models/Movie");
const Booking = require("../models/Booking");
const { todayRange } = require("../lib/date");
const { computeStepTimes } = require("../lib/dpi");

const router = express.Router();

router.get("/movies/:theatreId", async (req, res) => {
  try {
    const { theatreId } = req.params;
    const movies = await Movie.find({ theatreId }).sort({ name: 1 });

    const { start, end } = todayRange();
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      movieId: { $in: movies.map((m) => m._id) },
    }).select({ movieId: 1, seats: 1, timestamps: 1, timing: 1 });

    const byMovie = new Map();
    for (const m of movies) byMovie.set(String(m._id), { tickets: 0, bottleneckMs: 0 });

    const timingCounts = new Map(); // movieId -> { "10AM": nTickets, ... }
    for (const m of movies) timingCounts.set(String(m._id), {});

    for (const b of bookings) {
      const key = String(b.movieId);
      const agg = byMovie.get(key);
      if (!agg) continue;
      const tickets = Array.isArray(b.seats) ? b.seats.length : 0;
      agg.tickets += tickets;
      const { bottleneck } = computeStepTimes(b.timestamps);
      agg.bottleneckMs += bottleneck.ms;

      const tc = timingCounts.get(key) || {};
      tc[b.timing] = (tc[b.timing] || 0) + tickets;
      timingCounts.set(key, tc);
    }

    const rows = movies.map((m) => {
      const agg = byMovie.get(String(m._id)) || { tickets: 0, bottleneckMs: 0 };
      return {
        id: String(m._id),
        name: m.name,
        theatreId: String(m.theatreId),
        totalBookings: agg.tickets,
        bottleneckTimeMs: agg.bottleneckMs,
      };
    });

    const highest = rows.reduce((max, r) => (r.bottleneckTimeMs > max.bottleneckTimeMs ? r : max), rows[0] || null);

    const peakUsageTimes = rows.map((r) => {
      const tc = timingCounts.get(r.id) || {};
      return {
        movieId: r.id,
        times: ["10AM", "1PM", "4PM", "7PM"].map((slot) => ({ slot, bookings: tc[slot] || 0 })),
      };
    });

    return res.json({
      movies: rows,
      highlightMovieId: highest ? highest.id : null,
      peakUsageTimes,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch movies" });
  }
});

module.exports = router;

