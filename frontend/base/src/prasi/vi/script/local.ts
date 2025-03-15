import { useEffect, useRef, useState, type ReactElement } from "react";
import type { DeepReadonly, IItem } from "src/prasi/logic/types";

export const viLocal = (arg: {
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}) => {
  return <T>({
    value,
    _mode,
    effect,
    children,
  }: {
    value: T;
    _mode?: "render" | "read-write";
    effect?: (local: any) => void;
    children: ReactElement;
  }) => {
    if (_mode !== "read-write") {
      const local = useRef(value).current as unknown as T & {
        render: () => void;
      };
      const render = useState({})[1];
      local.render = () => render({});

      useEffect(() => {
        effect?.(local);
      }, []);

      return children;
    }
  };
};
