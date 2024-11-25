import type { Config } from "drizzle-kit";
import { env } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
    // ssl: true,
    // password: env.POSTGRES_PASSWORD,
    // user: env.POSTGRES_USER,
    // host: env.POSTGRES_HOST,
    // database: env.POSTGRES_DATABASE,
    // port: env.POSTGRES_PORT
  },
  verbose: true,
  strict: true
} satisfies Config;
