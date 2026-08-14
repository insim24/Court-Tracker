"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toIso(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function parseIso(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

type DayCell = {
  iso: string;
  day: number;
  inCurrentMonth: boolean;
};

function buildMonthGrid(year: number, month: number): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: DayCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({ iso: toIso(prevYear, prevMonth, day), day, inCurrentMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIso(year, month, day), day, inCurrentMonth: true });
  }
  const trailing = 42 - cells.length;
  for (let day = 1; day <= trailing; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({ iso: toIso(nextYear, nextMonth, day), day, inCurrentMonth: false });
  }

  return cells;
}

export function MonthCalendar({
  basePath,
  selectedDate,
  primaryCounts,
  primaryLabel,
  secondaryDates,
  secondaryLabel,
  compact = false,
}: {
  basePath: string;
  selectedDate: string | null;
  primaryCounts: Record<string, number>;
  primaryLabel: string;
  secondaryDates?: string[];
  secondaryLabel?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const today = new Date();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const initial = selectedDate ? parseIso(selectedDate) : parseIso(todayIso);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const secondarySet = new Set(secondaryDates ?? []);
  const cells = buildMonthGrid(viewYear, viewMonth);

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function selectDay(cell: DayCell) {
    if (!cell.inCurrentMonth) {
      const { year, month } = parseIso(cell.iso);
      setViewYear(year);
      setViewMonth(month);
    }
    router.push(`${basePath}?date=${cell.iso}`);
  }

  return (
    <div
      className={[
        "flex flex-col rounded-lg border border-blue-100 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30",
        compact ? "gap-2 p-3" : "gap-3 p-4",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          aria-label="Previous month"
          className={[
            "flex items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-blue-100 hover:text-black dark:hover:bg-blue-900/40 dark:hover:text-white",
            compact ? "h-6 w-6" : "h-8 w-8",
          ].join(" ")}
        >
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8L10 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          className={[
            "font-semibold text-black dark:text-zinc-50",
            compact ? "text-xs" : "text-sm",
          ].join(" ")}
        >
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          aria-label="Next month"
          className={[
            "flex items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-blue-100 hover:text-black dark:hover:bg-blue-900/40 dark:hover:text-white",
            compact ? "h-6 w-6" : "h-8 w-8",
          ].join(" ")}
        >
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3L11 8L6 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={compact ? "grid grid-cols-7 gap-0.5" : "grid grid-cols-7 gap-1"}>
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className={[
              "flex items-center justify-center font-medium text-zinc-500",
              compact ? "h-5 text-[10px]" : "h-7 text-xs",
            ].join(" ")}
          >
            {compact ? label[0] : label}
          </div>
        ))}

        {cells.map((cell) => {
          const isToday = cell.iso === todayIso;
          const isSelected = cell.iso === selectedDate;
          const primaryCount = primaryCounts[cell.iso] ?? 0;
          const hasSecondary = secondarySet.has(cell.iso);

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => selectDay(cell)}
              className={[
                "relative flex aspect-square flex-col items-center justify-center rounded-md transition-colors",
                compact ? "text-[11px]" : "rounded-lg text-sm",
                cell.inCurrentMonth
                  ? "text-black dark:text-zinc-50"
                  : "text-zinc-400 hover:text-black dark:text-zinc-600 dark:hover:text-zinc-50",
                isSelected
                  ? "bg-blue-200 ring-2 ring-inset ring-blue-500 dark:bg-blue-800/50"
                  : "hover:bg-blue-100 dark:hover:bg-blue-900/40",
              ].join(" ")}
            >
              <span
                className={
                  isToday
                    ? [
                        "flex items-center justify-center rounded-full bg-green-800 font-semibold text-white",
                        compact ? "h-4 w-4" : "h-6 w-6",
                      ].join(" ")
                    : ""
                }
              >
                {cell.day}
              </span>
              <span className={compact ? "flex h-1 items-center gap-0.5" : "flex h-1.5 items-center gap-0.5"}>
                {primaryCount > 0 && (
                  <span
                    className={[
                      "rounded-full bg-amber-500",
                      compact ? "h-1 w-1" : "h-1.5 w-1.5",
                    ].join(" ")}
                    title={`${primaryCount} ${primaryLabel}${primaryCount === 1 ? "" : "s"}`}
                  />
                )}
                {primaryCount === 0 && hasSecondary && (
                  <span
                    className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-600"
                    title={secondaryLabel}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {primaryLabel}
          </span>
          {secondaryLabel && (
            <span className="flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-600" />{" "}
              {secondaryLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
