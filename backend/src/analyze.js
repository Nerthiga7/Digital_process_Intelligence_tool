const mongoose = require("mongoose");
const { connectDb } = require("./lib/db");
const Booking = require("./models/Booking");
const Theatre = require("./models/Theatre");
const Movie = require("./models/Movie");
const { computeStepTimes, msToSeconds } = require("./lib/dpi");

async function analyzeBottlenecks() {
  await connectDb();

  // Get all bookings with populated theatre and movie
  const bookings = await Booking.find({})
    .populate('theatreId', 'name')
    .populate('movieId', 'name');

  const theatreData = {};
  const movieData = {};

  for (const booking of bookings) {
    const dpi = computeStepTimes(booking.timestamps);
    const theatreName = booking.theatreId.name;
    const movieName = booking.movieId.name;

    // Aggregate for theatres
    if (!theatreData[theatreName]) {
      theatreData[theatreName] = {
        count: 0,
        steps: {
          theatre_selection: 0,
          movie_selection: 0,
          timing_selection: 0,
          seat_selection: 0,
          payment: 0
        }
      };
    }
    theatreData[theatreName].count++;
    dpi.steps.forEach(step => {
      theatreData[theatreName].steps[step.key] += step.ms;
    });

    // Aggregate for movies
    if (!movieData[movieName]) {
      movieData[movieName] = {
        count: 0,
        steps: {
          theatre_selection: 0,
          movie_selection: 0,
          timing_selection: 0,
          seat_selection: 0,
          payment: 0
        }
      };
    }
    movieData[movieName].count++;
    dpi.steps.forEach(step => {
      movieData[movieName].steps[step.key] += step.ms;
    });
  }

  // Compute averages
  const theatreAverages = {};
  for (const [theatre, data] of Object.entries(theatreData)) {
    theatreAverages[theatre] = {};
    for (const [step, totalMs] of Object.entries(data.steps)) {
      theatreAverages[theatre][step] = msToSeconds(totalMs / data.count);
    }
  }

  const movieAverages = {};
  for (const [movie, data] of Object.entries(movieData)) {
    movieAverages[movie] = {};
    for (const [step, totalMs] of Object.entries(data.steps)) {
      movieAverages[movie][step] = msToSeconds(totalMs / data.count);
    }
  }

  console.log("Theatre Averages (seconds):", theatreAverages);
  console.log("Movie Averages (seconds):", movieAverages);

  await mongoose.disconnect();
}

analyzeBottlenecks().catch(console.error);