import { useEffect, useRef, useState, type ReactElement } from "react";
import type { DeepReadonly, IItem } from "src/prasi/logic/types";
import { modifyChildren } from "./modify-children";
import { writeScope } from "../vi-state";

export const viLocal = ({
  item,
  is_layout,
}: {
  item: DeepReadonly<IItem>;
  is_layout: boolean;
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
      const local = useRef(value).current as unknown as T & {
        render: () => void;
      };
      const render = useState({})[1];
      local.render = () => {
        render({});
      };
      writeScope.local[item.id] = { name, value: local };
      useEffect(() => {
        effect?.(local);
      }, []);

      return modifyChildren(children, item, { local: true });
    }
  };
};
