import { component } from "prasi-db";
import { IItem } from "../../utils/types/item";

export const PageRenderGlobal = {
  usage: "editor" as "editor" | "render" | "preview",
  scope: {},
  passPropEntry: {} as {
    [ENTRY_ID in string]: {
      [ELEMENT_ID in string]: any;
    };
  },
  comps: {} as Record<
    string,
    Omit<component, "content_tree"> & { content_tree: IItem }
  >,
  failedComp: new Set<string>(),
  page_id: "",
  site: null as any,
  passPropTree: {} as { [ELEMENT_ID in string]: string },
};
