import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Launch Types ─────────────────────────────────────────────────────────────
export type LaunchType =
  | "campaign_launch"
  | "creative_launch"
  | "platform_launch"
  | "budget_change"
  | "flight_extension";

export type Platform =
  | "meta"
  | "google"
  | "dv360"
  | "ttd"
  | "tiktok"
  | "pinterest"
  | "snapchat"
  | "other";

export type ReviewerRole = "builder" | "qa1" | "qa2" | "md";

export type CheckStatus = "pass" | "fail" | "na" | "pending";

export type SignOff = {
  name: string;
  role: ReviewerRole;
  timestamp: string;
};

export type CheckItem = {
  status: CheckStatus;
  note?: string;
  reviewer?: string;
  reviewerRole?: ReviewerRole;
  updatedAt?: string;
};

// checklistData shape: Record<sectionId, Record<itemId, CheckItem>>
export type ChecklistData = Record<string, Record<string, CheckItem>>;

// ─── QA Workflows ─────────────────────────────────────────────────────────────
export const qaWorkflows = mysqlTable("qa_workflows", {
  id: int("id").autoincrement().primaryKey(),
  campaignName: varchar("campaignName", { length: 255 }).notNull(),
  client: varchar("client", { length: 100 }).notNull().default("MSC Cruises"),
  platform: varchar("platform", { length: 50 }).notNull(),
  launchType: varchar("launchType", { length: 50 }).notNull(),
  market: varchar("market", { length: 100 }),
  campaignId: varchar("campaignId", { length: 100 }),
  flightStart: varchar("flightStart", { length: 20 }),
  flightEnd: varchar("flightEnd", { length: 20 }),
  budgetAmount: varchar("budgetAmount", { length: 50 }),
  budgetType: varchar("budgetType", { length: 50 }),
  adSetGroups: text("adSetGroups"),
  notes: text("notes"),
  status: mysqlEnum("status", ["in_progress", "pending_qa1", "pending_qa2", "pending_md", "approved", "rejected"]).default("in_progress").notNull(),
  builderSignOff: json("builderSignOff"),
  qa1SignOff: json("qa1SignOff"),
  qa2SignOff: json("qa2SignOff"),
  mdSignOff: json("mdSignOff"),
  checklistData: json("checklistData"),
  createdByName: varchar("createdByName", { length: 100 }),
  deadline: varchar("deadline", { length: 20 }), // ISO date string YYYY-MM-DD
  archived: mysqlEnum("archived", ["0", "1"]).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type QaWorkflow = typeof qaWorkflows.$inferSelect;
export type InsertQaWorkflow = typeof qaWorkflows.$inferInsert;

// ─── Workflow Activity Log ─────────────────────────────────────────────────────
export const workflowLogs = mysqlTable("workflow_logs", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  actorName: varchar("actorName", { length: 100 }).notNull(),
  actorRole: varchar("actorRole", { length: 20 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  details: json("details"),
  campaignName: varchar("campaignName", { length: 255 }),
  client: varchar("client", { length: 100 }),
  platform: varchar("platform", { length: 50 }),
  launchType: varchar("launchType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkflowLog = typeof workflowLogs.$inferSelect;
export type InsertWorkflowLog = typeof workflowLogs.$inferInsert;