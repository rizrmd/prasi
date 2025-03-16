import type { BunRequest, RouterTypes } from "bun";
import { gzipSync } from "bun";
import { Site } from "prasi/site";
import { validate } from "uuid";
import { loadingJs } from "./loading-js";

type Req = BunRequest<"/prod/:site_id" | "/prod/:site_id/*">;
export const routeProd: RouterTypes.RouteHandler<
  "/prod/:site_id" | "/prod/:site_id/*"
> = async (req) => {
  const { params } = parseURL(req);

  if (validate(params.site_id)) {
    const site = Site.check(params.site_id);
    if (!site) {
      Site.load(params.site_id);
    }
    if (site) {
      try {
        const res = await fetch(`http://localhost:${site.port}${params["*"]}`, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });

        const resContentType = res.headers.get("content-type") || "";

        // Only compress text-based content
        if (
          resContentType.includes("text/") ||
          resContentType.includes("application/json") ||
          resContentType.includes("application/json") ||
          resContentType.includes("application/javascript") ||
          resContentType.includes("application/xml")
        ) {
          const content = await res.text();
          const compressed = gzipSync(content);

          const headers = new Headers(res.headers);
          headers.set("content-encoding", "gzip");
          headers.set("content-length", compressed.length.toString());

          return new Response(compressed, {
            status: res.status,
            headers,
          });
        }

        return res;
      } catch (e) {
        return new Response(
          `
          <pre>
Failed to load site ${params.site_id}
proxying to ~> <a href="http://localhost:${site.port}" target="_blank">http://localhost:${site.port}</a>  

----
` +
            e +
            `</pre>`,
          {
            status: 503,
            headers: {
              "Content-Type": "text/html",
            },
          }
        );
      }
    } else {
      const loading = Site.loading[params.site_id];
      return new Response(
        `\
<pre>${"Loading: " + loading?.status}</pre>
<script>(${loadingJs.toString()})("${params.site_id}")</script>
`,
        {
          status: 202,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
  }
  return new Response("Invalid Site ID:" + params.site_id, { status: 400 });
};

const parseURL = (req: Req) => {
  const url = new URL(req.url);
  const params = req.params as { site_id: string; "*": string };
  params["*"] =
    "/" +
    url.pathname
      .split("/")
      .filter((e) => e)
      .slice(2)
      .join("/");

  return { url, params };
};
