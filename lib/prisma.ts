import { PrismaClient } from "@/lib/generated/prisma/client";

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
