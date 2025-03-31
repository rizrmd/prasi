import type { EBaseComp, IItem } from "frontend/base/src/prasi/logic/types";
import { validate } from "uuid";

export default {
  init: async (id: string) => {
    const comp_id = id.substring("comp/".length);
    if (validate(comp_id)) {
      const res = await db.component.findFirst({
        where: { id: comp_id },
        select: {
          content_tree: true,
          id_component_group: true,
          id: true,
          color: true,
        },
      });
      return res as EBaseComp;
    }
    return {} as any;
  },
  update: async (id: string, data: EBaseComp) => {
    const comp_id = id.substring("comp/".length);
    if (validate(comp_id)) {
      await db.component.update({
        where: { id: comp_id },
        data: data,
      });
    }
  },
};
