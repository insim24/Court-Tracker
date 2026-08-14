export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCauselistScheduler } = await import(
      "@/lib/causelist-scheduler"
    );
    startCauselistScheduler();
  }
}
