/**
 * Vercel Serverless API Handler
 * Wraps the Express app for Vercel deployment.
 * All /api/* requests are routed here via vercel.json rewrites.
 */
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { upsertTeamEmail } from "../server/db";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Storage proxy for Manus storage (no-op if not configured)
registerStorageProxy(app);

// OAuth routes (no-op if Manus OAuth not configured)
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Seed core team roster on cold start (best-effort)
let seeded = false;
async function seedTeamRoster() {
  if (seeded) return;
  seeded = true;
  try {
    await upsertTeamEmail("Jake Wade", "jake.wade@omc.com", "md");
    await upsertTeamEmail("Rob Pearsall", "robert.pearsall@omc.com", "ed");
    await upsertTeamEmail("Jenna Radomsky", "jenna.radomsky@omc.com", "qa2");
  } catch {
    // Non-fatal — team can be managed via Team Settings
  }
}

seedTeamRoster().catch(() => {});

export default app;
