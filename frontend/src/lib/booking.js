import { createContext, createElement, useContext, useMemo, useState } from "react";

const BookingContext = createContext(null);

const initial = () => ({
  theatreId: null,
  movieId: null,
  timing: null,
  seats: [],
  timestamps: {
    booking_start_time: null,
    theatre_selection_time: null,
    movie_selection_time: null,
    timing_selection_time: null,
    seat_selection_time: null,
    payment_time: null,
  },
});

export function BookingProvider({ children }) {
  const [state, setState] = useState(() => initial());

  const value = useMemo(
    () => ({
      state,
      reset: () => setState(initial()),
      setTheatre: (theatreId) =>
        setState((s) => ({
          ...s,
          theatreId,
          movieId: null,
          timing: null,
          seats: [],
        })),
      setMovie: (movieId) =>
        setState((s) => ({
          ...s,
          movieId,
          timing: null,
          seats: [],
        })),
      setTiming: (timing) =>
        setState((s) => ({
          ...s,
          timing,
          seats: [],
        })),
      toggleSeat: (seat) =>
        setState((s) => ({
          ...s,
          seats: s.seats.includes(seat) ? s.seats.filter((x) => x !== seat) : [...s.seats, seat],
        })),
      setTimestamp: (key, iso) =>
        setState((s) => ({
          ...s,
          timestamps: { ...s.timestamps, [key]: iso },
        })),
      setPaymentTime: (iso) =>
        setState((s) => ({
          ...s,
          timestamps: { ...s.timestamps, payment_time: iso },
        })),
    }),
    [state]
  );

  return createElement(BookingContext.Provider, { value }, children);
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}

