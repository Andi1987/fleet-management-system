import { useEffect, useRef, useState } from "react";

export interface MultiSelectOption {
  value: string;
  label: string;
  secondaryLabel?: string;
}

interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  loading?: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onChange: (values: string[]) => void;
  onLoadMore?: () => void;
}

export function MultiSelect({
  label,
  placeholder,
  options,
  selectedValues,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onChange,
  onLoadMore,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredOptions = options.filter(
    (option) =>
      option.label
        .toLowerCase()
        .includes(normalizedSearch) ||
      option.secondaryLabel
        ?.toLowerCase()
        .includes(normalizedSearch) ||
      option.value
        .toLowerCase()
        .includes(normalizedSearch),
  );

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(
        selectedValues.filter(
          (item) => item !== value,
        ),
      );
    } else {
      onChange([
        ...selectedValues,
        value,
      ]);
    }
  };

  const handleScroll = (
    event: React.UIEvent<HTMLDivElement>,
  ) => {
    const element = event.currentTarget;

    const reachedBottom =
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - 20;

    if (
      reachedBottom &&
      hasMore &&
      !loadingMore &&
      onLoadMore
    ) {
      onLoadMore();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm outline-none transition hover:border-slate-400 focus:border-slate-500"
      >
        <span className="truncate text-slate-700">
          {selectedValues.length === 0
            ? placeholder
            : `${selectedValues.length} selected`}
        </span>

        <span className="ml-2 text-slate-400">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 p-3">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div
            className="max-h-64 overflow-y-auto p-2"
            onScroll={handleScroll}
          >
            {loading ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-500">
                No options found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const checked =
                  selectedValues.includes(
                    option.value,
                  );

                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleValue(
                          option.value,
                        )
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
                    />

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800">
                        {option.label}
                      </span>

                      {option.secondaryLabel && (
                        <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-400">
                          {option.secondaryLabel}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })
            )}

            {loadingMore && (
              <div className="px-3 py-3 text-center text-xs text-slate-500">
                Loading more...
              </div>
            )}

            {!loadingMore &&
              hasMore &&
              filteredOptions.length > 0 && (
                <div className="px-3 py-3 text-center text-xs text-slate-400">
                  Scroll for more
                </div>
              )}
          </div>

          {selectedValues.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
              <span className="text-xs text-slate-500">
                {selectedValues.length} selected
              </span>

              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}