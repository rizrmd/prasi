import type { FNBackground, MetaItem } from "base/prasi/logic/types";
import { responsiveVal } from "base/prasi/utils/responsive-val";

export const cssBackground = (
  cur: { bg?: FNBackground; type: MetaItem["type"] },
  mode?: "mobile" | "desktop"
) => {
  const bg = responsiveVal<FNBackground>(cur, "bg", mode, {
    size: "contain",
    pos: "center",
  });

  return cx(
    `
      background-repeat: no-repeat;
    `,
    bg.color &&
      `
        background-color: ${bg.color};
      `,
    bg.size &&
      `
        background-size: ${bg.size};
      `,
    bg.pos &&
      `
        background-position: ${bg.pos};
      `
  );
};
