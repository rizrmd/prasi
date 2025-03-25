import { wsSiteLoading } from "./ws-site-loading";
import { wsCrdt } from "./ws-crdt";
import { wsSiteLogger } from "./ws-site-logger";

export const wsRouter = {
  "site-loading": wsSiteLoading,
  "site-logger": wsSiteLogger,
  crdt: wsCrdt,
};
