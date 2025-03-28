import type { Model } from "utils/db-proxy";

export const model = {
  cache: new Proxy({}, { get(target, p, receiver) {
    console.log(p)
  } }),
} as Model;
