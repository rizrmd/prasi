import {
  type PlaceholderRender
} from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { type FC } from "react";

export const DEPTH_WIDTH = 5;

export const Placeholder: FC<{
  node: Parameters<PlaceholderRender<PNode>>[0];
  params: Parameters<PlaceholderRender<PNode>>[1];
}> = ({ params }) => {
  return (
    <div
      className={cx(
        "flex items-center bg-blue-50 bg-opacity-50",
        css`
          height: 10px;
          z-index: 99;
          position: absolute;
          left: ${(params.depth + 1) * DEPTH_WIDTH - 3}px;
          transform: translateY(-50%);
          right: 0px;
        `
      )}
    >
      <div
        className={cx(
          "flex-1",
          css`
            background-color: #1b73e8;
            height: 2px;
          `
        )}
      ></div>
    </div>
  );
};
