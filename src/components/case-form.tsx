"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addCase, type AddCaseState } from "@/app/actions";

const initialState: AddCaseState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-gradient-to-r from-accent to-accent-strong px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-border transition-all duration-200 hover:shadow-md active:scale-[0.97] disabled:opacity-50 dark:shadow-none lg:rounded-full lg:bg-foreground lg:bg-none lg:px-5 lg:py-2 lg:text-background lg:shadow-none lg:hover:bg-[#383838] lg:active:scale-100 lg:dark:hover:bg-[#ccc]"
    >
      {pending ? "Adding…" : "Add case"}
    </button>
  );
}

export function CaseForm() {
  const [state, formAction] = useActionState(addCase, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid w-full grid-cols-1 gap-4 rounded-2xl border border-accent-border bg-gradient-to-br from-surface to-accent-bg p-4 shadow-sm sm:grid-cols-2 lg:gap-3 lg:rounded-lg lg:border-border lg:bg-none lg:p-4 lg:shadow-none"
    >
      <div className="sm:col-span-2">
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Title *
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
          placeholder="e.g. Smith v. Jones"
        />
      </div>

      <div>
        <label htmlFor="case_number" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Case number
        </label>
        <input
          id="case_number"
          name="case_number"
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        />
      </div>

      <div>
        <label htmlFor="court" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Court
        </label>
        <input
          id="court"
          name="court"
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        />
      </div>

      <div>
        <label htmlFor="case_type" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Case type
        </label>
        <input
          id="case_type"
          name="case_type"
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="open"
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        >
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label htmlFor="filed_date" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Filed date
        </label>
        <input
          id="filed_date"
          name="filed_date"
          type="date"
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        />
      </div>

      <div>
        <label
          htmlFor="next_hearing_date"
          className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit"
        >
          Next hearing date
        </label>
        <input
          id="next_hearing_date"
          name="next_hearing_date"
          type="date"
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-accent-strong lg:text-inherit lg:dark:text-inherit">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded-xl border border-accent-border bg-accent-bg/40 px-3 py-2.5 text-sm shadow-sm outline-none transition-all duration-200 placeholder:text-zinc-400 focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent-bg dark:focus:bg-slate-900 lg:rounded lg:border-border lg:bg-transparent lg:py-2 lg:shadow-none lg:focus:border-border lg:focus:bg-transparent lg:focus:ring-0 lg:dark:bg-transparent lg:dark:focus:bg-transparent lg:dark:focus:ring-0"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 sm:col-span-2" role="alert">
          {state.error}
        </p>
      )}

      <div className="sm:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
