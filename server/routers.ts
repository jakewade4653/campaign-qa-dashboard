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
  upsertTeamEmail,
  getTeamEmailByName,
} from "./db";
import {
  sendSignOffNotification,
  sendFailItemNotification,
  sendNotifyNextReviewerEmail,
} from "./email";
import { getAllTeamEmails as getAllTeamEmailsFn } from "./db";

const REVIEWER_ROLE_ENUM = z.enum(["builder", "qa1", "qa2", "md", "ed"]);

const checkItemSchema = z.object({
  status: z.enum(["pass", "fail", "na", "pending"]),
  note: z.string().optional(),
  reviewer: z.string().optional(),
  reviewerRole: REVIEWER_ROLE_ENUM.optional(),
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
        showArchived: z.boolean().optional(),
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
        deadline: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const newId = await createWorkflow({
          ...input,
          status: "in_progress",
          checklistData: {},
        });
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
        actorRole: REVIEWER_ROLE_ENUM,
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
        // If item is marked FAIL, notify the builder by email
        if (input.item.status === "fail") {
          const builderSignOff = wf.builderSignOff as { name?: string } | null;
          const builderName = builderSignOff?.name ?? wf.createdByName ?? null;
          if (builderName) {
            getTeamEmailByName(builderName).then(builderEmail => {
              if (builderEmail) {
                sendFailItemNotification({
                  toName: builderName,
                  toEmail: builderEmail,
                  reviewerName: input.actorName,
                  reviewerRole: input.actorRole,
                  campaignName: wf.campaignName,
                  itemLabel: input.itemId.replace(/_/g, " "),
                  sectionLabel: input.sectionId.replace(/_/g, " "),
                  note: input.item.note ?? null,
                  workflowUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL ?? ""}/workflow/${input.workflowId}`,
                }).catch(console.error);
              }
            }).catch(console.error);
          }
        }
        return { success: true };
      }),

    signOff: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        role: REVIEWER_ROLE_ENUM,
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
          ed: "approved",
        };
        const updateData: Record<string, unknown> = { status: statusMap[input.role] ?? wf.status };
        if (input.role === "builder") updateData.builderSignOff = signOff;
        if (input.role === "qa1") updateData.qa1SignOff = signOff;
        if (input.role === "qa2") updateData.qa2SignOff = signOff;
        if (input.role === "md") { updateData.mdSignOff = signOff; updateData.completedAt = new Date(); }
        if (input.role === "ed") { updateData.mdSignOff = signOff; updateData.completedAt = new Date(); }
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
        // Notify the next reviewer by email
        const nextRoleMap: Record<string, string> = { builder: "qa1", qa1: "qa2", qa2: "md" };
        const nextRole = nextRoleMap[input.role];
        if (nextRole) {
          getAllTeamEmailsFn().then(allEmails => {
            const nextReviewers = allEmails.filter((e: { role: string }) => e.role === nextRole);
            const workflowUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL ?? ""}/workflow/${input.workflowId}`;
            for (const reviewer of nextReviewers as { name: string; email: string; role: string }[]) {
              sendSignOffNotification({
                toName: reviewer.name,
                toEmail: reviewer.email,
                fromName: input.name,
                fromRole: input.role,
                nextRole,
                campaignName: wf.campaignName,
                launchType: wf.launchType,
                platform: wf.platform,
                client: wf.client,
                deadline: wf.deadline ?? null,
                workflowUrl,
              }).catch(console.error);
            }
          }).catch(console.error);
        }
        return { success: true, newStatus: statusMap[input.role] };
      }),

    notifyNextReviewer: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        toEmail: z.string().email(),
        toName: z.string(),
        actorName: z.string(),
        actorRole: REVIEWER_ROLE_ENUM,
        customNote: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const wf = await getWorkflowById(input.workflowId);
        if (!wf) throw new Error("Workflow not found");
        const workflowUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL ?? ""}/workflow/${input.workflowId}`;
        await sendNotifyNextReviewerEmail({
          toName: input.toName,
          toEmail: input.toEmail,
          fromName: input.actorName,
          fromRole: input.actorRole,
          campaignName: wf.campaignName,
          launchType: wf.launchType,
          platform: wf.platform,
          client: wf.client,
          deadline: wf.deadline ?? null,
          workflowUrl,
          customNote: input.customNote ?? null,
        });
        await addWorkflowLog({
          workflowId: input.workflowId,
          actorName: input.actorName,
          actorRole: input.actorRole,
          action: "notification_sent",
          details: { toEmail: input.toEmail, toName: input.toName, note: input.customNote },
          campaignName: wf.campaignName,
          client: wf.client,
          platform: wf.platform,
          launchType: wf.launchType,
        });
        return { success: true };
      }),

    updateStatus: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        status: workflowStatusSchema,
        actorName: z.string(),
        actorRole: REVIEWER_ROLE_ENUM,
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

    updateDeadline: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        deadline: z.string().nullable(),
        actorName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const wf = await getWorkflowById(input.workflowId);
        if (!wf) throw new Error("Workflow not found");
        await updateWorkflow(input.workflowId, { deadline: input.deadline ?? undefined });
        await addWorkflowLog({
          workflowId: input.workflowId,
          actorName: input.actorName ?? "User",
          actorRole: "builder",
          action: "deadline_updated",
          details: { deadline: input.deadline },
          campaignName: wf.campaignName,
          client: wf.client,
          platform: wf.platform,
          launchType: wf.launchType,
        });
        return { success: true };
      }),

    archive: publicProcedure
      .input(z.object({
        workflowId: z.number(),
        archive: z.boolean(),
        actorName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const wf = await getWorkflowById(input.workflowId);
        if (!wf) throw new Error("Workflow not found");
        await updateWorkflow(input.workflowId, { archived: input.archive ? "1" : "0" });
        await addWorkflowLog({
          workflowId: input.workflowId,
          actorName: input.actorName ?? "User",
          actorRole: "builder",
          action: input.archive ? "workflow_archived" : "workflow_unarchived",
          details: { archived: input.archive },
          campaignName: wf.campaignName,
          client: wf.client,
          platform: wf.platform,
          launchType: wf.launchType,
        });
        return { success: true };
      }),
  }),

  team: router({
    upsertEmail: publicProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().email(),
        role: z.string(),
      }))
      .mutation(async ({ input }) => {
        await upsertTeamEmail(input.name, input.email, input.role);
        return { success: true };
      }),
    getEmails: publicProcedure
      .query(async () => {
        const { getAllTeamEmails } = await import("./db");
        return await getAllTeamEmails();
      }),
    deleteEmail: publicProcedure
      .input(z.object({ name: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { teamEmails } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(teamEmails).where(eq(teamEmails.name, input.name));
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
