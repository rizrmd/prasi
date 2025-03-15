import { type FC, type ReactNode } from "react";
import { ref } from "valtio";
import type { DeepReadonly, IItem } from "../logic/types";
import { ViItem } from "./vi-item";
import { viProps } from "./vi-props";
import { viRead, viState } from "./vi-state";

export const ViScript: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}> = ({ item, is_layout }) => {
  const vi = viRead();
  const { write } = viState({ mode: "layout", id: item.id });
  const jsBuilt = item.adv?.jsBuilt!;

  const keys = ["props", "children"];
  const values = [] as any[];
  for (const [k, v] of Object.entries(window.prasi_site.exports)) {
    keys.push(k);
    values.push(v);
  }
  if (!write.jsBuilt) {
    write.jsBuilt = ref(
      new Function(
        "render",
        ...keys,
        `try { ${jsBuilt} } catch(e) {console.error(e)}`
      )
    ) as any;
  }

  let result = { el: null as ReactNode | null };
  write.jsBuilt!(
    (el) => {
      result.el = el;
    },
    viProps(item, { mode: vi.mode }),
    item.childs.map((e, key) => (
      <ViItem item={e} key={key} is_layout={is_layout} />
    )),
    ...values
  );

  return <>{result.el}</>;
};
