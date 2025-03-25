import { proxy } from "valtio";

export const writeLayout = proxy({
  left: {
    size: 0.15,
  },
  right: {
    size: 0.20
  }
});
