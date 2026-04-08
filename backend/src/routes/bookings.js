const express = require("express");
const Booking = require("../models/Booking");
const { computeStepTimes } = require("../lib/dpi");

const router = express.Router();

const TICKET_PRICE = 130;

function isValidPin(pin) {
  return typeof pin === "string" && /^[0-9]{4}$/.test(pin);
}

router.post("/book", async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { theatreId, movieId, timing, seats, pin, timestamps } = req.body || {};

    if (!theatreId || !movieId || !timing) return res.status(400).json({ message: "Missing booking details" });
    if (!Array.isArray(seats) || seats.length === 0) return res.status(400).json({ message: "Select at least one seat" });
    if (!isValidPin(pin)) return res.status(400).json({ message: "PIN must be 4 digits" });

    const uniqueSeats = Array.from(new Set(seats.map(String)));

    const requiredTs = [
      "booking_start_time",
      "theatre_selection_time",
      "movie_selection_time",
      "timing_selection_time",
      "seat_selection_time",
      "payment_time",
    ];
    for (const k of requiredTs) {
      if (!timestamps?.[k]) return res.status(400).json({ message: `Missing timestamp: ${k}` });
    }

    const finalTimestamps = {
      booking_start_time: new Date(timestamps.booking_start_time),
      theatre_selection_time: new Date(timestamps.theatre_selection_time),
      movie_selection_time: new Date(timestamps.movie_selection_time),
      timing_selection_time: new Date(timestamps.timing_selection_time),
      seat_selection_time: new Date(timestamps.seat_selection_time),
      payment_time: new Date(timestamps.payment_time),
    };

    // Ensure monotonic timestamps to keep DPI meaningful.
    const ordered = [
      finalTimestamps.booking_start_time,
      finalTimestamps.theatre_selection_time,
      finalTimestamps.movie_selection_time,
      finalTimestamps.timing_selection_time,
      finalTimestamps.seat_selection_time,
      finalTimestamps.payment_time,
    ];
    for (let i = 1; i < ordered.length; i++) {
      if (!(ordered[i] instanceof Date) || Number.isNaN(ordered[i].getTime())) {
        return res.status(400).json({ message: "Invalid timestamps" });
      }
      if (ordered[i].getTime() < ordered[i - 1].getTime()) {
        return res.status(400).json({ message: "Timestamps must be in order" });
      }
    }

    const existing = await Booking.find({ movieId, timing, seats: { $in: uniqueSeats } }).select({ seats: 1 });
    if (existing.length > 0) {
      const taken = new Set();
      for (const b of existing) for (const s of b.seats || []) taken.add(String(s));
      const conflicts = uniqueSeats.filter((s) => taken.has(s));
      if (conflicts.length) {
        return res.status(409).json({ message: `Seats already booked: ${conflicts.join(", ")}` });
      }
    }

    const totalPrice = uniqueSeats.length * TICKET_PRICE;

    const booking = await Booking.create({
      userId,
      theatreId,
      movieId,
      timing,
      seats: uniqueSeats,
      totalPrice,
      timestamps: finalTimestamps,
    });

    const analytics = computeStepTimes(booking.timestamps);

    return res.status(201).json({
      bookingId: String(booking._id),
      totalPrice,
      dpi: {
        totalMs: analytics.totalMs,
        bottleneckStepKey: analytics.bottleneck.key,
        bottleneckMs: analytics.bottleneck.ms,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create booking" });
  }
});

module.exports = router;

