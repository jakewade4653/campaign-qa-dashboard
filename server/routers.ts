import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createWorkflow,
  getWorkflows,
  getWorkflowById,
  updateWorkflow,
  addWorkflowLog,
  getWorkflowLogs,
} from "./db";

const checkItemSchema = z.object({
  status: z.enum(["pass", "fail", "na", "pending"]),
  note: z.string().optional(),
  reviewer: z.string().optional(),
  reviewerRole: z.enum(["builder", "qa1", "qa2", "md"]).optional(),
  updatedAt: z.string().optional(),
});

const workflowStatusSchema = z.enum([
  "in_progress",
  "pending_qa1",
  "pending_qa2",
  "pending_md",
  "approved",
  "rejected",
]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  workflows: router({
    list: publicProcedure
      .input(z.object({
        client: z.string().optional(),
        platform: z.string().optional(),
        launchType: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getWorkflows(input ?? {});
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const wf = await getWorkflowById(input.id);
        if (!wf) throw new Error("Workflow not found");
        return wf;
      }),

    create: publicProcedure
      .input(z.object({
        campaignName: z.string().min(1),
        client: z.string().default("MSC Cruises"),
        platform: z.string(),
        launchType: z.string(),
        market: z.string().optional(),
        campaignId: z.string().optional(),
        flightStart: z.string().optional(),
        flightEnd: z.string().optional(),
        budgetAmount: z.string().optional(),
        budgetType: z.string().optional(),
        adSetGroups: z.string().optional(),
        notes: z.string().optional(),
        createdByName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await createWorkflow({
          ...input,
          status: "in_progress",
          checklistData: {},
        });
        const newId = Number((result as any).insertId);
        await addWorkflowLog({
          workflowId: newId,
          actorName: input.createdByName ?? "Unknown",
          actorRole: "builder",
          action: "workflow_created",
          details: { launchType: input.launchType, platform: input.platform },
          campaignName: input.campaignName,
          client: input.client,
          platform: input.platform,
          launchType: input.launchType,
        });
        return { id: newId };
      }),

    updateChecklist: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        sectionId: z.string(),
        itemId: z.string(),
        item: checkItemSchema,
        actorName: z.string(),
        actorRole: z.enum(["builder", "qa1", "qa2", "md"]),
      }))
      .mutation(async ({ input }) => {
        const wf = await getWorkflowById(input.workflowId);
        if (!wf) throw new Error("Workflow not found");
        const existing = (wf.checklistData as Record<string, Record<string, unknown>>) ?? {};
        const section = existing[input.sectionId] ?? {};
        section[input.itemId] = input.item;
        existing[input.sectionId] = section;
        await updateWorkflow(input.workflowId, { checklistData: existing });
        await addWorkflowLog({
          workflowId: input.workflowId,
          actorName: input.actorName,
          actorRole: input.actorRole,
          action: "item_updated",
          details: { sectionId: input.sectionId, itemId: input.itemId, status: input.item.status, note: input.item.note },
          campaignName: wf.campaignName,
          client: wf.client,
          platform: wf.platform,
          launchType: wf.launchType,
        });
        return { success: true };
      }),

    signOff: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        role: z.enum(["builder", "qa1", "qa2", "md"]),
        name: z.string(),
      }))
      .mutation(async ({ input }) => {
        const wf = await getWorkflowById(input.workflowId);
        if (!wf) throw new Error("Workflow not found");
        const signOff = { name: input.name, role: input.role, timestamp: new Date().toISOString() };
        const statusMap: Record<string, typeof wf.status> = {
          builder: "pending_qa1",
          qa1: "pending_qa2",
          qa2: "pending_md",
          md: "approved",
        };
        const updateData: Record<string, unknown> = { status: statusMap[input.role] ?? wf.status };
        if (input.role === "builder") updateData.builderSignOff = signOff;
        if (input.role === "qa1") updateData.qa1SignOff = signOff;
        if (input.role === "qa2") updateData.qa2SignOff = signOff;
        if (input.role === "md") { updateData.mdSignOff = signOff; updateData.completedAt = new Date(); }
        await updateWorkflow(input.workflowId, updateData as any);
        await addWorkflowLog({
          workflowId: input.workflowId,
          actorName: input.name,
          actorRole: input.role,
          action: "signed_off",
          details: { role: input.role, newStatus: statusMap[input.role] },
          campaignName: wf.campaignName,
          client: wf.client,
          platform: wf.platform,
          launchType: wf.launchType,
        });
        return { success: true, newStatus: statusMap[input.role] };
      }),

    updateStatus: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        status: workflowStatusSchema,
        actorName: z.string(),
        actorRole: z.enum(["builder", "qa1", "qa2", "md"]),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const wf = await getWorkflowById(input.workflowId);
        if (!wf) throw new Error("Workflow not found");
        await updateWorkflow(input.workflowId, { status: input.status });
        await addWorkflowLog({
          workflowId: input.workflowId,
          actorName: input.actorName,
          actorRole: input.actorRole,
          action: "status_changed",
          details: { fromStatus: wf.status, toStatus: input.status, reason: input.reason },
          campaignName: wf.campaignName,
          client: wf.client,
          platform: wf.platform,
          launchType: wf.launchType,
        });
        return { success: true };
      }),
  }),

  logs: router({
    list: publicProcedure
      .input(z.object({
        workflowId: z.number().optional(),
        client: z.string().optional(),
        platform: z.string().optional(),
        launchType: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await getWorkflowLogs(input ?? {});
      }),
  }),
});

export type AppRouter = typeof appRouter;
