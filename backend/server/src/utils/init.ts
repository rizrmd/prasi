import { db } from "db/use";
import { g } from "./global";

export const initServer = async () => {
  if (!g.server) {
    await db.$connect();
  }
};
