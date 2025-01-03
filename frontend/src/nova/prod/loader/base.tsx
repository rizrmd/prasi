import { w } from "prod/root/window";

export const base = {
  root: null as unknown as URL,
  url(...arg: any[]) {
    const pathname = arg
      .map((e) => (Array.isArray(e) ? e.join("") : e))
      .join("");

    let base_url = this.root.toString();

    if (base_url.endsWith("/"))
      base_url = base_url.substring(0, base_url.length - 1);

    if (pathname.startsWith("/")) return base_url + pathname;
    else {
      return base_url + "/" + pathname;
    }
  },
  get pathname() {
    const res = location.pathname.substring(base.root.pathname.length);
    if (!res.startsWith("/")) return `/${res}`;
    return res;
  },
  init() {
    if (!base.root) {
      let url = new URL(location.href);
      if (w._prasi.basepath) {
        url.pathname = w._prasi.basepath;
      }

      base.root = new URL(`${url.protocol}//${url.host}${url.pathname}`);

      if (base.root.pathname.endsWith("/")) {
        base.root.pathname = base.root.pathname.substring(
          0,
          base.root.pathname.length - 1
        );
      }
    }
  },
};
