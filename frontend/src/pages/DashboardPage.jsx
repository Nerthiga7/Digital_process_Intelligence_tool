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
import TopBar from "../components/TopBar";
import Stepper from "../components/Stepper";
import SeatGrid from "../components/SeatGrid";
import { api } from "../lib/api";

const STEPS = [
  { key: "theatre", label: "Select Theatre" },
  { key: "movie", label: "Select Movie" },
  { key: "timing", label: "Select Timing" },
  { key: "seats", label: "Select Seats" },
  { key: "price", label: "Price Calculation" },
  { key: "pin", label: "PIN Confirmation" },
];

const TICKET_PRICE = 130;

function msToMin(ms) {
  return Math.round(ms / 60000);
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [theatres, setTheatres] = useState([]);
  const [highlightTheatreId, setHighlightTheatreId] = useState(null);

  const [movies, setMovies] = useState([]);
  const [highlightMovieId, setHighlightMovieId] = useState(null);
  const [peakUsageTimes, setPeakUsageTimes] = useState([]);

  const [timings, setTimings] = useState([]);

  const [selectedTheatreId, setSelectedTheatreId] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [selectedTiming, setSelectedTiming] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [pin, setPin] = useState("");

  const [timestamps, setTimestamps] = useState({
    theatre_selection_time: null,
    movie_selection_time: null,
    timing_selection_time: null,
    seat_selection_time: null,
    payment_time: null,
  });

  async function loadTheatres() {
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

  async function loadMovies(theatreId) {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/movies/${theatreId}`);
      setMovies(res.data.movies || []);
      setHighlightMovieId(res.data.highlightMovieId || null);
      setPeakUsageTimes(res.data.peakUsageTimes || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load movies");
    } finally {
      setLoading(false);
    }
  }

  async function loadTimings(movieId) {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get(`/timings/${movieId}`);
      setTimings(res.data.timings || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load timings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTheatres();
  }, []);

  const theatreChartData = useMemo(
    () =>
      theatres.map((t) => ({
        name: t.name,
        bookings: t.totalPeopleBookedToday,
        bottleneckMin: msToMin(t.totalBottleneckTimeMsFromMorning),
      })),
    [theatres]
  );

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

  const totalPrice = selectedSeats.length * TICKET_PRICE;

  async function confirmBooking() {
    setLoading(true);
    setErr("");
    try {
      const now = new Date().toISOString();
      const res = await api.post("/book", {
        theatreId: selectedTheatreId,
        movieId: selectedMovieId,
        timing: selectedTiming,
        seats: selectedSeats,
        pin,
        timestamps: {
          ...timestamps,
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
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Booking Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Multi-step booking with Digital Process Intelligence timestamps and bottleneck analysis.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Stepper steps={STEPS} currentIndex={step} />
        </div>

        {err ? (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        {step === 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
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
              <div className="mb-3 text-sm font-semibold text-slate-100">Step 1: Select Theatre</div>
              <div className="grid gap-3">
                {theatres.map((t) => {
                  const isHi = t.id === highlightTheatreId;
                  const isSel = t.id === selectedTheatreId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTheatreId(t.id);
                        setSelectedMovieId(null);
                        setSelectedTiming(null);
                        setSelectedSeats([]);
                        setMovies([]);
                        setTimings([]);
                      }}
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

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={loadTheatres}
                    type="button"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                    disabled={loading}
                  >
                    Refresh
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedTheatreId) return setErr("Select a theatre to continue");
                      setTimestamps((ts) => ({ ...ts, theatre_selection_time: new Date().toISOString() }));
                      await loadMovies(selectedTheatreId);
                      setStep(1);
                    }}
                    type="button"
                    className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    disabled={loading}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-6 lg:grid-cols-2">
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

              <div className="mt-6 text-xs text-slate-400">Peak usage times (all movies combined)</div>
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
              <div className="mb-3 text-sm font-semibold text-slate-100">Step 2: Select Movie</div>
              <div className="grid gap-3">
                {movies.map((m) => {
                  const isHi = m.id === highlightMovieId;
                  const isSel = m.id === selectedMovieId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMovieId(m.id);
                        setSelectedTiming(null);
                        setSelectedSeats([]);
                        setTimings([]);
                      }}
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

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setStep(0)}
                    type="button"
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                  >
                    Back
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedMovieId) return setErr("Select a movie to continue");
                      setTimestamps((ts) => ({ ...ts, movie_selection_time: new Date().toISOString() }));
                      await loadTimings(selectedMovieId);
                      setStep(2);
                    }}
                    type="button"
                    className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    disabled={loading}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Step 3: Select Timing</div>
            <div className="grid gap-3 md:grid-cols-2">
              {timings.map((t) => {
                const isSel = t.slot === selectedTiming;
                return (
                  <button
                    key={t.slot}
                    onClick={() => setSelectedTiming(t.slot)}
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
                onClick={() => setStep(1)}
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!selectedTiming) return setErr("Select a timing to continue");
                  setTimestamps((ts) => ({ ...ts, timing_selection_time: new Date().toISOString() }));
                  setStep(3);
                }}
                type="button"
                className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-3 text-sm font-semibold text-slate-100">Step 4: Select Seats</div>
              <SeatGrid
                selected={selectedSeats}
                onToggle={(seat) => {
                  setSelectedSeats((prev) =>
                    prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
                  );
                }}
              />
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="text-sm font-semibold text-slate-100">Selection</div>
              <div className="mt-2 text-sm text-slate-300">
                Selected count: <span className="font-semibold text-slate-100">{selectedSeats.length}</span>
              </div>
              <div className="mt-2 text-xs text-slate-400 break-words">
                {selectedSeats.length ? selectedSeats.join(", ") : "No seats selected yet."}
              </div>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  type="button"
                  className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (selectedSeats.length === 0) return setErr("Select at least one seat to continue");
                    setTimestamps((ts) => ({ ...ts, seat_selection_time: new Date().toISOString() }));
                    setStep(4);
                  }}
                  type="button"
                  className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Step 5: Price Calculation</div>
            <div className="grid gap-2 text-sm text-slate-300">
              <div>
                Ticket price: <span className="font-semibold text-slate-100">Rs.{TICKET_PRICE}</span>
              </div>
              <div>
                Number of tickets: <span className="font-semibold text-slate-100">{selectedSeats.length}</span>
              </div>
              <div className="pt-2 text-lg">
                Total price: <span className="font-semibold text-slate-100">Rs.{totalPrice}</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setStep(3)}
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                onClick={() => setStep(5)}
                type="button"
                className="ml-auto rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 text-sm font-semibold text-slate-100">Step 6: PIN Confirmation</div>
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
                onClick={() => setStep(4)}
                type="button"
                className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (pin.length !== 4) return setErr("Enter a 4-digit PIN");
                  confirmBooking();
                }}
                type="button"
                className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        ) : null}

        {loading ? <div className="mt-4 text-sm text-slate-400">Loading...</div> : null}
      </div>
    </div>
  );
}

