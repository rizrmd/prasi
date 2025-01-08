import { waitUntil } from "prasi-utils";
import { validate } from "uuid";
import { crdt_comps, crdt_pages } from "../../ws/crdt/shared";
import { editor } from "../editor";
import { parseTypeDef } from "../parser/parse-type-def";
import { compressed } from "../server/compressed";
import type { ServerCtx } from "../server/ctx";
import { fs } from "utils/files/fs";
import { extractVscIndex } from "./utils/extract-vsc";
import { dir } from "utils/files/dir";

export const siteProdPrasi = async ({
  pathname,
  site_id,
  ctx,
}: {
  pathname: string;
  site_id: string;
  ctx: ServerCtx;
}) => {
  const action = pathname.split("/")[1];
  const site = g.site.loaded[site_id];

  const body: any = ctx.req.method === "POST" ? await ctx.req.json() : {};

  switch (action) {
    case "prisma.ext": {
      const path = dir.root(
        `backend/srv/utils/templates/typings/prisma_ext_d_ts`
      );
      const file = Bun.file(path);
      return new Response(file);
    }
    // case "type_vsc": {
    //   const site = g.site.loaded[site_id];
    //   let vars = {};
    //   let source = "";
    //   if (site) {
    //     if (
    //       !fs.exists(`code:${site_id}/site/src/${site.prasi.frontend.typings}`)
    //     ) {
    //       await waitUntil(
    //         () =>
    //           fs.exists(
    //             `code:${site_id}/site/src/${site.prasi.frontend.typings}`
    //           ),
    //         { interval: 500 }
    //       );
    //     }
    //     source = await fs.read(
    //       `code:${site_id}/site/src/${site.prasi.frontend.typings}`,
    //       "string"
    //     );
    //     vars = site.process.vsc_vars;

    //     if (source && Object.keys(vars).length === 0) {
    //       await extractVscIndex(site_id);
    //       vars = site.process.vsc_vars;
    //     }
    //   }
    //   return compressed(
    //     ctx,
    //     JSON.stringify({
    //       vars,
    //       source,
    //     })
    //   );
    //   break;
    // }
    // case "type_def": {
    //   const path = dir.data(`/code/${site_id}/site/typings.d.ts`);
    //   const file = Bun.file(path);
    //   if (await file.exists()) {
    //     try {
    //       const res = JSON.stringify(await parseTypeDef(path));
    //       await Bun.write(
    //         dir.data(
    //           `/code/${site_id}/site/type_def.${file.lastModified}.json`
    //         ),
    //         res
    //       );

    //       return new Response(Bun.gzipSync(res), {
    //         headers: {
    //           "content-type": "application/json",
    //           "content-encoding": "gzip",
    //         },
    //       });
    //     } catch (e) {}
    //   }
    //   return new Response("{}", {
    //     headers: { "content-type": "application/json" },
    //   });
    // }
    // case "typings.d.ts": {
    //   const build_path = dir.data(`/code/${site_id}/site/typings.d.ts`);
    //   let file = Bun.file(build_path);

    //   if (await file.exists()) {
    //     const body = Bun.gzipSync(await file.arrayBuffer());

    //     return new Response(body, {
    //       headers: {
    //         "content-type": file.type,
    //         "content-encoding": "gzip",
    //       },
    //     });
    //   }
    //   return new Response("");
    // }
    // case "code": {
    //   if (!site.asset) {
    //     await waitUntil(() => site.asset);
    //   }

    //   const res = site.asset!.serve(ctx, {
    //     prefix: `/prod/${site_id}/_prasi/code`,
    //   });

    //   if (!res) {
    //     if (
    //       !site.asset!.exists(ctx.url.pathname, {
    //         prefix: `/prod/${site_id}/_prasi/code`,
    //       })
    //     ) {
    //       return new Response(`NOT FOUND`, {
    //         status: 404,
    //       });
    //     }
    //   }

    //   return res;
    // }
    case "compress":
      return new Response("OK");
    case "route": {
      const res = await editor.load_cached({
        type: "route",
        key: site_id,
        loader: async () => {
          const site = await _db.site.findFirst({
            where: { id: site_id },
            select: {
              id: true,
              name: true,
              domain: true,
              responsive: true,
              config: true,
              settings: true,
            },
          });

          const layouts = await _db.page.findMany({
            where: {
              name: { startsWith: "layout:" },
              is_deleted: false,
              id_site: site_id,
            },
            select: {
              id: true,
              name: true,
              is_default_layout: true,
              content_tree: true,
            },
          });

          let layout = null as any;
          for (const l of layouts) {
            if (!layout) layout = l;
            if (l.is_default_layout) layout = l;
          }

          let api_url = "";
          if (site && site.config && (site.config as any).api_url) {
            api_url = (site.config as any).api_url;
            delete (site as any).config;
          }
          const urls = await _db.page.findMany({
            where: {
              id_site: site_id,
              is_default_layout: false,
              is_deleted: false,
            },
            select: { url: true, id: true },
          });

          return JSON.stringify({
            site: { ...site, api_url },
            urls,
            layout: layout
              ? { id: layout.id, root: layout.content_tree }
              : undefined,
          });
        },
      });

      return await compressed(ctx, res);
    }
    case "page": {
      const page_id = pathname.split("/").pop() as string;
      if (validate(page_id)) {
        const page = await _db.page.findFirst({
          where: { id: page_id },
          select: { content_tree: true, url: true },
        });

        if (page) {
          return await compressed(ctx, page);
        }
      }
      return new Response("null", {
        headers: { "content-type": "text/javascript" },
      });
    }
    case "pages": {
      const page_ids = body.ids as string[];
      if (page_ids) {
        const ids = page_ids.filter((id) => validate(id));
        const cached = {} as Record<
          string,
          { id: string; url: string; root: any }
        >;

        for (const id of ids) {
          const crdt = crdt_pages[id];
          if (crdt) {
            const content_tree = crdt.doc.getMap("data").toJSON();
            cached[id] = {
              id,
              url: crdt.url,
              root: content_tree,
            };
          }
        }

        const uncached_ids = ids.filter((id) => !cached[id]);
        if (uncached_ids.length === 0) {
          return await compressed(ctx, Object.values(cached));
        }
        const pages = await _db.page.findMany({
          where: { id: { in: uncached_ids } },
          select: { id: true, content_tree: true, url: true },
        });
        return await compressed(ctx, [
          ...Object.values(cached),
          ...pages.map((e: any) => ({
            id: e.id,
            url: e.url,
            root: e.content_tree,
          })),
        ]);
      }
      break;
    }
    case "comp": {
      const ids = body.ids as string[];
      const result = {} as Record<string, any>;
      if (Array.isArray(ids)) {
        for (const id of ids) {
          const crdt = crdt_comps[id];
          if (crdt) {
            result[id] = crdt.doc.getMap("data").toJSON();
          }
        }

        const uncached_ids = ids.filter((id) => !result[id]);
        if (uncached_ids.length > 0) {
          const comps = await _db.component.findMany({
            where: { id: { in: uncached_ids }, deleted_at: null },
            select: { content_tree: true, id: true },
          });
          for (const comp of comps) {
            result[comp.id] = comp.content_tree;
          }
        }
      }
      return await compressed(ctx, result);
    }
  }
  return new Response("action " + action + ": not found");
};
