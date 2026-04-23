import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./email", () => ({
  sendSignOffNotification: vi.fn().mockResolvedValue(true),
  sendFailItemNotification: vi.fn().mockResolvedValue(true),
  sendNotifyNextReviewerEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./db", () => ({
  createWorkflow: vi.fn().mockResolvedValue(42),
  getWorkflows: vi.fn().mockResolvedValue([
    {
      id: 1,
      campaignName: "MSC_META_US_AWARENESS_Q2_2026",
      client: "MSC Cruises",
      platform: "meta",
      launchType: "campaign_launch",
      market: "US",
      campaignId: "123456",
      status: "in_progress",
      checklistData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getWorkflowById: vi.fn().mockResolvedValue({
    id: 1,
    campaignName: "MSC_META_US_AWARENESS_Q2_2026",
    client: "MSC Cruises",
    platform: "meta",
    launchType: "campaign_launch",
    status: "in_progress",
    archived: "0",
    checklistData: {},
    builderSignOff: null,
    qa1SignOff: null,
    qa2SignOff: null,
    mdSignOff: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateWorkflow: vi.fn().mockResolvedValue(undefined),
  addWorkflowLog: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
  upsertTeamEmail: vi.fn().mockResolvedValue(undefined),
  getTeamEmailByName: vi.fn().mockResolvedValue(null),
  getAllTeamEmails: vi.fn().mockResolvedValue([]),
  archiveWorkflow: vi.fn().mockResolvedValue(undefined),
  updateWorkflowDeadline: vi.fn().mockResolvedValue(undefined),
  getWorkflowLogs: vi.fn().mockResolvedValue([
    {
      id: 1,
      workflowId: 1,
      actorName: "Jake",
      actorRole: "md",
      action: "workflow_created",
      details: { launchType: "campaign_launch", platform: "meta" },
      campaignName: "MSC_META_US_AWARENESS_Q2_2026",
      client: "MSC Cruises",
      platform: "meta",
      launchType: "campaign_launch",
      createdAt: new Date(),
    },
  ]),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("workflows.list", () => {
  it("returns list of workflows", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.list({});
    expect(result).toHaveLength(1);
    expect(result[0].campaignName).toBe("MSC_META_US_AWARENESS_Q2_2026");
  });
});

describe("workflows.create", () => {
  it("creates a workflow and returns id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.create({
      campaignName: "MSC_META_US_TEST",
      client: "MSC Cruises",
      platform: "meta",
      launchType: "campaign_launch",
      createdByName: "Jake",
    });
    expect(result.id).toBe(42);
  });

  it("requires a campaign name", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.workflows.create({
        campaignName: "",
        client: "MSC Cruises",
        platform: "meta",
        launchType: "campaign_launch",
      })
    ).rejects.toThrow();
  });
});

describe("workflows.byId", () => {
  it("returns a workflow by id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.byId({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.platform).toBe("meta");
  });
});

describe("workflows.updateChecklist", () => {
  it("updates a checklist item", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.updateChecklist({
      workflowId: 1,
      sectionId: "campaign_setup",
      itemId: "campaign_status_paused",
      item: {
        status: "pass",
        reviewer: "Jake",
        reviewerRole: "builder",
        updatedAt: new Date().toISOString(),
      },
      actorName: "Jake",
      actorRole: "builder",
    });
    expect(result.success).toBe(true);
  });
});

describe("workflows.signOff", () => {
  it("signs off as builder and advances to pending_qa1", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.signOff({
      workflowId: 1,
      role: "builder",
      name: "Jake",
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("pending_qa1");
  });

  it("signs off as md and advances to approved", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.signOff({
      workflowId: 1,
      role: "md",
      name: "Jake",
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("approved");
  });

  it("signs off as ed and advances to approved", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.signOff({
      workflowId: 1,
      role: "ed",
      name: "Rob Pearsall",
    });
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("approved");
  });
});

describe("workflows.notifyNextReviewer", () => {
  it("sends a notification email and returns success", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.notifyNextReviewer({
      workflowId: 1,
      toEmail: "rob.pearsall@omc.com",
      toName: "Rob Pearsall",
      actorName: "Jake Wade",
      actorRole: "md",
      customNote: "Please review ASAP",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.workflows.notifyNextReviewer({
        workflowId: 1,
        toEmail: "not-an-email",
        toName: "Rob Pearsall",
        actorName: "Jake Wade",
        actorRole: "md",
      })
    ).rejects.toThrow();
  });
});

describe("logs.list", () => {
  it("returns activity logs", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.logs.list({});
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("workflow_created");
    expect(result[0].actorName).toBe("Jake");
  });
});

describe("workflows.archive", () => {
  it("archives a workflow", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.archive({
      workflowId: 1,
      archive: true,
      actorName: "Jake",
    });
    expect(result.success).toBe(true);
  });

  it("unarchives a workflow", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.workflows.archive({
      workflowId: 1,
      archive: false,
      actorName: "Jake",
    });
    expect(result.success).toBe(true);
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
