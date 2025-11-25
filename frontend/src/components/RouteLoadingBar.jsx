// src/components/RouteLoadingBar.jsx
function RouteLoadingBar({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="mb-5">
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
              Calculating optimal route
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Using AI dispatcher…
          </span>
        </div>

        <div className="mt-2">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
            <div className="route-loading-bar absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteLoadingBar;
