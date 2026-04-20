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
export async function createWorkflow(data: InsertQaWorkflow) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(qaWorkflows).values(data);
}

export async function getWorkflows(filters?: {
  client?: string;
  platform?: string;
  launchType?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
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
