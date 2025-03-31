import type { IItem } from "base/prasi/logic/types";

export const cssEditor = ({
  item,
  hover,
  active,
}: {
  item: IItem;
  hover?: boolean;
  active?: boolean;
}) => {
  return cx(
    hover &&
      css`
        & {
          box-shadow: inset 0 0 0px 3px #bae3fd;
          > img {
            opacity: 0.6;
          }
        }
      `,
    active &&
      css`
        box-shadow: inset 0 0 0px 2px #009cff !important;
        > img {
          opacity: 0.6;
        }
      `
  );
};
