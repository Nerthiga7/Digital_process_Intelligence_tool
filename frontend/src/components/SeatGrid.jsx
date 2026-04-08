const ROWS = "ABCDEFGH".split("");
const COLS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function SeatGrid({ selected, booked = [], onToggle }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 text-xs text-slate-400">Screen</div>
      <div className="mb-4 h-2 w-full rounded bg-slate-800" />
      <div className="grid gap-2">
        {ROWS.map((r) => (
          <div key={r} className="grid grid-cols-10 gap-2">
            {COLS.map((c) => {
              const seat = `${r}${c}`;
              const isSelected = selected.includes(seat);
              const isBooked = booked.includes(seat);
              return (
                <button
                  key={seat}
                  onClick={() => !isBooked && onToggle(seat)}
                  disabled={isBooked}
                  className={[
                    "h-9 rounded-lg border text-xs font-semibold transition",
                    isBooked
                      ? "border-rose-500 bg-rose-500/20 text-rose-100 cursor-not-allowed"
                      : isSelected
                      ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                      : "border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-900",
                  ].join(" ")}
                  type="button"
                >
                  {seat}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-slate-700 bg-slate-950"></div>
          Available
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-indigo-400 bg-indigo-500/20"></div>
          Selected
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-rose-500 bg-rose-500/20"></div>
          Booked
        </div>
      </div>
    </div>
  );
}

