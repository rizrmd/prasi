import { type FC, type ReactNode } from "react";
import { ref } from "valtio";
import type { DeepReadonly, IItem } from "../logic/types";
import { ViItem } from "./vi-item";
import { viProps } from "./vi-props";
import { viRead, viState } from "./vi-state";
import { viLocal } from "./script/local";

export const ViScript: FC<{
  item: DeepReadonly<IItem>;
  is_layout: boolean;
}> = ({ item, is_layout }) => {
  const vi = viRead();
  const { write } = viState({ mode: "layout", id: item.id });
  const jsBuilt = item.adv?.jsBuilt!;

  const args = {
    props: viProps(item, { mode: vi.mode }),
    children: item.childs.map((e, key) => (
      <ViItem item={e} key={key} is_layout={is_layout} />
    )),
    Local: write.Local,
    preload: () => {},
  };
  if (!write.jsBuilt) {
    write.jsBuilt = ref(
      new Function(
        "render",
        ...Object.keys(args),
        ...Object.keys(window.prasi_site.exports),
        `try { ${jsBuilt} } catch(e) {console.error(e)}`
      )
    ) as any;
    write.Local = viLocal({ item, is_layout });
  }

  let result = { el: null as ReactNode | null };
  write.jsBuilt!(
    (el) => {
      result.el = el;
    },
    ...Object.values(args),
    ...Object.values(window.prasi_site.exports)
  );

  return result.el;
};
