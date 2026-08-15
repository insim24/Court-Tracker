"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addWatchedAdvocate,
  removeWatchedAdvocate,
  type WatchedAdvocateState,
} from "@/app/actions";

const initialState: WatchedAdvocateState = { error: null };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
    >
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

export function WatchedAdvocates({
  advocates,
}: {
  advocates: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState(addWatchedAdvocate, initialState);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">Watched advocates</h2>
      <p className="text-xs text-muted">
        Flagged in the causelist even for cases not in your tracker.
      </p>
      <div className="flex flex-wrap gap-2">
        {advocates.map((a) => (
          <span
            key={a.id}
            className="flex items-center gap-1 rounded-full bg-chip px-3 py-1 text-xs"
          >
            {a.name}
            <form action={removeWatchedAdvocate.bind(null, a.id)}>
              <button
                type="submit"
                className="text-red-600 hover:underline"
                aria-label={`Remove ${a.name}`}
              >
                ×
              </button>
            </form>
          </span>
        ))}
        {advocates.length === 0 && (
          <span className="text-xs text-zinc-500">None yet.</span>
        )}
      </div>
      <form action={formAction} className="flex gap-2">
        <input
          name="name"
          placeholder="Advocate name"
          required
          className="flex-1 rounded border border-border bg-transparent px-3 py-1.5 text-sm"
        />
        <AddButton />
      </form>
      {state.error && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
    </div>
  );
}
