import { eq, desc, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  qaWorkflows,
  workflowLogs,
  InsertQaWorkflow,
  InsertWorkflowLog,
  QaWorkflow,
  teamEmails,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── QA Workflows ─────────────────────────────────────────────────────────────
export async function createWorkflow(data: InsertQaWorkflow): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // drizzle mysql2 returns an array-like object: result[0] is the ResultSetHeader
  const result = await db.insert(qaWorkflows).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function getWorkflows(filters?: {
  client?: string;
  platform?: string;
  launchType?: string;
  status?: string;
  showArchived?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  // By default exclude archived; only include them when explicitly requested
  if (!filters?.showArchived) conditions.push(eq(qaWorkflows.archived, "0"));
  if (filters?.client) conditions.push(like(qaWorkflows.client, `%${filters.client}%`));
  if (filters?.platform) conditions.push(eq(qaWorkflows.platform, filters.platform));
  if (filters?.launchType) conditions.push(eq(qaWorkflows.launchType, filters.launchType));
  if (filters?.status) conditions.push(eq(qaWorkflows.status, filters.status as QaWorkflow["status"]));

  return conditions.length > 0
    ? await db.select().from(qaWorkflows).where(and(...conditions)).orderBy(desc(qaWorkflows.createdAt))
    : await db.select().from(qaWorkflows).orderBy(desc(qaWorkflows.createdAt));
}

export async function getWorkflowById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(qaWorkflows).where(eq(qaWorkflows.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateWorkflow(id: number, data: Partial<InsertQaWorkflow>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(qaWorkflows).set(data).where(eq(qaWorkflows.id, id));
}

// ─── Archive / Deadline ──────────────────────────────────────────────────────
export async function archiveWorkflow(id: number, archived: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(qaWorkflows).set({ archived: archived ? "1" : "0" }).where(eq(qaWorkflows.id, id));
}

export async function updateWorkflowDeadline(id: number, deadline: Date | string | null): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const deadlineStr = deadline instanceof Date ? deadline.toISOString().slice(0, 10) : deadline;
  await db.update(qaWorkflows).set({ deadline: deadlineStr }).where(eq(qaWorkflows.id, id));
}

/**
 * Returns active (non-archived, non-approved) workflows whose deadline falls
 * within the next windowHours hours.
 */
export async function getWorkflowsDueForReminder(windowHours = 24): Promise<(typeof qaWorkflows.$inferSelect)[]> {
  const db = await getDb();
  if (!db) return [];
  // deadline is stored as YYYY-MM-DD string; compare lexicographically
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const windowEndStr = windowEnd.toISOString().slice(0, 10);
  const { lte, gte, ne, isNotNull } = await import("drizzle-orm");
  const allActive = await db.select().from(qaWorkflows).where(
    and(
      isNotNull(qaWorkflows.deadline),
      ne(qaWorkflows.status, "approved"),
      ne(qaWorkflows.archived, "1"),
    )
  );
  // Filter in JS since deadline is a varchar string
  return allActive.filter(w => {
    if (!w.deadline) return false;
    return w.deadline >= todayStr && w.deadline <= windowEndStr;
  });
}

// ─── Workflow Logs ─────────────────────────────────────────────────────────────
export async function addWorkflowLog(data: InsertWorkflowLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(workflowLogs).values(data);
}

export async function getWorkflowLogs(filters?: {
  workflowId?: number;
  client?: string;
  platform?: string;
  launchType?: string;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.workflowId) conditions.push(eq(workflowLogs.workflowId, filters.workflowId));
  if (filters?.client) conditions.push(like(workflowLogs.client, `%${filters.client}%`));
  if (filters?.platform) conditions.push(eq(workflowLogs.platform, filters.platform));
  if (filters?.launchType) conditions.push(eq(workflowLogs.launchType, filters.launchType));

  const query = db.select().from(workflowLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(workflowLogs.createdAt))
    .limit(filters?.limit ?? 200);

  return await query;
}

// ─── Team Emails ───────────────────────────────────────────────────────────────
export async function upsertTeamEmail(name: string, email: string, role: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(teamEmails).values({ name, email, role })
    .onDuplicateKeyUpdate({ set: { email, role } });
}

export async function getTeamEmailByName(name: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(teamEmails).where(eq(teamEmails.name, name)).limit(1);
  return result.length > 0 ? result[0]!.email : null;
}

export async function getAllTeamEmails(): Promise<{ name: string; email: string; role: string }[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select({ name: teamEmails.name, email: teamEmails.email, role: teamEmails.role }).from(teamEmails);
}
