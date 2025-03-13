import { PrismaClient } from "db/use";
import { dir } from "utils/dir";
import { enhancePrisma } from "utils/prisma";
import { g } from "./global";

export const initServer = async () => {
  dir.ensure("data:sqlite");

  if (!g.db) {
    g.db = enhancePrisma(new PrismaClient());
    try {
      await g.db.$connect();
    } catch (e) {
      console.error(e);
    }
  }
};
