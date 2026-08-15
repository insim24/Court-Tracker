"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  fetchAllCaseOrders,
  type FetchAllOrdersState,
} from "@/app/actions";

const initialState: FetchAllOrdersState = { error: null, message: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-accent-border bg-accent-bg px-4 py-1.5 text-xs font-medium text-accent-strong transition-colors duration-200 hover:bg-accent-bg disabled:opacity-50"
    >
      {pending ? "Fetching orders for all cases…" : "Fetch orders for all cases"}
    </button>
  );
}

export function FetchAllOrdersButton() {
  const router = useRouter();
  const [state, formAction] = useActionState(fetchAllCaseOrders, initialState);

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
