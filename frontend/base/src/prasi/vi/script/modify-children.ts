import type { ReactElement } from "react";
import type { DeepReadonly, IItem } from "src/prasi/logic/types";
import type { ItemPath, ItemPaths } from "../vi-state";

export const modifyChildren = (
  children: ReactElement | ReactElement[],
  item: DeepReadonly<IItem>,
  path: Omit<ItemPath, "id"> | ((child: ReactElement) => Omit<ItemPath, "id">)
) => {
  const modifyChild = (child: ReactElement) => {
    const paths = (child.props as any)?.paths as ItemPaths;
    if (Array.isArray(paths)) {
      const last = paths[paths.length - 1];
      if (last && last.id === item.id) {
        let results = path;
        if (typeof path === "function") {
          results = path(child);
        }
        for (const [k, v] of Object.entries(results)) {
          (last as any)[k] = v;
        }
      }
    }
    return child;
  };

  if (Array.isArray(children)) {
    return children.map((child) => {
      return modifyChild(child);
    });
  }
  return modifyChild(children);
};
