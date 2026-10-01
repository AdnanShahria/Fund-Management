import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";

export function createDb(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
