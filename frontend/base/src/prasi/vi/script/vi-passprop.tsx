import type { ReactElement } from "react";
import type { DeepReadonly, IItem } from "src/prasi/logic/types";
import { write, type ItemPaths } from "../vi-state";
import { modifyChildren } from "./modify-children";

export const viPassProp = ({
  item,
}: {
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}) => {
  return (args: { children: ReactElement; idx: any }) => {
    const children = args.children;

    return modifyChildren(children, item, (child) => {
      const child_props = child.props as any;
      const passprop: any = { ...args };
      delete passprop.children;
      child_props.passprop = passprop;
    });
  };
};
