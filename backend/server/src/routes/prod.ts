import type { BunRequest, RouterTypes } from "bun";
import { Site } from "prasi/site";
import { validate } from "uuid";

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
      const res = await fetch(`http://localhost:${site.port}${params["*"]}`, {
        method: req.method,
        headers: req.headers,
        body: req.body,
      });
      return res;
    } else {
      const loading = Site.loading[params.site_id];
      return new Response("Loading: " + loading?.status, { status: 202 });
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
