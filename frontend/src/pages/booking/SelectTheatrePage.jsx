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

export default function SelectTheatrePage() {
  const navigate = useNavigate();
  const { state, setTheatre, setTimestamp } = useBooking();

  const [theatres, setTheatres] = useState([]);
  const [highlightTheatreId, setHighlightTheatreId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/theatres");
        setTheatres(res.data.theatres || []);
        setHighlightTheatreId(res.data.highlightTheatreId || null);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load theatres");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!state.timestamps.booking_start_time) {
      setTimestamp("booking_start_time", new Date().toISOString());
    }
  }, [setTimestamp, state.timestamps.booking_start_time]);

  const theatreChartData = useMemo(
    () =>
      theatres.map((t) => ({
        name: t.name,
        bookings: t.totalPeopleBookedToday,
        bottleneckMin: msToMin(t.totalBottleneckTimeMsFromMorning),
      })),
    [theatres]
  );

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-semibold text-slate-100">Step 1: Select Theatre</h1>
        <p className="mt-1 text-sm text-slate-400">Review today’s theatre bottlenecks, then choose a theatre.</p>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Pre-selection analytics</div>
            <div className="text-xs text-slate-400">Total bookings per theatre vs bottleneck time from morning</div>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={theatreChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 10 }} interval={0} angle={-15} height={60} />
                  <YAxis tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#e2e8f0" }} />
                  <Legend />
                  <Bar dataKey="bookings" name="Bookings (tickets)" fill="#60a5fa" />
                  <Bar dataKey="bottleneckMin" name="Bottleneck (min)" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Theatres</div>
            <div className="grid gap-3">
              {theatres.map((t) => {
                const isHi = t.id === highlightTheatreId;
                const isSel = t.id === state.theatreId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheatre(t.id)}
                    type="button"
                    className={[
                      "w-full rounded-xl border p-4 text-left transition",
                      isSel ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-950 hover:bg-slate-900",
                      isHi ? "ring-1 ring-orange-400/40" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{t.name}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Total people booked today: <span className="text-slate-200">{t.totalPeopleBookedToday}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Total bottleneck time from morning:{" "}
                          <span className="text-slate-200">{msToMin(t.totalBottleneckTimeMsFromMorning)} min</span>
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
                onClick={() => navigate("/overview")}
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!state.theatreId) return setErr("Select a theatre to continue");
                  setTimestamp("theatre_selection_time", new Date().toISOString());
                  navigate("/booking/movie");
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

