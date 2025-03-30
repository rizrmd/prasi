import * as cheerio from "cheerio";

export const parseScriptSrcFromHtml = async (path: string) => {
  const html = await Bun.file(path).text();
  const $ = cheerio.load(html);

  const linkTags = $('link[rel="stylesheet"]');
  const linkHrefs = linkTags
    .map((_, link) => $(link).attr("href"))
    .get()
    .filter((href) => href && !href.startsWith("data:"));

  const scriptTags = $("script");
  const scriptSrcs = scriptTags
    .map((_, script) => $(script).attr("src"))
    .get()
    .filter((src) => src && !src.startsWith("data:"));

  return { js: scriptSrcs, css: linkHrefs };
};
