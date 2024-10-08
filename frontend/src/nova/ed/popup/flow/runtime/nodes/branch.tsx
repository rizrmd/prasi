import { createId } from "@paralleldrive/cuid2";
import { codeExec } from "../lib/code-exec";
import { defineNode } from "../lib/define-node";
import { PFField, PFNodeBranch } from "../types";
type Condition = { condition: string; name: string; id: string };

export const nodeBranch = defineNode({
  type: "branch",
  has_branches: true,
  on_before_connect: ({ node, is_new }) => {
    if (!node.conditions) node.conditions = [];
    if (!node.branches) node.branches = [];

    const branches = node.branches as PFNodeBranch[];
    const conditions = node.conditions as Condition[];

    if (conditions.length === branches.length) {
      let raw_branch = [];
      for (const branch of branches) {
        if (
          branch.flow &&
          branch.flow.length > 0 &&
          !branch.meta?.condition_id
        ) {
          raw_branch.push(branch);
        }
      }

      let empty_branch_len = branches.filter(
        (e) => !e.flow || (e.flow && e.flow.length === 0)
      ).length;

      if (empty_branch_len === 0 || conditions.length === 0) {
        let condition_id = "";
        let name = "";

        if (conditions.length === 0 || raw_branch.length === 0) {
          let len = conditions.length + 1;
          name = "Condition " + len;
          while (conditions.some((e) => e.name === name)) {
            name = "Condition " + ++len;
          }

          condition_id = createId();
          conditions.push({ condition: "", name, id: condition_id });
        } else {
          condition_id = conditions[0].id;
          name = conditions[0].name;
        }

        if (raw_branch.length > 0) {
          raw_branch[0].meta = { condition_id };
          raw_branch[0].name = name;
          raw_branch[0].idx = conditions.length - 1;
        } else {
          branches.push({
            flow: [],
            idx: conditions.length - 1,
            name,
            meta: { condition_id: condition_id },
          });
        }
      }
    } else {
      if (conditions.length > branches.length) {
        for (const [i, c] of Object.entries(conditions)) {
          const idx = i as unknown as number;

          const branch = node.branches.find(
            (e) => e.meta?.condition_id === c.id || !e.meta?.condition_id
          );

          if (branch) {
            branch.idx = idx;
            branch.code = c.condition;
            branch.name = c.name;
            branch.meta = { condition_id: c.id };
          } else {
            node.branches.push({
              idx,
              code: c.condition,
              name: c.name,
              flow: [],
              meta: {
                condition_id: c.id,
              },
            });
          }
        }
      } else {
        for (const [i, b] of Object.entries(branches)) {
          const idx = i as unknown as number;
          if (!b.meta?.condition_id) {
            let len = conditions.length + 1;
            let name = "Condition " + len;
            while (conditions.some((e) => e.name === name)) {
              name = "Condition " + ++len;
            }

            const condition_id = createId();
            conditions.push({ condition: "", name, id: condition_id });
            b.meta = { condition_id };
            if (!b.idx) b.idx = idx;
            b.name = name;
          }
        }
      }
    }
  },
  on_before_disconnect({ from, to, flow }) {
    if (from.type === "branch" && from.branches) {
      const idx = from.branches.findIndex((e) => e.flow === flow);
      if (idx >= 0) from.branches.splice(idx, 1);
    }
  },
  on_fields_changed({ node, action }) {
    if (action.startsWith("array-")) {
      if (!node.branches) node.branches = [];
      const conditions = node.conditions as Condition[];

      node.branches = node.branches.filter((e, idx) => {
        const found = conditions.find(
          (c, idx) => c.id === e.meta?.condition_id
        );
        if (found) {
          e.name = found.name;
          return true;
        }
        return false;
      });
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
        condition: { type: "code", idx: 1, label: "Code" },
        name: {
          idx: 0,
          type: "string",
          label: "Name",
          placeholder: ({ node, path }) => {
            return path;
          },
        },
      },
    },
  } as Record<string, PFField>,
  process: async ({ runtime: node, vars, processBranch, next }) => {
    const branches = [];
    if (node.node.branches) {
      for (const branch of node.node.branches) {
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
