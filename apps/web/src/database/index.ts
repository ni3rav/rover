import { createDb } from "@rover/db";
import { env } from "@/lib/env";
import * as schema from "@/database/schema/index";

export const db = createDb(env.DATABASE_URL, schema);
