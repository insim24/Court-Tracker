"use client";

import { MonthCalendar } from "./month-calendar";

export function CauselistCalendar({
  selectedDate,
  trackedCounts,
  availableDates,
}: {
  selectedDate: string | null;
  trackedCounts: Record<string, number>;
  availableDates: string[];
}) {
  return (
    <MonthCalendar
      basePath="/cause-list"
      selectedDate={selectedDate}
      primaryCounts={trackedCounts}
      primaryLabel="Tracked case hearing"
      secondaryDates={availableDates}
      secondaryLabel="Causelist fetched"
    />
  );
}
