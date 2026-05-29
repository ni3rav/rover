export { relations } from "drizzle-orm";
export * as drizzle from "drizzle-orm";
export * from "drizzle-orm/pg-core";
export * from "drizzle-orm/node-postgres";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

type DrizzleSchema = Record<string, unknown>;

export function createDb<TSchema extends DrizzleSchema>(
  databaseUrl: string,
  schema: TSchema,
) {
  return drizzle(databaseUrl, { schema }) as NodePgDatabase<TSchema>;
}
