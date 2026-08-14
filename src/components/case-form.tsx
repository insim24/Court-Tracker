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
      className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
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
      className="grid w-full grid-cols-1 gap-3 rounded-lg border border-black/[.08] p-4 sm:grid-cols-2 dark:border-white/[.145]"
    >
      <div className="sm:col-span-2">
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title *
        </label>
        <input
          id="title"
          name="title"
          required
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
          placeholder="e.g. Smith v. Jones"
        />
      </div>

      <div>
        <label htmlFor="case_number" className="mb-1 block text-sm font-medium">
          Case number
        </label>
        <input
          id="case_number"
          name="case_number"
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
        />
      </div>

      <div>
        <label htmlFor="court" className="mb-1 block text-sm font-medium">
          Court
        </label>
        <input
          id="court"
          name="court"
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
        />
      </div>

      <div>
        <label htmlFor="case_type" className="mb-1 block text-sm font-medium">
          Case type
        </label>
        <input
          id="case_type"
          name="case_type"
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
        />
      </div>

      <div>
        <label htmlFor="status" className="mb-1 block text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue="open"
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
        >
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label htmlFor="filed_date" className="mb-1 block text-sm font-medium">
          Filed date
        </label>
        <input
          id="filed_date"
          name="filed_date"
          type="date"
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
        />
      </div>

      <div>
        <label
          htmlFor="next_hearing_date"
          className="mb-1 block text-sm font-medium"
        >
          Next hearing date
        </label>
        <input
          id="next_hearing_date"
          name="next_hearing_date"
          type="date"
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="w-full rounded border border-black/[.08] bg-transparent px-3 py-2 text-sm dark:border-white/[.145]"
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
