import type { ReactElement } from "react";
import type { DeepReadonly, IItem } from "base/prasi/logic/types";
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
      const passprop: any = { ...args };
      delete passprop.children;
      (child.props as any).passprop = passprop;
    });
  };
};
