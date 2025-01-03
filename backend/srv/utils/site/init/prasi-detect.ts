import { fs } from "utils/files/fs";
import type { PrasiSite } from "utils/global";
import { prasiPathV5 } from "./prasi-path-v5";
import { prasiPathV4 } from "./prasi-path-v4";

export const detectPrasi = async (site_id: string) => {
  const json: PrasiSite["prasi"] = {
    version: 5,
    paths: prasiPathV5(site_id),
  };

  if (fs.exists(`code:${site_id}/site/src/index.tsx`)) {
    json.version = 4;
    json.paths = prasiPathV4(site_id);
  }

  return json;
};
