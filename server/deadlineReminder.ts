/**
 * Deadline Reminder Job
 * Runs every hour. Sends an email to the workflow creator (looked up by name
 * in team_emails) when a workflow's deadline is within 24 hours.
 *
 * Deduplication: once a reminder is sent, deadlineReminderSentAt is stamped
 * in the database so the email is never sent twice — even across server restarts.
 */
import { getWorkflowsDueForReminder, getTeamEmailByName, updateWorkflow } from "./db";
import { sendDeadlineReminderNotification } from "./email";

export async function runDeadlineReminderJob(): Promise<void> {
  try {
    const workflows = await getWorkflowsDueForReminder(24);
    if (workflows.length === 0) return;

    for (const wf of workflows) {
      // Skip if already reminded (persisted in DB)
      if (wf.deadlineReminderSentAt) continue;

      const creatorName = wf.createdByName;
      if (!creatorName) continue;

      const creatorEmail = await getTeamEmailByName(creatorName);
      if (!creatorEmail) continue;

      const deadline = wf.deadline!;
      const now = new Date();
      const deadlineDate = new Date(deadline + "T23:59:59Z");
      const msRemaining = deadlineDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      const workflowUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL ?? ""}/workflow/${wf.id}`;

      const sent = await sendDeadlineReminderNotification({
        toName: creatorName,
        toEmail: creatorEmail,
        campaignName: wf.campaignName,
        deadline,
        daysRemaining,
        workflowUrl,
      });

      if (sent) {
        // Stamp the DB so this workflow is never reminded again
        await updateWorkflow(wf.id, { deadlineReminderSentAt: new Date() });
        console.log(`[DeadlineReminder] Sent reminder for workflow ${wf.id} (${wf.campaignName}) to ${creatorEmail}`);
      }
    }
  } catch (err) {
    console.error("[DeadlineReminder] Job failed:", err);
  }
}

/**
 * Start the hourly deadline reminder scheduler.
 * Call this once from the server entry point after startup.
 */
export function startDeadlineReminderScheduler(): void {
  // Run once immediately on startup (catches any missed reminders)
  runDeadlineReminderJob().catch(console.error);
  // Then run every hour
  setInterval(() => {
    runDeadlineReminderJob().catch(console.error);
  }, 60 * 60 * 1000);
  console.log("[DeadlineReminder] Scheduler started — checking every hour.");
}
