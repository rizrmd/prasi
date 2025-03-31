import { type FC } from "react";
import { type Router } from "base/site/router";
import { ref } from "valtio";
import type { DeepReadonly, FNCompDef, IItem } from "../logic/types";
import { ViItem } from "./vi-item";
import { viState, type ItemPaths } from "./vi-state";

export const ViComponent: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
  paths: ItemPaths;
  router: Router;
  passprop?: { idx: any } & Record<string, any>;
}> = ({ item, is_layout, paths, passprop, router }) => {
  const { instances, write } = viState({ is_layout, item, paths });
  const component = router.components[item.component!.id]!;
  const instance_id = passprop ? `${item.id}-${passprop.idx}` : item.id;

  const generateProps = () => {
    const props = {} as any;
    const master_props = component.component?.props;
    const scope: any = {
      ...window.prasi_site.exports,
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

    if (master_props) {
      for (const [k, v] of Object.entries(master_props)) {
        props[k] = parseProp(k, v, item, paths, scope, router);
      }
    }

    return ref(props);
  };

  const instantiate = () => {
    write.instance_id = instance_id;
    const instance_item = structuredClone(component);

    instances[instance_id] = {
      id_component: item.component!.id,
      mappings: ref({
        [component.id]: ref({
          current_id: item.id,
          original_id: component.id,
          childs: instance_item.childs,
        }),
      }),
      props: generateProps(),
      item: instance_item,
    };

    const instance = instances[instance_id]!;
    instance.item.id = item.id;
    delete instance.item.component;
  };

  if (!write.instance_id && component) {
    instantiate();
  }

  let instance = instances[instance_id];
  if (!instance) {
    if (write.instance_id) {
      instantiate();
      instance = instances[instance_id];

      if (!instance) {
        console.error("instance not found");
        return <>instance not found</>;
      }
    } else {
      console.log("this should not happen");
      return <>This should not happen</>;
    }
  }

  return (
    <ViItem
      item={instance.item}
      is_layout={is_layout}
      paths={paths}
      router={router}
      passprop={passprop}
    />
  );
};

const parseProp = (
  k: string,
  master_prop: FNCompDef,
  item: DeepReadonly<IItem>,
  paths: ItemPaths,
  scope: any,
  router: Router
) => {
  const prop = item.component!.props[k]!;
  if (master_prop.meta?.type === "content-element") {
    const content = prop.content;
    if (content) {
      return {
        __jsx: true,
        __Component: ({
          is_layout,
          passprop,
        }: {
          is_layout: boolean;
          passprop: any;
        }) => {
          return (
            <ViItem
              is_layout={is_layout}
              item={content}
              router={router}
              paths={[...paths, { id: item.id }]}
              passprop={passprop}
            />
          );
        },
      };
    }
    return null;
  } else {
    let js = prop.valueBuilt || "";
    if (js.startsWith(`const _jsxFileName = "";`)) {
      js = `(() => { ${js.replace(
        `const _jsxFileName = "";`,
        `const _jsxFileName = ""; return `
      )} })()`;
    }

    const src = replaceWithObject(js, replacement) || "";
    const arg = scope;
    let fn_src = `// [${item.name}] ${k}: ${item.id}
return ${src}
`;
    if (src.startsWith(`//prasi-prop`)) {
      fn_src = `// [${item.name}] ${k}: ${item.id}
${src.substring(`//prasi-prop`.length + 1)}`;
    }
    try {
      const fn = new Function(
        ...Object.keys(arg),
        `\
try { 
${fn_src.split("\n").join(`\n    `)}
} catch(e) {
console.error(e);
}`
      );

      return fn(...Object.values(arg));
    } catch (e) {
      console.error(e);
      return null;
    }
  }
};

export const replacement = {
  "stroke-width": "strokeWidth",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-linecap": "strokeLinecap",
  "clip-path": "clipPath",
  "stroke-miterlimit": "strokeMiterlimit",
};

export const replaceWithObject = (tpl: string, data: any) => {
  let res = tpl;
  for (const [k, v] of Object.entries(data)) {
    res = res.replaceAll(k, v as string);
  }
  return res;
};
