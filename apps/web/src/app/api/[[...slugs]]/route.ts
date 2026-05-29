import { Elysia } from "elysia";
import { authRoutes } from "@/routes/auth";
import { tryCatch } from "@rover/utils";
import { db } from "@/database";

// TODO: do connection checks later
export const app = new Elysia({ prefix: "/api" }).get("/health", async () => {
  const start = Date.now();

  async function dbCheck() {
    db.execute("SELECT 1");
    return true;
  }

  const { data, error } = await tryCatch(dbCheck());
  if (error) {
    return {
      status: "error",
      uptime: process.uptime(),
      responseTime: `${Date.now() - start}ms`,
      error: "Database connection failed",
    };
  }
  return {
    status: data && "ok",
    uptime: process.uptime(),
    responseTime: `${Date.now() - start}ms`,
  };
});

app.use(authRoutes);

export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const DELETE = app.fetch;
export const PATCH = app.fetch;
