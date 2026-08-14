"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { refreshCaseFromCgat, type RefreshCaseState } from "@/app/actions";

const initialState: RefreshCaseState = { error: null, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
    >
      {pending ? "Refreshing…" : "Refresh from CGAT"}
    </button>
  );
}

export function RefreshCgatButton({ caseId }: { caseId: string }) {
  const [state, formAction] = useActionState(refreshCaseFromCgat, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="caseId" value={caseId} />
      <SubmitButton />
      {state.error && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
      {state.message && (
        <span className="text-xs text-green-600">{state.message}</span>
      )}
    </form>
  );
}
