interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

type PageItem = number | "ellipsis";

function getPageItems(
  currentPage: number,
  totalPages: number,
): PageItem[] {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "ellipsis",
      totalPages,
    ];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  loading = false,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start =
    total === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const end =
    total === 0
      ? 0
      : Math.min(page * pageSize, total);

  const pageItems = getPageItems(
    page,
    totalPages,
  );

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-900">
            {start}–{end}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-900">
            {total}
          </span>{" "}
          vehicles
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="page-size"
            className="text-sm text-slate-500"
          >
            Per page
          </label>

          <select
            id="page-size"
            value={pageSize}
            disabled={loading}
            onChange={(event) =>
              onPageSizeChange(
                Number(event.target.value),
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={
              !hasPreviousPage || loading
            }
            onClick={() =>
              onPageChange(page - 1)
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    onPageChange(item)
                  }
                  className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    item === page
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <span className="px-2 text-sm text-slate-600 sm:hidden">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={!hasNextPage || loading}
            onClick={() =>
              onPageChange(page + 1)
            }
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}