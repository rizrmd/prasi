import { argv } from "utils/argv";

export const prasiUrls = (site_id: string) => {
  const standalone = argv.get("--standalone") ? true : false;

  return {
    pages: `/_prasi/${site_id}/pages`,
    layout: `/_prasi/${site_id}/layout`,
  };
};
