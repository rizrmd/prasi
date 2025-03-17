import { useEffect, useRef, useState, type ReactElement } from "react";
import type { DeepReadonly, IItem } from "src/prasi/logic/types";
import { modifyChildren } from "./modify-children";
import type { ItemWriteState } from "../vi-state";
import { useSnapshot } from "valtio";

export const viLocal = ({
  item,
  write,
}: {
  item: DeepReadonly<IItem>;
  write: ItemWriteState;
}) => {
  return <T,>({
    value,
    _mode,
    name,
    effect,
    children,
  }: {
    value: T;
    name: string;
    _mode?: "render" | "read-write";
    effect?: (local: any) => void;
    children: ReactElement | ReactElement[];
  }) => {
    if (_mode !== "read-write") {
      if (!window.viWrite.scope.local[item.id]) {
        window.viWrite.scope.local[item.id] = { name, value };
      }
      const local = window.viWrite.scope.local[item.id]!.value;
      local.render = () => {
        setTimeout(() => {
          write.render?.({});
        });
      };

      useEffect(() => {
        effect?.(local);
      }, []);

      return modifyChildren(children, item, { local: true });
    }
  };
};
