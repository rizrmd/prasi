import type { FC } from "react";
import { router } from "src/site/router";
import { ref } from "valtio";
import type { DeepReadonly, FNCompDef, IItem } from "../logic/types";
import { ViItem } from "./vi-item";
import { viState, writeScope, type ItemPaths } from "./vi-state";

export const ViComponent: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
  paths: ItemPaths;
}> = ({ item, is_layout, paths }) => {
  const { instances, write } = viState({ is_layout, item, paths });
  const component = router.components[item.component!.id]!;

  const instantiate = () => {
    write.instance_id = item.id;
    const instance_item = structuredClone(component);

    const props = {} as any;
    const master_props = component.component?.props;
    const scope: any = {
      ...window.prasi_site.exports,
    };
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

    if (master_props) {
      for (const [k, v] of Object.entries(master_props)) {
        props[k] = parseProp(k, v, item, scope);
      }
    }

    instances[item.id] = {
      id_component: item.component!.id,
      mappings: ref({
        [component.id]: ref({
          current_id: item.id,
          original_id: component.id,
          childs: instance_item.childs,
        }),
      }),
      props,
      item: instance_item,
    };
    instances[item.id]!.item.id = item.id;
    delete instances[item.id]!.item.component;
  };

  if (!write.instance_id && component) {
    instantiate();
  }

  let instance = instances[item.id];
  if (!instance) {
    if (write.instance_id) {
      instantiate();
      instance = instances[item.id];

      if (!instance) {
        console.error("instance not found");
        return <>instance not found</>;
      }
    } else {
      console.log("this should not happen");
      return <>This should not happen</>;
    }
  }

  return <ViItem item={instance.item} is_layout={is_layout} paths={paths} />;
};

const parseProp = (
  k: string,
  master_prop: FNCompDef,
  item: DeepReadonly<IItem>,
  scope: any
) => {
  if (master_prop.meta?.type === "content-element") {
    return <>moka</>;
  } else {
    let js = item.component!.props[k]!.valueBuilt || "";
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
