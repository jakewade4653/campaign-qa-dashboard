import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getWorkflowsDueForReminder: vi.fn(),
  getTeamEmailByName: vi.fn(),
  updateWorkflow: vi.fn().mockResolvedValue(undefined),
}));

// Mock email module
vi.mock("./email", () => ({
  sendDeadlineReminderNotification: vi.fn().mockResolvedValue(true),
}));

import { runDeadlineReminderJob } from "./deadlineReminder";
import * as db from "./db";
import * as email from "./email";

const mockWorkflow = {
  id: 1,
  campaignName: "MSC_META_GALVESTON_TEST",
  createdByName: "Jake Wade",
  deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10), // 12h from now
  deadlineReminderSentAt: null,
  status: "in_progress",
  archived: "0",
};

describe("runDeadlineReminderJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a reminder email when a workflow is due within 24h and not yet reminded", async () => {
    vi.mocked(db.getWorkflowsDueForReminder).mockResolvedValue([mockWorkflow] as any);
    vi.mocked(db.getTeamEmailByName).mockResolvedValue("jake.wade@omc.com");

    await runDeadlineReminderJob();

    expect(email.sendDeadlineReminderNotification).toHaveBeenCalledOnce();
    expect(email.sendDeadlineReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: "jake.wade@omc.com",
        toName: "Jake Wade",
        campaignName: "MSC_META_GALVESTON_TEST",
      })
    );
    expect(db.updateWorkflow).toHaveBeenCalledWith(1, expect.objectContaining({
      deadlineReminderSentAt: expect.any(Date),
    }));
  });

  it("does NOT send a reminder if deadlineReminderSentAt is already set", async () => {
    const alreadyReminded = { ...mockWorkflow, deadlineReminderSentAt: new Date() };
    vi.mocked(db.getWorkflowsDueForReminder).mockResolvedValue([alreadyReminded] as any);

    await runDeadlineReminderJob();

    expect(email.sendDeadlineReminderNotification).not.toHaveBeenCalled();
    expect(db.updateWorkflow).not.toHaveBeenCalled();
  });

  it("does NOT send a reminder if no email is found for the creator", async () => {
    vi.mocked(db.getWorkflowsDueForReminder).mockResolvedValue([mockWorkflow] as any);
    vi.mocked(db.getTeamEmailByName).mockResolvedValue(null);

    await runDeadlineReminderJob();

    expect(email.sendDeadlineReminderNotification).not.toHaveBeenCalled();
  });

  it("does nothing when there are no workflows due for reminder", async () => {
    vi.mocked(db.getWorkflowsDueForReminder).mockResolvedValue([]);

    await runDeadlineReminderJob();

    expect(email.sendDeadlineReminderNotification).not.toHaveBeenCalled();
    expect(db.updateWorkflow).not.toHaveBeenCalled();
  });

  it("does NOT send if createdByName is missing", async () => {
    const noCreator = { ...mockWorkflow, createdByName: null };
    vi.mocked(db.getWorkflowsDueForReminder).mockResolvedValue([noCreator] as any);

    await runDeadlineReminderJob();

    expect(email.sendDeadlineReminderNotification).not.toHaveBeenCalled();
  });
});
