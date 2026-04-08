import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { api } from "../../lib/api";
import { useBooking } from "../../lib/booking";

export default function SelectTimingPage() {
  const navigate = useNavigate();
  const { state, setTiming, setTimestamp } = useBooking();

  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      if (!state.movieId) {
        navigate("/booking/movie", { replace: true });
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/timings/${state.movieId}`);
        setTimings(res.data.timings || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load timings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [state.movieId, navigate]);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-100">Step 3: Select Timing</h1>
        <p className="mt-1 text-sm text-slate-400">Choose a time slot and see current demand and estimated delay.</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {timings.map((t) => {
              const isSel = t.slot === state.timing;
              return (
                <button
                  key={t.slot}
                  onClick={() => setTiming(t.slot)}
                  type="button"
                  className={[
                    "rounded-xl border p-4 text-left transition",
                    isSel ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:bg-slate-900",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-slate-100">{t.slot}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    Number of bookings: <span className="text-slate-200">{t.numberOfBookings}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Estimated delay: <span className="text-slate-200">{t.estimatedDelayMinutes} min</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/booking/movie")}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!state.timing) return setErr("Select a timing to continue");
                setTimestamp("timing_selection_time", new Date().toISOString());
                navigate("/booking/seats");
              }}
              className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              disabled={loading}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

