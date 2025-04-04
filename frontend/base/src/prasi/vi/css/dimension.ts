import type { FNDimension, MetaItem } from "base/prasi/logic/types";
import { responsiveVal } from "base/prasi/utils/responsive-val";

export const cssDimension = (
  cur: { dim?: FNDimension; type: MetaItem["type"] },
  mode?: "mobile" | "desktop",
  editor?: boolean
) => {
  const dim = responsiveVal<FNDimension>(cur, "dim", mode, {
    h: "fit",
    w: "fit",
  });

  if (dim.w === "full" && dim.h === "full") {
    return `
      width:100%;
      height:100%;
      flex:1;
    `;
  }

  return cx(
    dim.w === "fit" &&
      `
        & > .txt-box > * {
          white-space: nowrap !important;
        }
      `,
    dim.w === "full" &&
      `
        width: 100%;
      `,
    dim.w &&
      typeof dim.w === "number" &&
      dim.w >= 0 &&
      `
        width: ${dim.w}${dim.wUnit || "px"};
        overflow-x: clip;
      `,
    dim.h === "full" &&
      `
        height: ${
          editor
            ? "100%"
            : "100" +
              (cur.type === "section" ? (mode === "mobile" ? "vh" : "vh") : "%")
        };
        margin-bottom: auto;
      `,

    dim.h &&
      typeof dim.h === "number" &&
      dim.h >= 0 &&
      `
        height: ${dim.h}${dim.hUnit || "px"};
        overflow-y: clip;
      `
  );
};
