"use client";

import { MonthCalendar } from "./month-calendar";

export function CaseCalendar({
  selectedDate,
  hearingCounts,
  compact = true,
}: {
  selectedDate: string | null;
  hearingCounts: Record<string, number>;
  compact?: boolean;
}) {
  return (
    <MonthCalendar
      basePath="/"
      selectedDate={selectedDate}
      primaryCounts={hearingCounts}
      primaryLabel="Hearing scheduled"
      compact={compact}
    />
  );
}
