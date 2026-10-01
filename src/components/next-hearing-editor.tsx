"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  setNextHearingDate,
  type SetNextHearingState,
} from "@/app/actions";

const initialState: SetNextHearingState = { error: null, success: false };

function formatDate(value: string | null) {
  if (!value) return "—";
  // Fixed locale so SSR and client hydration always agree.
  return new Date(value + "T00:00:00").toLocaleDateString("en-GB");
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

// Shows a case's next hearing date with an inline editor, so the date can be
// set or corrected by hand on any case, including CGAT-imported ones.
export function NextHearingEditor({
  caseId,
  value,
  className = "",
}: {
  caseId: string;
  value: string | null;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(
    async (prev: SetNextHearingState, formData: FormData) => {
      const result = await setNextHearingDate(prev, formData);
      if (result.success) setEditing(false);
      return result;
    },
    initialState,
  );

  if (!editing) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        {formatDate(value)}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs font-normal text-accent hover:underline"
          aria-label="Edit next hearing date"
        >
          {value ? "Edit" : "Set"}
        </button>
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="caseId" value={caseId} />
      <input
        type="date"
        name="next_hearing_date"
        defaultValue={value ?? ""}
        aria-label="Next hearing date"
        autoFocus
        className="rounded border border-border bg-transparent px-2 py-1 text-sm text-foreground"
      />
      <div className="flex items-center gap-2">
        <SaveButton />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
      <span className="text-[11px] text-zinc-500">
        Leave empty and save to clear.
      </span>
      {state.error && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}
