// Deadline status utilities

export type DeadlineStatus = "overdue" | "due-today" | "due-soon" | "on-track" | "none";

export function getDeadlineStatus(deadline: string | null | undefined): DeadlineStatus {
  if (!deadline) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "due-today";
  if (diffDays <= 2) return "due-soon";
  return "on-track";
}

export function formatDeadline(deadline: string | null | undefined): string {
  if (!deadline) return "";
  const due = new Date(deadline + "T00:00:00");
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntilDeadline(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const DEADLINE_STYLES: Record<DeadlineStatus, { bg: string; text: string; label: string }> = {
  overdue:   { bg: "#FEE2E2", text: "#991B1B", label: "Overdue" },
  "due-today": { bg: "#FEF3C7", text: "#92400E", label: "Due Today" },
  "due-soon":  { bg: "#FEF9C3", text: "#854D0E", label: "Due Soon" },
  "on-track":  { bg: "#DCFCE7", text: "#166534", label: "On Track" },
  none:        { bg: "#F1F5F9", text: "#64748B", label: "No Deadline" },
};
