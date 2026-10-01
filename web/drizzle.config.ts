import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
} satisfies Config;
