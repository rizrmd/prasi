import {
  isValidElement,
  useState,
  type FC,
  type ReactElement,
  type ReactNode,
} from "react";
import { ref } from "valtio";
import type { DeepReadonly, IItem } from "../logic/types";
import { viLocal } from "./script/vi-local";
import { viPassProp } from "./script/vi-passprop";
import { ViItem } from "./vi-item";
import { viProps } from "./vi-props";
import { viRead, viState, type ItemPaths } from "./vi-state";
import type { Router } from "base/site/router";

export const ViScript: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
  router: Router;
  paths: ItemPaths;
  passprop?: { idx: any } & Record<string, any>;
  error?: (e: Error) => void;
}> = ({ item, is_layout, paths, passprop, router, error }) => {
  const vi = viRead();
  const render = useState({})[1];
  const { write, all, instances } = viState({ is_layout, item, paths });
  const jsBuilt = item.adv?.jsBuilt!;
  write.render = render;

  const instance = write.instance_id ? instances[write.instance_id] : null;
  const component_props: any = {};
  if (instance) {
    Object.assign(component_props, instance.props);
    for (const [k, v] of Object.entries(component_props)) {
      if (v && (v as any).__jsx) {
        const Component = (v as any).__Component;
        component_props[k] = <Component is_layout={is_layout} />;
      }
    }
  }

  const scope: any = {
    ...passprop,
  };

  for (const path of paths) {
    if (path.local) {
      const local = window.viWrite.scope.local[path.id];
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
              router={router}
              key={key}
              is_layout={is_layout}
              passprop={passprop}
              error={error}
              paths={[...paths, { id: item.id }]}
            />
          );
        })
      : null,
    Local: write.Local,
    PassProp: write.PassProp,
    _item: item,
    __props: passprop,
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
  try { 
    ${jsBuilt.split("\n").join("\n    ")}
  } catch(e) {
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
    write.Local = viLocal({ item, write });
    write.PassProp = viPassProp({ item, is_layout });
    args.Local = write.Local;
    args.PassProp = write.PassProp;
  }

  let result = { el: null as ReactNode | null };
  write.jsBuilt!(
    (el) => {
      traverse(el as any, ({ el, parent }) => {
        if (el.type === args.PassProp) {
          if (!el.key) {
            el.key = parent.key;
          }
          const props = el.props as any;
          if (props.idx) {
            el.key = props.idx;
          } else if (el.key) {
            props.idx = el.key;
          }
        }
      });
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

const traverse = (
  el: ReactElement & { props: { children?: ReactNode | ReactNode[] } },
  visitor: (arg: {
    el: ReactElement;
    parent: ReactElement<{ children: ReactNode | ReactNode[] }>;
  }) => void
) => {
  function visit(
    element: ReactElement & { props: { children?: ReactNode | ReactNode[] } },
    parent: ReactElement | null
  ) {
    if (!isValidElement(element)) return;

    if (parent) {
      visitor({ el: element, parent: parent as any });
    }

    const children = element.props.children;
    if (children) {
      if (Array.isArray(children)) {
        children.forEach((child) => {
          if (isValidElement(child)) {
            visit(
              child as ReactElement & {
                props: { children?: ReactNode | ReactNode[] };
              },
              element
            );
          }
        });
      } else if (isValidElement(children)) {
        visit(
          children as ReactElement & {
            props: { children?: ReactNode | ReactNode[] };
          },
          element
        );
      }
    }
  }

  visit(el, null);
};
