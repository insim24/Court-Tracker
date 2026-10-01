"use client";

import { useCallback, useEffect, useState } from "react";
import type { DisplayBoardEntry } from "@/lib/adapters/cgat-displayboard";

const POLL_INTERVAL_MS = 10_000;

function courtSortKey(courtNo: string): number {
  const n = Number(courtNo);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

type BoardResult =
  | { ok: true; entries: DisplayBoardEntry[]; fetchedAt: string }
  | { ok: false; error: string };

async function fetchBoard(): Promise<BoardResult> {
  try {
    const res = await fetch("/api/cgat/srinagar/display-board", {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Failed to load display board." };
    }
    return { ok: true, entries: data.entries, fetchedAt: data.fetchedAt };
  } catch {
    return { ok: false, error: "Failed to load display board." };
  }
}

function CourtCard({ entry }: { entry: DisplayBoardEntry }) {
  const label =
    entry.courtNo === "Registrar Court"
      ? "Registrar Court"
      : `Court ${entry.courtNo}`;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <span
          className={[
            "whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
            entry.inSession
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-chip text-muted",
          ].join(" ")}
        >
          {entry.inSession ? "In session" : "Not in session"}
        </span>
      </div>

      {entry.note && <p className="text-xs text-muted">{entry.note}</p>}

      {entry.inSession ? (
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-semibold text-accent-strong">
            #{entry.itemNo ?? "—"}
          </p>
          {entry.caseNo && (
            <p className="text-sm font-medium text-foreground">
              {entry.caseNo}
            </p>
          )}
          {entry.causeTitle && (
            <p className="text-sm text-muted">{entry.causeTitle}</p>
          )}
          {entry.passover && (
            <p className="text-xs text-zinc-500">
              Passover: {entry.passover}
            </p>
          )}
        </div>
      ) : (
        entry.statusMessage && (
          <p className="text-sm text-muted">{entry.statusMessage}</p>
        )
      )}
    </div>
  );
}

export function DisplayBoardView() {
  const [entries, setEntries] = useState<DisplayBoardEntry[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const applyResult = useCallback((result: BoardResult) => {
    if (result.ok) {
      setEntries(result.entries);
      setFetchedAt(result.fetchedAt);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  const load = useCallback(() => {
    fetchBoard().then(applyResult);
  }, [applyResult]);

  useEffect(() => {
    let active = true;
    const tick = () => {
      fetchBoard().then((result) => {
        if (active) applyResult(result);
      });
    };
    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [applyResult]);

  const sorted = [...entries].sort(
    (a, b) => courtSortKey(a.courtNo) - courtSortKey(b.courtNo),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {fetchedAt
            ? `Last updated ${formatTime(fetchedAt)} · refreshes every ${POLL_INTERVAL_MS / 1000}s`
            : "Loading…"}
        </p>
        <button
          type="button"
          onClick={load}
          className="text-sm font-medium text-accent hover:underline"
        >
          Refresh now
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!error && !loading && sorted.length === 0 && (
        <p className="text-sm text-muted">
          No courts currently in session for CAT Srinagar. The board only
          lists courts that are active — check back once hearings are
          underway.
        </p>
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((entry) => (
            <CourtCard key={entry.courtNo} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
