import Link from "next/link";
import { DisplayBoardView } from "@/components/display-board-view";

export default function DisplayBoardPage() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans animate-fade-in">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Live Display Board
            </h1>
            <p className="text-sm text-muted">
              CAT Srinagar Bench — which case each courtroom is hearing right
              now.
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-accent hover:underline"
          >
            ← Back to cases
          </Link>
        </div>

        <DisplayBoardView />
      </main>
    </div>
  );
}
