const express = require("express");
const Theatre = require("../models/Theatre");
const Booking = require("../models/Booking");
const { todayRange } = require("../lib/date");
const { computeStepTimes } = require("../lib/dpi");

const router = express.Router();

router.get("/theatres", async (_req, res) => {
  try {
    const theatres = await Theatre.find({}).sort({ name: 1 });
    const { start, end } = todayRange();

    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: end },
      theatreId: { $in: theatres.map((t) => t._id) },
    }).select({ theatreId: 1, seats: 1, timestamps: 1 });

    const byTheatre = new Map();
    for (const t of theatres) {
      byTheatre.set(String(t._id), { tickets: 0, bottleneckMs: 0 });
    }

    for (const b of bookings) {
      const key = String(b.theatreId);
      const agg = byTheatre.get(key);
      if (!agg) continue;
      agg.tickets += Array.isArray(b.seats) ? b.seats.length : 0;
      const { bottleneck } = computeStepTimes(b.timestamps);
      agg.bottleneckMs += bottleneck.ms;
    }

    const rows = theatres.map((t) => {
      const agg = byTheatre.get(String(t._id)) || { tickets: 0, bottleneckMs: 0 };
      return {
        id: String(t._id),
        name: t.name,
        totalPeopleBookedToday: agg.tickets,
        totalBottleneckTimeMsFromMorning: agg.bottleneckMs,
      };
    });

    const highest = rows.reduce(
      (max, r) => (r.totalBottleneckTimeMsFromMorning > max.totalBottleneckTimeMsFromMorning ? r : max),
      rows[0] || null
    );

    return res.json({
      theatres: rows,
      highlightTheatreId: highest ? highest.id : null,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch theatres" });
  }
});

module.exports = router;

