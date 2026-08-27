import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const DEFAULT_POOLER_URL =
  "postgresql://postgres.nobgnouifnyhcsnowjoo:PfjjG071T9zFJsE9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

export function getCanonicalDatabaseUrl(): string {
  let url = (process.env.DATABASE_URL || "").trim().replace(/^["']|["']$/g, "");

  // If missing or unconfigured, use resilient production IPv4 pooler
  if (!url || url.includes("postgres.xxx")) {
    return DEFAULT_POOLER_URL;
  }

  // If configured with direct IPv6-only host, transform to Supabase IPv4 Pooler to prevent Vercel connection failures
  if (url.includes("db.nobgnouifnyhcsnowjoo.supabase.co:5432") || url.includes("db.nobgnouifnyhcsnowjoo.supabase.co")) {
    url = url
      .replace("db.nobgnouifnyhcsnowjoo.supabase.co:5432", "aws-0-ap-south-1.pooler.supabase.com:6543")
      .replace("db.nobgnouifnyhcsnowjoo.supabase.co", "aws-0-ap-south-1.pooler.supabase.com:6543")
      .replace("postgresql://postgres:", "postgresql://postgres.nobgnouifnyhcsnowjoo:");

    if (!url.includes("pgbouncer=true")) {
      url += url.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
    }
  }

  return url;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getCanonicalDatabaseUrl(),
      },
    },
    log: ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
