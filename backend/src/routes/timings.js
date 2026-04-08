const express = require("express");
const Booking = require("../models/Booking");
const { todayRange } = require("../lib/date");

const router = express.Router();

const SLOTS = ["10AM", "1PM", "4PM", "7PM"];

function estimateDelayMinutes(ticketCount) {
  // Simple, deterministic estimate that grows with demand.
  if (ticketCount <= 10) return 0;
  if (ticketCount <= 25) return 5;
  if (ticketCount <= 40) return 10;
  return 15 + Math.round((ticketCount - 40) / 10) * 5;
}

router.get("/timings/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;
    const { start, end } = todayRange();

    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      movieId,
    }).select({ timing: 1, seats: 1 });

    const counts = {};
    for (const slot of SLOTS) counts[slot] = 0;

    for (const b of bookings) {
      counts[b.timing] = (counts[b.timing] || 0) + (Array.isArray(b.seats) ? b.seats.length : 0);
    }

    const timings = SLOTS.map((slot) => ({
      slot,
      numberOfBookings: counts[slot] || 0,
      estimatedDelayMinutes: estimateDelayMinutes(counts[slot] || 0),
    }));

    return res.json({ timings });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch timings" });
  }
});

router.get("/seats/:theatreId/:movieId/:timing", async (req, res) => {
  try {
    const { theatreId, movieId, timing } = req.params;
    const { start, end } = todayRange();

    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      theatreId,
      movieId,
      timing,
    }).select({ seats: 1 });

    const bookedSeats = [];
    for (const b of bookings) {
      if (Array.isArray(b.seats)) bookedSeats.push(...b.seats);
    }

    return res.json({ bookedSeats });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch booked seats" });
  }
});

module.exports = router;

