const mongoose = require("mongoose");

const timestampsSchema = new mongoose.Schema(
  {
    booking_start_time: { type: Date, required: true },
    login_time: { type: Date, required: false },
    theatre_selection_time: { type: Date, required: true },
    movie_selection_time: { type: Date, required: true },
    timing_selection_time: { type: Date, required: true },
    seat_selection_time: { type: Date, required: true },
    payment_time: { type: Date, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    theatreId: { type: mongoose.Schema.Types.ObjectId, ref: "Theatre", required: true, index: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    timing: { type: String, required: true },
    seats: [{ type: String, required: true }],
    totalPrice: { type: Number, required: true },
    timestamps: { type: timestampsSchema, required: true },
  },
  { timestamps: true }
);

bookingSchema.index({ movieId: 1, timing: 1 });
bookingSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Booking", bookingSchema);

