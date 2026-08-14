import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createBackgroundClient } from "@/lib/supabase/background";
import { getTrackedListingsForDate } from "@/lib/causelist-matching";
import { fetchDisplayBoard } from "@/lib/adapters/cgat-displayboard";
import { todayIso } from "@/lib/date";

// How many serials ahead counts as "coming up soon".
const ALERT_THRESHOLD = 2;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createBackgroundClient();
  const today = todayIso();

  const listings = await getTrackedListingsForDate(supabase, today);
  const relevant = listings.filter(
    (l) => l.courtNo !== null && l.serialNo !== null,
  );

  if (relevant.length === 0) {
    return NextResponse.json({
      checked: 0,
      alertsSent: 0,
      message: "No tracked cases with a court/serial listed today.",
    });
  }

  let board;
  try {
    board = await fetchDisplayBoard();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Board fetch failed" },
      { status: 502 },
    );
  }

  const currentItemByCourt = new Map<string, number>();
  for (const entry of board) {
    if (entry.inSession && entry.itemNo !== null) {
      currentItemByCourt.set(entry.courtNo, entry.itemNo);
    }
  }

  const [{ data: existingAlerts }, { data: subscriptions }] =
    await Promise.all([
      supabase
        .from("display_board_alerts")
        .select("case_id")
        .eq("causelist_date", today),
      supabase.from("push_subscriptions").select("*"),
    ]);

  const alreadyAlerted = new Set(
    ((existingAlerts as { case_id: string }[] | null) ?? []).map(
      (a) => a.case_id,
    ),
  );
  const subs =
    (subscriptions as
      | { endpoint: string; p256dh: string; auth: string }[]
      | null) ?? [];

  const vapidConfigured =
    !!process.env.VAPID_SUBJECT &&
    !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    !!process.env.VAPID_PRIVATE_KEY;
  if (vapidConfigured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }

  let alertsSent = 0;
  for (const listing of relevant) {
    if (alreadyAlerted.has(listing.caseId)) continue;

    const currentItem = currentItemByCourt.get(String(listing.courtNo));
    if (currentItem === undefined) continue;

    const gap = listing.serialNo! - currentItem;
    if (gap < 0 || gap > ALERT_THRESHOLD) continue;

    if (vapidConfigured && subs.length > 0) {
      const payload = JSON.stringify({
        title: "Case coming up soon",
        body: `${listing.caseTitle} (${listing.caseNumber}) is #${listing.serialNo} in Court ${listing.courtNo} — now hearing #${currentItem}.`,
        url: "/cause-list",
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }
      }
    }

    await supabase.from("display_board_alerts").insert({
      case_id: listing.caseId,
      causelist_date: today,
      court_no: listing.courtNo,
      target_serial: listing.serialNo,
      board_serial_at_alert: currentItem,
    });
    alertsSent++;
  }

  return NextResponse.json({ checked: relevant.length, alertsSent });
}
