import type { FNAdv, MetaItem } from "base/prasi/logic/types";
import { responsiveVal } from "base/prasi/utils/responsive-val";

export const cssAdv = (
  cur: { adv?: FNAdv; type: MetaItem["type"] },
  mode: "mobile" | "desktop"
) => {
  const adv = responsiveVal<FNAdv>(cur, "adv", mode, {});

  if (typeof adv.css === "string") {
    const hasCSS = adv.css.trim();
    if (hasCSS) {
      return cx(
        css`
          ${adv.css}
        `,
        mode
      );
    }
  }
  return "";
};
