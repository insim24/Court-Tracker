"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  fetchLatestCauselist,
  type FetchCauselistState,
} from "@/app/actions";

const initialState: FetchCauselistState = { error: null, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
    >
      {pending ? "Fetching…" : "Fetch latest causelist"}
    </button>
  );
}

export function FetchCauselistButton() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    fetchLatestCauselist,
    initialState,
  );

  // Belt-and-suspenders: revalidatePath() in the action already tells Next.js
  // the data is stale, but explicitly refreshing here guarantees every
  // server-rendered piece on this page (including the Today's Cases widget,
  // which reads a separate query for "today" that may differ from whatever
  // date is currently selected) re-fetches immediately after a successful
  // pull, with no manual reload needed.
  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
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
