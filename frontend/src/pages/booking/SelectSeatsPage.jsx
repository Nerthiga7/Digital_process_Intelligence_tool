import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import SeatGrid from "../../components/SeatGrid";
import { useBooking } from "../../lib/booking";
import { api } from "../../lib/api";

export default function SelectSeatsPage() {
  const navigate = useNavigate();
  const { state, toggleSeat, setTimestamp } = useBooking();
  const [err, setErr] = useState("");
  const [bookedSeats, setBookedSeats] = useState([]);

  useEffect(() => {
    if (!state.timing) navigate("/booking/timing", { replace: true });
  }, [state.timing, navigate]);

  useEffect(() => {
    async function loadBookedSeats() {
      if (!state.theatreId || !state.movieId || !state.timing) return;
      try {
        const res = await api.get(`/seats/${state.theatreId}/${state.movieId}/${state.timing}`);
        setBookedSeats(res.data.bookedSeats || []);
      } catch (e) {
        console.error("Failed to load booked seats", e);
      }
    }
    loadBookedSeats();
  }, [state.theatreId, state.movieId, state.timing]);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-100">Step 4: Select Seats</h1>
        <p className="mt-1 text-sm text-slate-400">Pick one or more seats from the grid.</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <SeatGrid selected={state.seats} booked={bookedSeats} onToggle={(seat) => toggleSeat(seat)} />
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-sm font-semibold text-slate-100">Selection</div>
            <div className="mt-2 text-sm text-slate-300">
              Selected count: <span className="font-semibold text-slate-100">{state.seats.length}</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 break-words">
              {state.seats.length ? state.seats.join(", ") : "No seats selected yet."}
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/booking/timing")}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (state.seats.length === 0) return setErr("Select at least one seat to continue");
                  setTimestamp("seat_selection_time", new Date().toISOString());
                  navigate("/booking/price");
                }}
                className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

