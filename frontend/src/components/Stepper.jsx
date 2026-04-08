export default function Stepper({ steps, currentIndex }) {
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, idx) => {
          const state =
            idx === currentIndex ? "current" : idx < currentIndex ? "done" : "todo";
          const base =
            "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium";
          const cls =
            state === "current"
              ? "border-indigo-500/60 bg-indigo-500/10 text-indigo-200"
              : state === "done"
              ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
              : "border-slate-800 bg-slate-900 text-slate-300";
          return (
            <div key={s.key} className={`${base} ${cls}`}>
              <span className="opacity-80">{idx + 1}</span>
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

