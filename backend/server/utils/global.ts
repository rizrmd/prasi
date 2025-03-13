import type { PrismaEnhanced } from "utils/prisma";

export const g = global as unknown as {
  dev: {};
  db: PrismaEnhanced;
};
