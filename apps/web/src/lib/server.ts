import { treaty } from "@elysia/eden";
import { app } from "@/app/api/[[...slugs]]/route";
import { env } from "@/lib/env";

type Api = ReturnType<typeof treaty<typeof app>>["api"];

export const api: Api =
  // process is defined on server side and build time
  typeof process !== "undefined"
    ? treaty(app).api
    : treaty<typeof app>(env.API_URL).api;
