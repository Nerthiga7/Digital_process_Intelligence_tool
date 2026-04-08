import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TopBar from "../components/TopBar";
import { api } from "../lib/api";
import { useBooking } from "../lib/booking";

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function LineChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-indigo-300">
      <path
        d="M3 18L8 12l4 5 9-10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 7h2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-300">
      <path
        d="M4 12h3l2-6 4 12 2-6h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-slate-300">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const { reset } = useBooking();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/overview");
        setOverview(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load daily process overview");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const maxTheatreBookings = useMemo(() => {
    const v = Math.max(1, ...(overview?.theatreCongestion || []).map((x) => x.bookings || 0));
    return v;
  }, [overview]);

  const maxMovieBookings = useMemo(() => {
    const v = Math.max(1, ...(overview?.moviePopularity || []).map((x) => x.bookings || 0));
    return v;
  }, [overview]);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-100">
              <LineChartIcon />
              <div className="text-xl font-semibold">Daily Process Overview (Theatres & Movies)</div>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <PulseIcon />
              <span>Hourly Bottleneck Trends (Today)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <UserIcon />
            <span className="font-semibold text-slate-200">Total Bookings: {overview?.totalBookings ?? 0}</span>
          </div>
        </div>

        {err ? (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview?.trends || []} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" tick={{ fill: "#cbd5e1", fontSize: 10 }} />
                <YAxis
                  tick={{ fill: "#cbd5e1", fontSize: 10 }}
                  domain={[0, 60]}
                  ticks={[0, 15, 30, 45, 60]}
                  tickFormatter={(v) => `${v}m`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0b1220",
                    border: "1px solid #1f2937",
                    color: "#e2e8f0",
                  }}
                  formatter={(value) => [`${value}m`, undefined]}
                />
                <Legend />
                <Area
                  type="basis"
                  dataKey="theatresMin"
                  name="Theatres"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="basis"
                  dataKey="moviesMin"
                  name="Movies"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.12}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs font-semibold tracking-widest text-slate-400">THEATRE CONGESTION</div>
            <div className="mt-4 grid gap-4">
              {(overview?.theatreCongestion || []).map((t, idx) => {
                const pct = clamp01((t.bookings || 0) / maxTheatreBookings);
                const isHot = idx === 0;
                return (
                  <div key={t.id}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium text-slate-200">{t.name}</div>
                      <div className="text-slate-300">
                        <span className="font-semibold text-indigo-200">{t.bookings}</span>{" "}
                        <span className="text-slate-400">Bookings</span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded bg-slate-800">
                      <div
                        className={`h-2 rounded ${isHot ? "bg-rose-500" : "bg-indigo-500"}`}
                        style={{ width: `${Math.round(pct * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="text-xs font-semibold tracking-widest text-slate-400">MOVIE POPULARITY & DELAY</div>
            <div className="mt-4 grid gap-4">
              {(overview?.moviePopularity || []).map((m, idx) => {
                const pct = clamp01((m.bookings || 0) / maxMovieBookings);
                const color = idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-emerald-400" : "bg-orange-500";
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-medium text-slate-200">{m.name}</div>
                      <div className="text-slate-300">
                        <span className="font-semibold text-indigo-200">{m.bookings}</span>{" "}
                        <span className="text-slate-400">Bookings</span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded bg-slate-800">
                      <div className={`h-2 rounded ${color}`} style={{ width: `${Math.round(pct * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Delay (bottleneck): {m.delayMin}m</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-500">* {overview?.note}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                navigate("/booking/theatre");
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              disabled={loading}
            >
              Start Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

