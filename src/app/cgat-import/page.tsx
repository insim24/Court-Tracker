"use client";

import { useState } from "react";
import Link from "next/link";
import { AdvocateSearchTab } from "@/components/cgat/advocate-search-tab";
import { PartySearchTab } from "@/components/cgat/party-search-tab";
import { CaseNoTab } from "@/components/cgat/case-no-tab";

const TABS = [
  { id: "case-no", label: "Case No" },
  { id: "party-name", label: "Party Name" },
  { id: "advocate-name", label: "Advocate Name" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CgatImportPage() {
  const [tab, setTab] = useState<TabId>("case-no");

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Import from CGAT Srinagar
          </h1>
          <Link
            href="/"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to cases
          </Link>
        </div>

        <div className="flex gap-1 border-b border-black/[.08] dark:border-white/[.145]">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium ${
                tab === t.id
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "case-no" && <CaseNoTab />}
        {tab === "party-name" && <PartySearchTab />}
        {tab === "advocate-name" && <AdvocateSearchTab />}
      </main>
    </div>
  );
}
