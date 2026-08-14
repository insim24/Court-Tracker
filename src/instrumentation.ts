export async function register() {
  // node-cron needs a long-lived process to keep its interval alive, which
  // only exists in local dev. On Vercel each request is a fresh serverless
  // invocation, so this scheduler cannot run there anyway — and importing it
  // eagerly here was crashing every request (pdf-parse's pdfjs-dist pulls in
  // DOMMatrix, unavailable in the Vercel Node runtime). The GitHub Actions
  // cron job covers the deployed environment instead.
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { startCauselistScheduler } = await import(
      "@/lib/causelist-scheduler"
    );
    startCauselistScheduler();
  }
}
