import { page, site } from "prasi-db";
import { IItem } from "../../../utils/types/item";

export type SyncUndoItem = { id: number; ts: number; size: string };

export type ESite = Omit<site, "config"> & { config: { api_url: string } };

export type EPageContentTree = {
  childs: IItem[];
  component_ids: string[];
  id: string;
  id_page: string;
  responsive: "mobile" | "desktop";
  type: "root";
};

export type EPage = Omit<page, "content_tree"> & {
  content_tree: EPageContentTree;
};

export type EBaseComp = {
  id: string;
  content_tree: IItem;
  id_component_group: string;
};
export type EComp = EBaseComp & {
  tree: {
    find: (
      fn: (node: { item: IItem; parent?: string }) => boolean
    ) => IItem | null;
  };
};

export type PropFieldKind =
  | "onChange"
  | "visible"
  | "gen"
  | "value"
  | "option"
  | "typings";

export type PNode = {
  item: IItem;
  parent?: {
    id: string;
    component?: {
      is_jsx_root?: boolean;
      comp_id: string;
      instance_id: string;
      prop_name: string;
    };
  };
};
