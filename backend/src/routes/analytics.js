const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Theatre = require("../models/Theatre");
const Movie = require("../models/Movie");
const { computeStepTimes, msToSeconds } = require("../lib/dpi");

const router = express.Router();

function buildSuggestions(bottleneckKey) {
  if (bottleneckKey === "theatre_selection") {
    return [
      "Theatre selection is causing delay. Reduce options, add smart defaults, or rank theatres by proximity/bottleneck.",
      "Show a clear ‘Recommended theatre’ based on lowest bottleneck time to speed up decisions.",
    ];
  }
  if (bottleneckKey === "movie_selection") {
    return [
      "Movie selection is causing delay. Improve discoverability with search, filters, and ‘Top picks’ per theatre.",
      "Surface bottleneck and peak-time warnings next to each movie to help users decide faster.",
    ];
  }
  if (bottleneckKey === "seat_selection") {
    return ["Seat selection is causing delay. Improve UI or auto-suggest seats."];
  }
  if (bottleneckKey === "timing_selection") {
    return ["High demand in same slot. Suggest distributing users."];
  }
  if (bottleneckKey === "payment") {
    return [
      "Payment/PIN confirmation is causing delay. Use auto-focus between PIN boxes and clearer error feedback.",
      "Consider one-tap confirmation or saving preferred payment method to reduce friction.",
    ];
  }
  return [];
}

router.get("/analytics/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const [user, theatre, movie] = await Promise.all([
      User.findById(booking.userId).select({ name: 1, email: 1 }),
      Theatre.findById(booking.theatreId).select({ name: 1 }),
      Movie.findById(booking.movieId).select({ name: 1 }),
    ]);

    const dpi = computeStepTimes(booking.timestamps);

    return res.json({
      booking: {
        id: String(booking._id),
        user: user ? { name: user.name, email: user.email } : null,
        theatre: theatre ? { name: theatre.name } : null,
        movie: movie ? { name: movie.name } : null,
        timing: booking.timing,
        seats: booking.seats,
        totalPrice: booking.totalPrice,
      },
      dpi: {
        totalSeconds: msToSeconds(dpi.totalMs),
        bottleneckStepKey: dpi.bottleneck.key,
        bottleneckStepLabel: dpi.bottleneck.label,
        bottleneckSeconds: msToSeconds(dpi.bottleneck.ms),
        steps: dpi.steps.map((s) => ({
          key: s.key,
          label: s.label,
          seconds: msToSeconds(s.ms),
          ms: s.ms,
        })),
      },
      suggestions: buildSuggestions(dpi.bottleneck.key),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

module.exports = router;

