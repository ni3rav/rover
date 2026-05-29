import { parseEnv, z } from "@rover/utils";

const ServerEnvSchema = z.object({
  API_URL: z.url(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.url(),
  GITHUB_CLIENTID: z.string(),
  PORT: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
});

export const env = parseEnv(ServerEnvSchema, process.env);
