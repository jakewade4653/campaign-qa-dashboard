/**
 * Vercel Cron Job — Deadline Reminder
 * Runs every hour (configured in vercel.json).
 * Sends reminder emails to workflow creators whose deadline is within 24 hours.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runDeadlineReminderJob } from "../../server/deadlineReminder";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel cron jobs send a GET request with an Authorization header
  // containing the CRON_SECRET. Validate it to prevent unauthorized triggers.
  const authHeader = req.headers["authorization"];
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await runDeadlineReminderJob();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[Cron] Deadline reminder job failed:", err);
    return res.status(500).json({ error: "Job failed" });
  }
}
