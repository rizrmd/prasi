import { proxy, useSnapshot } from "valtio";

export const viWrite = proxy({
  mode: "desktop" as "desktop" | "mobile",
});
export const viRead = (opt?: Parameters<typeof useSnapshot>[1]) => {
  return useSnapshot(viWrite, opt);
};
