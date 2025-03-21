import type { Server } from "bun";
import type { PrismaEnhanced } from "utils/prisma";

export const g = global as unknown as {
  dev: {};
  db: PrismaEnhanced;
  server: Server;
  shutting_down: boolean;
  exit_hook: boolean;
  is_restarted: boolean;
};
