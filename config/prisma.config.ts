import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "../prisma/schema.prisma",
  migrations: {
    path: "../prisma/migrations",
    seed: "npx tsx ../prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL (non-pooled, port 5432) is preferred for migrations
    // Falls back to DATABASE_URL (pooled, port 6543) for runtime
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
