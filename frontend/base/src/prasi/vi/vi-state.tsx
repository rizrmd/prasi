import type { ReactElement } from "react";
import { proxy, useSnapshot } from "valtio";

type ItemState = {
  jsBuilt?: (render: (el: ReactElement) => void, ...args: any[]) => void;
};

export const write = proxy({
  mode: "desktop" as "desktop" | "mobile",
  state: {
    layout: {} as Record<string, ItemState>,
    page: {} as Record<string, ItemState>,
  },
});
export const viRead = (opt?: Parameters<typeof useSnapshot>[1]) => {
  return useSnapshot(write, opt);
};

export const viState = (opt: {
  mode: keyof (typeof write)["state"];
  id: string;
  read?: boolean;
}) => {
  const read = opt?.read ? viRead() : null;

  if (write.state[opt.mode][opt.id] === undefined) {
    write.state[opt.mode][opt.id] = {};
  }

  return {
    read: read?.state[opt.mode][opt.id],
    write: write.state[opt.mode][opt.id]!,
  };
};
