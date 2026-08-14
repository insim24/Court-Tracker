"use client";

import { MonthCalendar } from "./month-calendar";

export function CaseCalendar({
  selectedDate,
  hearingCounts,
}: {
  selectedDate: string | null;
  hearingCounts: Record<string, number>;
}) {
  return (
    <MonthCalendar
      basePath="/"
      selectedDate={selectedDate}
      primaryCounts={hearingCounts}
      primaryLabel="Hearing scheduled"
      compact
    />
  );
}
