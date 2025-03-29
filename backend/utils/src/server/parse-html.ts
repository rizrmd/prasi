import * as cheerio from 'cheerio';

export const parseScriptSrcFromHtml = async (path: string): Promise<string[]> => {
  const html = await Bun.file(path).text();
  const $ = cheerio.load(html);

  const scriptTags = $('script');
  const scriptSrcs = scriptTags
    .map((_, script) => $(script).attr('src'))
    .get()
    .filter((src) => src && !src.startsWith('data:'));
  return scriptSrcs;
};
