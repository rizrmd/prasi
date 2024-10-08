import { active } from "../../logic/active";
import { PG } from "../../logic/ed-global";
import { EBaseComp, EPage, PNode } from "../../logic/types";
import { flattenTree } from "./flatten-tree";

export const getNodeById = (p: PG, id: string) => {
  if (active.comp?.id) {
    if (active.comp.nodes.map) {
      const meta = active.comp.nodes.map[id];
      if (meta) {
        return meta;
      } else if (active.comp.nodes.map) {
        for (const v of Object.values(active.comp.nodes.map)) {
          if (v.item.id === id) return v;
        }
      }
    }
  } else {
    return p.page.tree?.nodes.map[id];
  }
};

export const getActiveNode = (p: PG) => {
  return getNodeById(p, active.item_id);
};

export const getActiveTree = (p: PG) => {
  if (active.comp) return active.comp;
  return p.page.tree;
};

export const updateNodeById = (
  p: PG,
  id: string,
  action_name: string,
  updateFn: (arg: {
    node: PNode;
    nodes: ReturnType<typeof flattenTree>;
    page_tree?: EPage["content_tree"];
    comp_tree?: EBaseComp["content_tree"];
  }) => void
) => {
  if (active.comp?.id) {
    active.comp.update(action_name, (val) => {
      const node = val.findNode(id);

      if (node) {
        const nodes = val.flatten();
        updateFn({ nodes, node, comp_tree: val.tree });
      }
    });
  } else {
    p.page.tree.update(action_name, (val) => {
      const node = val.findNode(id);

      if (node) {
        const nodes = val.flatten();
        updateFn({ nodes, node, page_tree: val.tree });
      }
    });
  }
};
