import type { FNPadding } from "base/prasi/logic/types";
import { responsiveVal } from "base/prasi/utils/responsive-val";

export const cssPadding = (
  cur: { padding?: FNPadding },
  mode?: "mobile" | "desktop"
) => {
  const padding = responsiveVal<FNPadding>(cur, "padding", mode, {
    l: 0,
    b: 0,
    t: 0,
    r: 0,
  });

  return cx(
    padding.l !== undefined &&
      `
        padding-left: ${padding.l}px;
      `,
    padding.r !== undefined &&
      `
        padding-right: ${padding.r}px;
      `,
    padding.b !== undefined &&
      `
        padding-bottom: ${padding.b}px;
      `,
    padding.t !== undefined &&
      `
        padding-top: ${padding.t}px; 
      `
  );
};
