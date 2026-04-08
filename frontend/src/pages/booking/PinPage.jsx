import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { api } from "../../lib/api";
import { useBooking } from "../../lib/booking";

export default function PinPage() {
  const navigate = useNavigate();
  const { state, setPaymentTime } = useBooking();

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!state.seats.length) navigate("/booking/seats", { replace: true });
  }, [state.seats.length, navigate]);

  async function confirm() {
    if (pin.length !== 4) {
      setErr("Enter a 4-digit PIN");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const now = new Date().toISOString();
      setPaymentTime(now);
      const res = await api.post("/book", {
        theatreId: state.theatreId,
        movieId: state.movieId,
        timing: state.timing,
        seats: state.seats,
        pin,
        timestamps: {
          ...state.timestamps,
          payment_time: now,
        },
      });
      navigate(`/analytics/${res.data.bookingId}`);
    } catch (e) {
      setErr(e?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-100">Step 6: PIN Confirmation</h1>
        <p className="mt-1 text-sm text-slate-400">Enter a 4-digit PIN to confirm your booking.</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="max-w-sm">
            <label className="mb-1 block text-xs font-medium text-slate-300">Enter 4-digit PIN</label>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
              placeholder="1234"
              inputMode="numeric"
            />
          </div>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/booking/price")}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={confirm}
              className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Confirming..." : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

