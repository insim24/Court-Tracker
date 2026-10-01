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

function CourtRow({ entry }: { entry: DisplayBoardEntry }) {
  const label =
    entry.courtNo === "Registrar Court"
      ? "Registrar Court"
      : `Court ${entry.courtNo}`;

  return (
    <li className="flex flex-col gap-0.5 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-accent-strong">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${entry.inSession ? "bg-green-500" : "bg-zinc-400 dark:bg-zinc-600"}`}
          />
          {label}
        </span>
        {entry.inSession && (
          <span className="text-base font-semibold text-foreground">
            #{entry.itemNo ?? "—"}
          </span>
        )}
      </div>
      {entry.inSession ? (
        <>
          {entry.caseNo && (
            <span className="text-xs font-medium text-foreground">
              {entry.caseNo}
            </span>
          )}
          {entry.causeTitle && (
            <span className="truncate text-xs text-muted" title={entry.causeTitle}>
              {entry.causeTitle}
            </span>
          )}
          {entry.passover && (
            <span className="text-[11px] text-zinc-500">
              Passover: {entry.passover}
            </span>
          )}
        </>
      ) : (
        (entry.statusMessage || entry.note) && (
          <span className="text-xs text-muted">
            {entry.statusMessage ?? entry.note}
          </span>
        )
      )}
    </li>
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>
          {fetchedAt
            ? `Updated ${formatTime(fetchedAt)} · every ${POLL_INTERVAL_MS / 1000}s`
            : "Loading…"}
        </span>
        <button
          type="button"
          onClick={load}
          className="font-medium text-accent hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {!error && !loading && sorted.length === 0 && (
        <p className="text-xs text-muted">
          No courts are on the board right now. It only lists courts that
          are active.
        </p>
      )}

      {sorted.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sorted.map((entry, i) => (
            <CourtRow key={`${entry.courtNo}-${i}`} entry={entry} />
          ))}
        </ul>
      )}
    </div>
  );
}
