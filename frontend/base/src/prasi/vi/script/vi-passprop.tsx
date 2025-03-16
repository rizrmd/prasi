import type { ReactElement } from "react";
import type { DeepReadonly, IItem } from "src/prasi/logic/types";
import { modifyChildren } from "./modify-children";
import { ViItem } from "../vi-item";
import { write } from "../vi-state";

export const viPassProp = ({
  item,
}: {
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}) => {
  return (args: { children: ReactElement }) => {
    const children = args.children;
    let passprop = write.scope.passprop[item.id];
    if (!passprop) {
      write.scope.passprop[item.id] = new Map();
      passprop = write.scope.passprop[item.id];
    }

    return modifyChildren(children, item, (child) => {
      const props: any = { ...args };
      const passprop_idx = props.idx || child.key;

      if (passprop) {
        delete props.children;
        passprop.set(passprop_idx, props);
      }

      return { passprop_idx };
    });
  };
};
