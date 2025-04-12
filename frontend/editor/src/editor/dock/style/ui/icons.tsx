import type { FNLayout } from "base/prasi/logic/types";
import type { FC } from "react";

export const Down = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 48 48"
  >
    <path
      fill="none"
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      d="M36 18L24 30 12 18"
    ></path>
  </svg>
);
export const Wrap = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
  >
    <path d="M4 20V4h2v16H4zm14 0V4h2v16h-2zm-7.4-2.45L7.05 14l3.55-3.525 1.4 1.4L10.875 13H13q.825 0 1.413-.588T15 11q0-.825-.588-1.413T13 9H7V7h6q1.65 0 2.825 1.175T17 11q0 1.65-1.175 2.825T13 15h-2.125L12 16.125l-1.4 1.425z"></path>
  </svg>
);
export const TapDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 20 20"
  >
    <path
      d="M14 6a4 4 0 0 1-2.5 3.7V8.6a3 3 0 1 0-3 0v1.1A4 4 0 1 1 14 6ZM9.65 17.85c.2.2.5.2.7 0l3-3a.5.5 0 0 0-.7-.7l-2.15 2.14V5.5a.5.5 0 0 0-1 0v10.8l-2.15-2.15a.5.5 0 1 0-.7.7l3 3Z"
      fill="currentColor"
    ></path>
  </svg>
);

export const TapRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 20 20"
  >
    <path
      d="M6 6a4 4 0 0 1 3.7 2.5H8.6a3 3 0 1 0 0 3h1.1A4 4 0 1 1 6 6Zm8.85 7.35 3-3a.5.5 0 0 0 0-.7l-3-3a.5.5 0 1 0-.7.7l2.14 2.15H5.5a.5.5 0 0 0 0 1h10.8l-2.15 2.15a.5.5 0 0 0 .7.7Z"
      fill="currentColor"
    ></path>
  </svg>
);

export const GapIcon: FC<{ layout: FNLayout }> = ({ layout }) => (
  <div
    className={cx(
      layout.gap !== "auto" ? "pr-2 border-r border-gray-300 mr-1" : "pr-1 pl-1"
    )}
  >
    {layout.dir === "col" ? (
      <svg
        className="svg"
        width={12}
        height={13}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M11 13v-2H1v2H0v-3h12v3h-1zm1-10H0V0h1v2h10V0h1v3zM9 7V6H3v1h6z" />
      </svg>
    ) : (
      <svg
        className="svg"
        width={13}
        height={12}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M13 1h-2v10h2v1h-3V0h3v1zM3 0v12H0v-1h2V1H0V0h3zm4 3H6v6h1V3z" />
      </svg>
    )}
  </div>
);
