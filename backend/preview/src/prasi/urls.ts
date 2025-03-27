import { argv } from "utils/argv";

export const prasiUrls = (site_id: string) => {
  const standalone = argv.get("--standalone") ? true : false;

  return {
    pages: `/_prasi/${site_id}/pages`,
    page: `/_prasi/${site_id}/page/:page_id`,
    layout: `/_prasi/${site_id}/layout`,
    components: `/_prasi/${site_id}/components`,
  };
};
