import { codeExec } from "../lib/code-exec";
import { defineNode } from "../lib/define-node";
import { PFNodeBranch } from "../types";

type Condition = { condition: string; name: string };

export const nodeBranch = defineNode({
  type: "branch",
  on_before_connect: ({ node, is_new }) => {
    if (!node.conditions) node.conditions = [];
    if (!node.branches) node.branches = [];

    const branches = node.branches as PFNodeBranch[];
    const conditions = node.conditions as Condition[];

    if (conditions.length === branches.length) {
      let empty_branch_len = branches.filter(
        (e) => !e.flow || (e.flow && e.flow.length === 0)
      ).length;

      if (empty_branch_len === 0 || conditions.length === 0) {
        const name = "Condition " + (conditions.length + 1);
        conditions.push({ condition: "", name });
        branches.push({ flow: [], idx: conditions.length - 1, name });
      }
    }
  },
  on_init({ node }) {
    if (!node.branches) {
      node.branches = [];
    }
    if (node.branches) {
      let i = 0;

      for (const [i, c] of Object.entries(
        (node.conditions || []) as Condition[]
      )) {
        const idx = i as unknown as number;
        if (node.branches[idx]) {
          node.branches[idx].idx = idx;
          node.branches[idx].code = c.condition;
          node.branches[idx].name = c.name;
        } else {
          node.branches[idx] = {
            idx,
            code: c.condition,
            name: c.name,
            flow: [],
          } as any;
        }
      }

      for (const branch of node.branches) {
        if (
          typeof branch.idx === "undefined" ||
          branch.idx >= node.conditions.length
        ) {
          if (!node.unused_branches) node.unused_branches = [];
          node.unused_branches.push(branch);
          node.branches = node.branches.filter((e) => e !== branch);
        }
        i++;
      }
    }
  },
  fields: {
    conditions: {
      label: "Conditions",
      type: "array",
      className: css`
        .array-item {
          border-bottom: 4px solid #e2e8f0;
        }
      `,
      fields: {
        condition: { type: "code", idx: 1 },
        name: { idx: 0, type: "string" },
      },
    },
  },
  process: async ({ node, vars, processBranch, next }) => {
    const branches = [];
    if (node.current.branches) {
      for (const branch of node.current.branches) {
        if (branch.code) {
          const result = codeExec({
            code: `return ${branch.code}`,
            node,
            vars,
            console,
          });
          if (result) {
            branches.push(processBranch(branch));
            break;
          }
        } else {
          branches.push(processBranch(branch));
        }
      }
    }
    await Promise.all(branches);
    next();
  },
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-split"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>`,
});