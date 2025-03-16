import { type FC, type ReactNode } from "react";
import { ref } from "valtio";
import type { DeepReadonly, IItem } from "../logic/types";
import { ViItem } from "./vi-item";
import { viProps } from "./vi-props";
import { viRead, viState, writeScope, type ItemPaths } from "./vi-state";
import { viLocal } from "./script/vi-local";
import { viPassProp } from "./script/vi-passprop";
import type { ITEM_ID } from "./script/typings";

export const ViScript: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
  paths: ItemPaths;
}> = ({ item, is_layout, paths }) => {
  const vi = viRead();
  const { write, all, instances } = viState({ is_layout, item, paths });
  const jsBuilt = item.adv?.jsBuilt!;

  const instance = write.instance_id ? instances[write.instance_id] : null;
  const component_props = {};
  if (instance) {
    Object.assign(component_props, instance.props);
  }

  const scope: any = {};
  for (const path of paths) {
    if (path.passprop_idx) {
      const passprop = writeScope.passprop[path.id];
      if (passprop) {
        Object.assign(scope, passprop.get(path.passprop_idx));
      }
    }
    if (path.local) {
      const local = writeScope.local[path.id];
      if (local) {
        scope[local.name] = local.value;
      }
    }
  }

  const args = {
    props: viProps(item, { mode: vi.mode }),
    children: Array.isArray(item.childs)
      ? item.childs.map((e, key) => {
          return (
            <ViItem
              item={e}
              key={key}
              is_layout={is_layout}
              paths={[...paths, { id: item.id }]}
            />
          );
        })
      : null,
    Local: write.Local,
    PassProp: write.PassProp,
  };
  if (!write.jsBuilt) {
    try {
      write.jsBuilt = ref(
        new Function(
          "render",
          ...Object.keys(args),
          ...Object.keys(window.prasi_site.exports),
          ...Object.keys(component_props),
          ...Object.keys(scope),
          `\
try { ${jsBuilt} } catch(e) {
console.error("ERROR [${item.name}]\\n ${printPaths(
            [...paths, { id: item.id }],
            all
          )}:\\n\\n", e)
}`
        )
      ) as any;
    } catch (e) {
      console.error(
        `ERROR [${item.name}]\n ${printPaths(
          [...paths, { id: item.id }],
          all
        )}:\n\n`,
        e
      );

      return null;
    }
    write.Local = viLocal({ item, is_layout });
    write.PassProp = viPassProp({ item, is_layout });
    args.Local = write.Local;
    args.PassProp = write.PassProp;
  }

  let result = { el: null as ReactNode | null };
  write.jsBuilt!(
    (el) => {
      result.el = el;
    },
    ...Object.values(args),
    ...Object.values(window.prasi_site.exports),
    ...Object.values(component_props),
    ...Object.values(scope)
  );

  return result.el;
};

export const printPaths = (paths: ItemPaths, all: any) => {
  return paths
    .map((i) => {
      const item = all[i.id];
      if (item) {
        return `${item.component?.id ? "⏍ " : ""}${item.name}`;
      }
      return i.id;
    })
    .join(" › ");
};
