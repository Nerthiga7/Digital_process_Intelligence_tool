function msBetween(a, b) {
  return Math.max(0, new Date(b).getTime() - new Date(a).getTime());
}

function computeStepTimes(timestamps) {
  const start_to_theatre = msBetween(timestamps.booking_start_time, timestamps.theatre_selection_time);
  const theatre_to_movie = msBetween(timestamps.theatre_selection_time, timestamps.movie_selection_time);
  const movie_to_timing = msBetween(timestamps.movie_selection_time, timestamps.timing_selection_time);
  const timing_to_seat = msBetween(timestamps.timing_selection_time, timestamps.seat_selection_time);
  const seat_to_payment = msBetween(timestamps.seat_selection_time, timestamps.payment_time);

  const steps = [
    { key: "theatre_selection", label: "Select Theatre", ms: start_to_theatre },
    { key: "movie_selection", label: "Select Movie", ms: theatre_to_movie },
    { key: "timing_selection", label: "Select Timing", ms: movie_to_timing },
    { key: "seat_selection", label: "Select Seats", ms: timing_to_seat },
    { key: "payment", label: "Payment/PIN", ms: seat_to_payment },
  ];

  const totalMs = steps.reduce((sum, s) => sum + s.ms, 0);
  const bottleneck = steps.reduce((max, s) => (s.ms > max.ms ? s : max), steps[0]);

  return { steps, totalMs, bottleneck };
}

function msToSeconds(ms) {
  return Math.round(ms / 1000);
}

module.exports = { computeStepTimes, msToSeconds };

