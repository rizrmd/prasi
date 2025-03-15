import { argv } from "utils/argv";

export const prasiUrls = (site_id: string) => {
  const standalone = argv.get("--standalone") ? true : false;

  return {
    pages: `/prod/${site_id}/_prasi/pages`,
    layout: `/prod/${site_id}/_prasi/layout`,
  };
};
