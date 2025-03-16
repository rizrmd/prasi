import { gzipSync, type RouterTypes } from "bun";
import { pack } from "msgpackr";

export const proxy: RouterTypes.RouteHandler<"/_proxy/*"> = async (req) => {
  const raw_url = new URL(req.url);
  let url = raw_url.pathname.substring("/_proxy/".length);

  if (!(url.startsWith("http://") || url.startsWith("https://"))) {
    url = `https://${url}`;
  }

  try {
    const body = await req.arrayBuffer();
    const headers = {} as Record<string, string>;
    req.headers.forEach((v, k) => {
      if (k.startsWith("sec-")) return;
      if (k.startsWith("connection")) return;
      if (k.startsWith("dnt")) return;
      if (k.startsWith("host")) return;
      headers[k] = v;
    });

    let final_body: any = body;
    let final_headers: any = headers;
    if (req.headers.get("x-proxy-header") === "none") {
      final_headers = undefined;
    }

    const res = await fetch(url as any, {
      method: req.method || "POST",
      headers: final_headers,
      body: final_body,
    });

    let res_body: any = null;
    const res_headers: any = {};
    res.headers.forEach((v, k) => {
      res_headers[k] = v;
    });
    res_body = await res.arrayBuffer();

    if (res_headers["content-encoding"] === "gzip") {
      delete res_headers["content-encoding"];
    } else if (res_headers["content-encoding"] === "br") {
      res_body = new TextDecoder().decode(res_body);
      delete res_headers["content-encoding"];
    }
    return new Response(res_body, { headers: res_headers });
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        status: "failed",
        reason: e.message,
      }),
      {
        status: 403,
        headers: { "content-type": "application/json" },
      }
    );
  }
};
