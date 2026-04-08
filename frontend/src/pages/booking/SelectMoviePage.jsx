import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TopBar from "../../components/TopBar";
import { api } from "../../lib/api";
import { useBooking } from "../../lib/booking";

function msToMin(ms) {
  return Math.round(ms / 60000);
}

export default function SelectMoviePage() {
  const navigate = useNavigate();
  const { state, setMovie, setTimestamp } = useBooking();

  const [movies, setMovies] = useState([]);
  const [highlightMovieId, setHighlightMovieId] = useState(null);
  const [peakUsageTimes, setPeakUsageTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      if (!state.theatreId) {
        navigate("/booking/theatre", { replace: true });
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/movies/${state.theatreId}`);
        setMovies(res.data.movies || []);
        setHighlightMovieId(res.data.highlightMovieId || null);
        setPeakUsageTimes(res.data.peakUsageTimes || []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load movies");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [state.theatreId, navigate]);

  const movieChartData = useMemo(
    () =>
      movies.map((m) => ({
        name: m.name,
        bookings: m.totalBookings,
        bottleneckMin: msToMin(m.bottleneckTimeMs),
      })),
    [movies]
  );

  const peakTimeChartData = useMemo(() => {
    const slots = ["10AM", "1PM", "4PM", "7PM"];
    const totals = Object.fromEntries(slots.map((s) => [s, 0]));
    for (const entry of peakUsageTimes || []) {
      for (const t of entry.times || []) {
        totals[t.slot] = (totals[t.slot] || 0) + (t.bookings || 0);
      }
    }
    return slots.map((s) => ({ slot: s, bookings: totals[s] || 0 }));
  }, [peakUsageTimes]);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-100">Step 2: Select Movie</h1>
        <p className="mt-1 text-sm text-slate-400">Compare bottlenecks per movie and check peak usage times.</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Pre-selection analytics</div>
            <div className="text-xs text-slate-400">Bottleneck per movie</div>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movieChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 10 }} interval={0} angle={-15} height={60} />
                  <YAxis tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#e2e8f0" }} />
                  <Legend />
                  <Bar dataKey="bottleneckMin" name="Bottleneck (min)" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 text-xs text-slate-400">Peak usage times</div>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakTimeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="slot" tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#e2e8f0" }} />
                  <Bar dataKey="bookings" name="Bookings (tickets)" fill="#60a5fa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Movies</div>
            <div className="grid gap-3">
              {movies.map((m) => {
                const isHi = m.id === highlightMovieId;
                const isSel = m.id === state.movieId;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMovie(m.id)}
                    type="button"
                    className={[
                      "w-full rounded-xl border p-4 text-left transition",
                      isSel ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:bg-slate-900",
                      isHi ? "ring-1 ring-orange-400/40" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{m.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Total bookings: <span className="text-slate-200">{m.totalBookings}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Bottleneck time: <span className="text-slate-200">{msToMin(m.bottleneckTimeMs)} min</span>
                        </div>
                      </div>
                      {isHi ? (
                        <div className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-semibold text-orange-200">
                          Highest bottleneck
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => navigate("/booking/theatre")}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!state.movieId) return setErr("Select a movie to continue");
                  setTimestamp("movie_selection_time", new Date().toISOString());
                  navigate("/booking/timing");
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
    </div>
  );
}

