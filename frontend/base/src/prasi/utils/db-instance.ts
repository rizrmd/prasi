import { pack } from "msgpackr";
import Pako from "pako";
import { dbProxy } from "utils/db-proxy";

export const dbInstance = () => {
  return dbProxy({
    gzip: Pako.gzip,
    async fetch({ method, pathname, body, mode }) {
      const target = new URL(location.href);
      target.pathname =
        window.prasi_site.baseurl +
        "/_proxy/" +
        (window.prasi_site.siteurl.startsWith("https")
          ? window.prasi_site.siteurl.substring("https://".length)
          : window.prasi_site.siteurl) +
        pathname;

      if (window.prasi_site.siteurl === "prasi.avolut.com") {
        target.pathname = pathname;
      }

      if (mode === "msgpack") {
        const res = await fetch(target, {
          method: "POST",
          headers: { "x-proxy-header": "none" },
          body: Pako.gzip(pack(body)),
        });
        return await res.json();
      } else {
        const res = await fetch(target, {
          method,
          headers: { "x-proxy-header": "none" },
          body,
        });
        return await res.json();
      }
    },
  });
};
