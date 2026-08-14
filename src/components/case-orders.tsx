"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { fetchCaseOrders, type FetchOrdersState } from "@/app/actions";
import type { CaseOrderRow } from "@/lib/types";

const initialState: FetchOrdersState = { error: null, message: null };

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("en-GB");
}

function FetchButton({ hasOrders }: { hasOrders: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
    >
      {pending ? "Fetching…" : hasOrders ? "Refresh orders" : "Fetch orders"}
    </button>
  );
}

export function CaseOrders({
  caseId,
  orders,
}: {
  caseId: string;
  orders: CaseOrderRow[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(fetchCaseOrders, initialState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.message) {
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.message]);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="text-xs"
    >
      <summary className="cursor-pointer font-medium text-blue-600 hover:underline dark:text-blue-400">
        Orders{orders.length > 0 ? ` (${orders.length})` : ""}
      </summary>
      <div className="mt-2 flex flex-col items-start gap-2">
        <form action={formAction}>
          <input type="hidden" name="caseId" value={caseId} />
          <FetchButton hasOrders={orders.length > 0} />
        </form>
        {state.error && (
          <span className="text-red-600" role="alert">
            {state.error}
          </span>
        )}
        {state.message && (
          <span className="text-green-600">{state.message}</span>
        )}
        {orders.length === 0 && !state.message && (
          <span className="text-zinc-500">No orders fetched yet.</span>
        )}
        {orders.length > 0 && (
          <ul className="flex w-full flex-col gap-1.5">
            {orders.map((o) => (
              <li key={o.id}>
                <a
                  href={o.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-600 hover:underline dark:text-blue-400"
                >
                  <span
                    className={
                      o.order_type === "final"
                        ? "rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }
                  >
                    {o.order_type === "final" ? "Final" : "Daily"}
                  </span>
                  {formatDate(o.order_date)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
