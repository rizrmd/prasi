import type { SiteSettings } from "prasi-frontend/src/nova/ed/cprasi/lib/typings";
import type { PrasiSite, PrasiVMInitArg } from "utils/global";

export const newPrasiIpcArg = ({
  site_id,
  prasi,
  action,
  settings,
}: {
  site_id: string;
  prasi: PrasiVMInitArg["prasi"];
  action: PrasiVMInitArg["action"];
  settings: SiteSettings | null;
}): PrasiVMInitArg => {
  const db_config: PrasiVMInitArg["db"] = { orm: "prisma", url: "" };

  const prasi_db = settings?.prasi.db;
  if (prasi_db?.use === "db_url") {
    if (prasi_db.orm === "prisma") {
      db_config.orm = "prisma";
      db_config.url = prasi_db.db_url;
    }
  }

  return {
    site_id,
    mode: "ipc",
    prasi,
    dev: g.mode === "dev",
    action: action,
    db: db_config,
  };
};
