import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sender address — uses Resend's shared domain for testing;
// swap for a verified custom domain when ready (e.g. qa@jump450.com)
const FROM = "Campaign QA Dashboard <onboarding@resend.dev>";

// Jenna Radomsky is always CC'd on all QA notification emails
const CC_ALWAYS = ["jenna.radomsky@omc.com"];

// Shared role labels used across all email helpers
const ROLE_LABELS: Record<string, string> = {
  builder: "Builder",
  qa1: "QA1 (Manager)",
  qa2: "QA2 (Associate Director)",
  md: "MD",
  ed: "ED",
};

export interface NotifySignOffParams {
  toName: string;
  toEmail: string;
  fromName: string;
  fromRole: string;
  nextRole: string;
  campaignName: string;
  launchType: string;
  platform: string;
  client: string;
  deadline?: string | null;
  workflowUrl: string;
  customNote?: string | null;
}

export interface NotifyFailItemParams {
  toName: string;
  toEmail: string;
  reviewerName: string;
  reviewerRole: string;
  campaignName: string;
  itemLabel: string;
  sectionLabel: string;
  note?: string | null;
  workflowUrl: string;
}

export interface NotifyDeadlineParams {
  toName: string;
  toEmail: string;
  campaignName: string;
  deadline: string;
  daysRemaining: number;
  workflowUrl: string;
}

export interface NotifyNextReviewerParams {
  toName: string;
  toEmail: string;
  fromName: string;
  fromRole: string;
  campaignName: string;
  launchType: string;
  platform: string;
  client: string;
  deadline?: string | null;
  workflowUrl: string;
  customNote?: string | null;
}

function baseHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #000033; padding: 20px 28px; display: flex; align-items: center; gap: 12px; }
    .header-title { color: #fff; font-size: 14px; font-weight: bold; letter-spacing: 0.06em; text-transform: uppercase; }
    .omd-badge { background: #E8321A; color: #fff; font-size: 12px; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.04em; }
    .body { padding: 28px; }
    .body h2 { color: #000033; font-size: 18px; margin: 0 0 8px; }
    .body p { color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .meta-table td { padding: 6px 0; font-size: 13px; }
    .meta-table td:first-child { color: #6B7280; width: 110px; }
    .meta-table td:last-child { color: #000033; font-weight: 600; }
    .cta { display: inline-block; background: #E8321A; color: #fff !important; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-size: 14px; font-weight: bold; margin-top: 4px; }
    .note-box { background: #FEF3C7; border-left: 3px solid #F59E0B; padding: 10px 14px; border-radius: 4px; font-size: 13px; color: #92400E; margin-bottom: 16px; }
    .footer { background: #F9FAFB; padding: 16px 28px; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span class="omd-badge">omd</span>
      <span class="header-title">Campaign QA Dashboard</span>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
    </div>
    <div class="footer">
      MSC Cruises · Jump450 / OMD · This is an automated notification from the Campaign QA Dashboard.
    </div>
  </div>
</body>
</html>`;
}

export async function sendSignOffNotification(params: NotifySignOffParams): Promise<boolean> {
  const {
    toName, toEmail, fromName, fromRole, nextRole,
    campaignName, launchType, platform, client, deadline, workflowUrl, customNote,
  } = params;

  const body = `
    <p>Hi ${toName},</p>
    <p><strong>${fromName}</strong> (${ROLE_LABELS[fromRole] ?? fromRole}) has completed their review and it's now your turn as <strong>${ROLE_LABELS[nextRole] ?? nextRole}</strong>.</p>
    ${customNote ? `<div class="note-box"><strong>Note from ${fromName}:</strong> ${customNote}</div>` : ""}
    <table class="meta-table">
      <tr><td>Campaign</td><td>${campaignName}</td></tr>
      <tr><td>Client</td><td>${client}</td></tr>
      <tr><td>Platform</td><td>${platform}</td></tr>
      <tr><td>Launch Type</td><td>${launchType}</td></tr>
      ${deadline ? `<tr><td>QA Deadline</td><td>${deadline}</td></tr>` : ""}
    </table>
    <a href="${workflowUrl}" class="cta">Open Checklist →</a>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [toEmail],
      cc: CC_ALWAYS,
      subject: `[QA Action Required] ${campaignName} — ${ROLE_LABELS[nextRole] ?? nextRole} Review`,
      html: baseHtml(`Your QA review is ready`, body),
    });
    if (error) {
      console.error("[Email] sendSignOffNotification error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] sendSignOffNotification exception:", err);
    return false;
  }
}

export async function sendFailItemNotification(params: NotifyFailItemParams): Promise<boolean> {
  const {
    toName, toEmail, reviewerName, reviewerRole,
    campaignName, itemLabel, sectionLabel, note, workflowUrl,
  } = params;

  const body = `
    <p>Hi ${toName},</p>
    <p><strong>${reviewerName}</strong> (${ROLE_LABELS[reviewerRole] ?? reviewerRole}) has marked a checklist item as <strong style="color:#DC2626">FAIL</strong> on <strong>${campaignName}</strong>.</p>
    <table class="meta-table">
      <tr><td>Campaign</td><td>${campaignName}</td></tr>
      <tr><td>Section</td><td>${sectionLabel}</td></tr>
      <tr><td>Item</td><td>${itemLabel}</td></tr>
      ${note ? `<tr><td>Note</td><td style="color:#92400E">${note}</td></tr>` : ""}
    </table>
    <p>Please review and correct this item before the QA process can continue.</p>
    <a href="${workflowUrl}" class="cta">View Checklist →</a>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [toEmail],
      cc: CC_ALWAYS,
      subject: `[QA Fail] ${campaignName} — ${itemLabel}`,
      html: baseHtml(`Checklist item marked FAIL`, body),
    });
    if (error) {
      console.error("[Email] sendFailItemNotification error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] sendFailItemNotification exception:", err);
    return false;
  }
}

export async function sendDeadlineReminderNotification(params: NotifyDeadlineParams): Promise<boolean> {
  const { toName, toEmail, campaignName, deadline, daysRemaining, workflowUrl } = params;

  const urgency = daysRemaining === 0 ? "due TODAY" : `due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

  const body = `
    <p>Hi ${toName},</p>
    <p>This is a reminder that the QA deadline for <strong>${campaignName}</strong> is <strong>${urgency}</strong>.</p>
    <table class="meta-table">
      <tr><td>Campaign</td><td>${campaignName}</td></tr>
      <tr><td>Deadline</td><td>${deadline}</td></tr>
    </table>
    <a href="${workflowUrl}" class="cta">Open Checklist →</a>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [toEmail],
      cc: CC_ALWAYS,
      subject: `[QA Deadline] ${campaignName} is ${urgency}`,
      html: baseHtml(`QA deadline reminder`, body),
    });
    if (error) {
      console.error("[Email] sendDeadlineReminderNotification error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] sendDeadlineReminderNotification exception:", err);
    return false;
  }
}

export async function sendNotifyNextReviewerEmail(params: NotifyNextReviewerParams): Promise<boolean> {
  const {
    toName, toEmail, fromName, fromRole,
    campaignName, launchType, platform, client, deadline, workflowUrl, customNote,
  } = params;

  const body = `
    <p>Hi ${toName},</p>
    <p><strong>${fromName}</strong> (${ROLE_LABELS[fromRole] ?? fromRole}) is requesting your review on <strong>${campaignName}</strong>.</p>
    ${customNote ? `<div class="note-box"><strong>Message from ${fromName}:</strong> ${customNote}</div>` : ""}
    <table class="meta-table">
      <tr><td>Campaign</td><td>${campaignName}</td></tr>
      <tr><td>Client</td><td>${client}</td></tr>
      <tr><td>Platform</td><td>${platform}</td></tr>
      <tr><td>Launch Type</td><td>${launchType}</td></tr>
      ${deadline ? `<tr><td>QA Deadline</td><td>${deadline}</td></tr>` : ""}
    </table>
    <a href="${workflowUrl}" class="cta">Open Checklist →</a>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [toEmail],
      cc: CC_ALWAYS,
      subject: `[QA Review Requested] ${campaignName}`,
      html: baseHtml(`QA review requested`, body),
    });
    if (error) {
      console.error("[Email] sendNotifyNextReviewerEmail error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] sendNotifyNextReviewerEmail exception:", err);
    return false;
  }
}
