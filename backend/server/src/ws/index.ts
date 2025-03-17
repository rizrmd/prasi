import { wsSiteLoading } from "./site-loading";
import { wsCrdt } from "./ws-crdt";

export const wsRouter = {
  "site-loading": wsSiteLoading,
  crdt: wsCrdt,
};
