import { PrismaClient } from "@prisma/client";
import { g } from "server/utils/global";
import { enhancePrisma } from "utils/prisma";

export * from "@prisma/client";

if (!g.db) {
  g.db = enhancePrisma(new PrismaClient());
}

export const db = g.db;
