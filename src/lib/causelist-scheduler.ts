import cron from "node-cron";
import { syncLatestCauselist } from "@/lib/causelist-sync";

// Runs once a day at 18:00 server time (chosen as a reasonable time for the
// tribunal to have published the next hearing day's causelist by). Only
// fires while this Node.js process is actually running — there's no
// external host-level cron here, so a stopped dev server or a machine that's
// asleep simply won't sync until it's next running past this time.
const DAILY_SCHEDULE = "0 18 * * *";

let started = false;

async function runSync() {
  const result = await syncLatestCauselist();
  if (result.error !== null) {
    console.error("[causelist-scheduler] sync failed:", result.error);
  } else {
    console.log(
      `[causelist-scheduler] synced ${result.count} entries for ${result.causelistDate}`,
    );
  }
}

export function startCauselistScheduler() {
  if (started) return;
  started = true;

  cron.schedule(DAILY_SCHEDULE, runSync);
  console.log(
    `[causelist-scheduler] registered, will run daily at 18:00 (schedule: ${DAILY_SCHEDULE})`,
  );
}
