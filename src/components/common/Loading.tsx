export function Loading() {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      role="status"
      aria-label="Loading vehicles"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </span>

        <div>
          <p className="text-sm font-bold text-slate-800">
            Loading fleet data
          </p>

          <p className="mt-0.5 text-xs text-slate-400">
            Fetching the latest vehicles from MBTA...
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-slate-200 p-5"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-slate-200" />
              <div className="flex-1">
                <div className="h-2.5 w-16 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-24 rounded bg-slate-200" />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="h-3 rounded bg-slate-100" />
              <div className="h-3 rounded bg-slate-100" />
              <div className="h-3 rounded bg-slate-100" />
            </div>

            <div className="mt-6 h-11 rounded-xl bg-slate-200" />
          </div>
        ))}
      </div>

      <span className="sr-only">
        Loading vehicles...
      </span>
    </div>
  );
}