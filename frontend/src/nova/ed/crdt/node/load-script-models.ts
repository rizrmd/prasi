import { monacoCreateModel } from "popup/script/code/js/create-model";
import { migrateCode } from "popup/script/code/js/migrate-code";
import { parseItemCode } from "popup/script/code/js/parse-item-code";
import { waitUntil } from "prasi-utils";
import { rapidhash_fast as hash } from "./rapidhash";
import { jscript } from "utils/script/jscript";
import { IItem } from "utils/types/item";
import { loopItem } from "./loop-item";
import { SingleExportVar } from "popup/script/code/js/parse-item-types";
import { TreeVarItems } from "./var-items";

const source_sym = Symbol("source");

export type ScriptModel = {
  source: string;
  source_hash: string;
  name: string;
  id: string;
  path_names: string[];
  prop_name?: string;
  path_ids: string[];
  title: string;
  local: { name: string; value: string };
  extracted_content: string;
  model?: ReturnType<typeof monacoCreateModel> & { _ignoreChanges?: any };
  [source_sym]: string;
  ready: boolean;
  exports: Record<string, SingleExportVar>;
};

export const loadScriptModels = async (
  items: IItem[],
  result: Record<string, ScriptModel>,
  var_items: TreeVarItems,
  opt?: {
    exclude_comp_ids?: string[];
  }
) => {
  if (!jscript.loaded) {
    await waitUntil(() => jscript.loaded);
  }

  const exclude_comp_ids = opt?.exclude_comp_ids || [];
  loopItem(
    items,
    { exclude_comp_ids },
    async ({ item, path_name, path_id, parent }) => {
      if (item.component?.id && !exclude_comp_ids.includes(item.component.id)) {
        for (const [name, prop] of Object.entries(item.component.props)) {
          if (!(prop.content && prop.meta?.type === "content-element")) {
            const file = `${item.id}~${name}`;
            const source_hash = hash(prop.value).toString();

            if (result[file]?.source_hash !== source_hash) {
              result[file] = {
                id: item.id,
                get source() {
                  return this[source_sym];
                },
                set source(value: string) {
                  this[source_sym] = value;
                  this.source_hash = hash(prop.value).toString();
                  this.ready = false;
                },
                [source_sym]: prop.value,
                title: `${item.name}.${name}`,
                path_names: path_name,
                prop_name: name,
                path_ids: path_id,
                name: `file:///${file}.tsx`,
                local: { name: "", value: "" },
                extracted_content: "",
                source_hash,
                ready: false,
                exports: {},
              };
            }
            result[file].exports = {};
            result[file].title = `${item.name}.${name}`;
          }
        }
      } else {
        if (item.vars) {
          const vars = Object.entries(item.vars);
          if (vars.length > 0) {
            for (const [k, v] of vars) {
              var_items[k] = {
                item_id: item.id,
                get item() {
                  return item;
                },
                get var() {
                  return v;
                },
              };
            }
          }
        }

        const value = item.adv?.js || "";
        const source_hash = hash(value).toString();
        if (result[item.id]?.source_hash !== source_hash) {
          result[item.id] = {
            id: item.id,
            [source_sym]: value,
            get source() {
              return this[source_sym];
            },
            set source(value: string) {
              this[source_sym] = value;
              this.source_hash = hash(value).toString();
              this.ready = false;
            },
            name: `file:///${item.id}.tsx`,
            path_names: path_name,
            path_ids: path_id,
            title: item.name,
            local: { name: "", value: "" },
            extracted_content: "",
            source_hash,
            ready: false,
            exports: {},
          };
        }
        result[item.id].exports = {};
        result[item.id].title = item.name;
      }
    }
  );

  for (const [k, v] of Object.entries(result)) {
    if (v.source && !v.ready) {
      parseItemCode(v);
    }
  }

  for (const [k, v] of Object.entries(result)) {
    if (v.source && !v.ready) {
      v.source = await jscript.prettier.format?.(migrateCode(v, result));
      v.ready = true;
    }
  }

  return result;
};
