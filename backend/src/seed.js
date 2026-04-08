require("dotenv").config();
const bcrypt = require("bcrypt");
const { connectDb } = require("./lib/db");
const User = require("./models/User");
const Theatre = require("./models/Theatre");
const Movie = require("./models/Movie");
const Booking = require("./models/Booking");

async function seed() {
  await connectDb();

  const email = "nerthiga@gmail.com";
  const name = "Nerthiga";
  const password = process.env.SEED_PASSWORD || "Nerthiga@123";
  const passwordHash = await bcrypt.hash(password, 10);

  await User.updateOne(
    { email },
    { $set: { name, email, passwordHash } },
    { upsert: true }
  );

  const theatreNames = ["DPI Cineplex - Chennai", "Process Park Multiplex", "Intelligence IMAX"];
  const theatres = [];
  for (const tName of theatreNames) {
    const t = await Theatre.findOneAndUpdate(
      { name: tName },
      { $set: { name: tName } },
      { upsert: true, returnDocument: "after" }
    );
    theatres.push(t);
  }

  const moviesByTheatre = new Map([
    [theatres[0]._id, ["Interstellar", "Inception", "The Dark Knight"]],
    [theatres[1]._id, ["Avengers: Endgame", "Jurassic Park", "Titanic"]],
    [theatres[2]._id, ["Avatar", "Dune", "Oppenheimer"]],
  ]);

  for (const [theatreId, movieNames] of moviesByTheatre.entries()) {
    for (const mName of movieNames) {
      await Movie.findOneAndUpdate(
        { theatreId, name: mName },
        { $set: { theatreId, name: mName } },
        { upsert: true, returnDocument: "after" }
      );
    }
  }

  // Seed some sample bookings for today's dashboard charts
  if (process.env.SEED_SAMPLE_BOOKINGS !== "false") {
    const user = await User.findOne({ email });
    const allMovies = await Movie.find({}).select({ _id: 1, theatreId: 1 });
    const timings = ["10AM", "1PM", "4PM", "7PM"];

    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const randomSeat = () => {
      const row = "ABCDEFGH"[randomInt(0, 7)];
      const col = randomInt(1, 10);
      return `${row}${col}`;
    };

    const makeTimestamps = (base) => {
      const t0 = new Date(base);
      const theatre = new Date(t0.getTime() + randomInt(5, 40) * 1000);
      const movie = new Date(theatre.getTime() + randomInt(5, 45) * 1000);
      const timing = new Date(movie.getTime() + randomInt(5, 35) * 1000);
      const seats = new Date(timing.getTime() + randomInt(10, 90) * 1000);
      const pay = new Date(seats.getTime() + randomInt(5, 30) * 1000);
      return {
        login_time: t0,
        theatre_selection_time: theatre,
        movie_selection_time: movie,
        timing_selection_time: timing,
        seat_selection_time: seats,
        payment_time: pay,
      };
    };

    const startOfDay = new Date();
    startOfDay.setHours(8, 0, 0, 0);

    if (process.env.SEED_RESET_TODAY_BOOKINGS === "true") {
      await Booking.deleteMany({ createdAt: { $gte: startOfDay } });
    }

    const existingToday = await Booking.countDocuments({ createdAt: { $gte: startOfDay } });

    // Seed if there are no bookings today (or if reset cleared them)
    if (existingToday === 0 && user && allMovies.length) {
      const docs = [];
      for (let i = 0; i < 40; i++) {
        const m = allMovies[randomInt(0, allMovies.length - 1)];
        const ticketCount = randomInt(1, 5);
        const seats = Array.from({ length: ticketCount }, () => randomSeat());
        const timing = timings[randomInt(0, timings.length - 1)];

        // Spread createdAt by hour for chart trend
        const createdAt = new Date(startOfDay.getTime() + randomInt(0, 14) * 60 * 60 * 1000 + randomInt(0, 59) * 60 * 1000);
        const ts = makeTimestamps(new Date(createdAt.getTime() - randomInt(30, 180) * 1000));

        docs.push({
          userId: user._id,
          theatreId: m.theatreId,
          movieId: m._id,
          timing,
          seats: Array.from(new Set(seats)),
          totalPrice: ticketCount * 130,
          timestamps: ts,
          createdAt,
          updatedAt: createdAt,
        });
      }
      await Booking.insertMany(docs);
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  // eslint-disable-next-line no-console
  console.log(`Login email: ${email}`);
  // eslint-disable-next-line no-console
  console.log(`Login password: ${password}`);
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed", err);
  process.exit(1);
});

