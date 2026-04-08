import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TopBar from "../components/TopBar";
import { api } from "../lib/api";

export default function AnalyticsPage() {
  const { bookingId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/analytics/${bookingId}`);
        setData(res.data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookingId]);

  const chartData = useMemo(() => {
    const steps = data?.dpi?.steps || [];
    const bottleneckKey = data?.dpi?.bottleneckStepKey;
    return steps.map((s) => ({
      key: s.key,
      step: s.label,
      seconds: s.seconds,
      isBottleneck: s.key === bottleneckKey,
    }));
  }, [data]);

  const maxSeconds = useMemo(() => {
    return Math.max(0, ...chartData.map((d) => d.seconds || 0));
  }, [chartData]);

  return (
    <div className="min-h-screen bg-slate-950">
      <TopBar />
      <div className="mx-auto max-w-6xl px-4 py-6">
        {err ? (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {err}
          </div>
        ) : null}

        {loading ? <div className="text-sm text-slate-400">Loading...</div> : null}

        {data ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="text-xs font-semibold tracking-widest text-emerald-300/80">CONFIRMED</div>
              <h1 className="mt-2 text-2xl font-semibold text-slate-100">
                Booking Confirmed for {data?.booking?.user?.name || "Nerthiga"}
              </h1>

              <div className="mt-4 grid gap-2 text-sm text-slate-300">
                <div>
                  <span className="text-slate-400">Theatre:</span> {data?.booking?.theatre?.name || "-"}
                </div>
                <div>
                  <span className="text-slate-400">Movie:</span> {data?.booking?.movie?.name || "-"}
                </div>
                <div>
                  <span className="text-slate-400">Timing:</span> {data?.booking?.timing || "-"}
                </div>
                <div>
                  <span className="text-slate-400">Seats:</span> {(data?.booking?.seats || []).join(", ")}
                </div>
                <div className="pt-2 text-lg">
                  <span className="text-slate-400">Total price:</span>{" "}
                  <span className="font-semibold text-slate-100">Rs.{data?.booking?.totalPrice}</span>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
                <div className="text-sm text-slate-300">
                  Total time taken:{" "}
                  <span className="font-semibold text-slate-100">{data?.dpi?.totalSeconds}s</span>
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  Bottleneck step:{" "}
                  <span className="font-semibold text-rose-200">{data?.dpi?.bottleneckStepLabel}</span> (
                  {data?.dpi?.bottleneckSeconds}s)
                </div>
              </div>

              {Array.isArray(data?.suggestions) && data.suggestions.length ? (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                  <div className="text-sm font-semibold text-amber-200">Suggestions</div>
                  <ul className="mt-2 list-disc pl-5 text-sm text-amber-100">
                    {data.suggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6">
                <Link
                  to="/overview"
                  className="inline-flex rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900"
                >
                  Book Another
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-3 text-sm font-semibold text-slate-100">Step-wise time chart</div>
              <div className="text-xs text-slate-400">
                Y-axis shows <span className="text-slate-200">time spent (seconds)</span>. Bottleneck step is highlighted in red.
              </div>
              <div className="mt-4 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#223047" />
                    <XAxis
                      dataKey="step"
                      tick={{ fill: "#cbd5e1", fontSize: 11 }}
                      interval={0}
                      angle={-12}
                      height={65}
                      tickMargin={8}
                    />
                    <YAxis
                      tick={{ fill: "#cbd5e1", fontSize: 11 }}
                      domain={[0, Math.max(5, Math.ceil(maxSeconds / 10) * 10)]}
                      tickFormatter={(v) => `${v}s`}
                    />
                    <Tooltip
                      contentStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#e2e8f0" }}
                      formatter={(value, _name, props) => {
                        const v = Number(value || 0);
                        const isB = props?.payload?.isBottleneck;
                        const label = isB ? "Time spent (bottleneck)" : "Time spent";
                        return [`${v}s`, label];
                      }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Bar dataKey="seconds" name="Seconds">
                      {chartData.map((entry) => (
                        <Cell key={entry.key} fill={entry.isBottleneck ? "#ef4444" : "#60a5fa"} />
                      ))}
                      <LabelList dataKey="seconds" position="top" formatter={(v) => (v ? `${v}s` : "")} fill="#cbd5e1" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

