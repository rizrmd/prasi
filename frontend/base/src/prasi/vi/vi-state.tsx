import type { ReactElement } from "react";
import { proxy, ref, useSnapshot } from "valtio";
import type { DeepReadonly, FNComponent, IItem } from "../logic/types";
import type { viLocal } from "./script/vi-local";
import type { viPassProp } from "./script/vi-passprop";
import type { ITEM_ID } from "./script/typings";
import { createId } from "@orama/cuid2";

export type ItemPath = {
  id: ITEM_ID;
  passprop_idx?: any;
  local?: true;
};
export type ItemPaths = ItemPath[];
type ItemState = {
  name: string;
  instance_id?: ITEM_ID;
  component?: DeepReadonly<FNComponent>;
  jsBuilt?: (render: (el: ReactElement) => void, ...args: any[]) => void;
  Local?: ReturnType<typeof viLocal>;
  PassProp?: ReturnType<typeof viPassProp>;
};

type ComponentInstance = {
  id_component: string;
  mappings: Record<
    ITEM_ID,
    {
      current_id: ITEM_ID;
      original_id: ITEM_ID;
      childs: IItem[];
    }
  >;
  props: Record<string, any>;
  item: IItem;
};

export const write = proxy({
  mode: "desktop" as "desktop" | "mobile",
  state: {
    layout: {} as Record<ITEM_ID, ItemState>,
    page: {} as Record<ITEM_ID, ItemState>,
  },
  instances: {
    layout: {} as Record<ITEM_ID, ComponentInstance>,
    page: {} as Record<ITEM_ID, ComponentInstance>,
  },
  scope: ref({
    local: {} as Record<string, { name: string; value: any }>,
  }),
});

export const writeScope = write.scope;
export const viRead = (opt?: Parameters<typeof useSnapshot>[1]) => {
  return useSnapshot(write, opt);
};

export const viState = (opt: {
  is_layout: boolean;
  item: DeepReadonly<IItem>;
  paths: ItemPaths;
  read?: boolean;
}) => {
  const paths = opt.paths;
  const read = opt?.read ? viRead() : null;

  const mode = opt.is_layout ? "layout" : "page";
  let id = opt.item.id;
  if (write.state[mode][opt.item.id] === undefined) {
    const lastPath = paths[paths.length - 1];

    let instance_id = undefined;
    if (lastPath) {
      const lastItem = write.state[mode][lastPath.id];
      if (lastItem?.instance_id) {
        instance_id = lastItem.instance_id;
        const instance = write.instances[mode][instance_id];
        if (instance) {
          const current = instance.mappings[opt.item.id];
          if (!current) {
            const lastInstance = Object.values(instance.mappings).find(
              (e) => e.current_id === lastPath.id
            );
            if (lastInstance) {
              const current = lastInstance.childs.find(
                (e) => e.id === opt.item.id
              );
              if (current) {
                const new_id = createId();
                instance.mappings[opt.item.id] = {
                  current_id: new_id,
                  original_id: opt.item.id,
                  childs: current.childs ? ref(current.childs) : [],
                };
                current.id = new_id;
                id = new_id;
              }
            }
          }
        }
      }
    }

    write.state[mode][id] = {
      name: opt.item.name,
      component: opt.item.component,
      instance_id,
    };
  }

  return {
    read: read?.state[mode][id],
    write: write.state[mode][id]!,
    all: write.state[mode],
    instances: write.instances[mode],
  };
};
