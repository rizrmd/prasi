export type DEPLOY_TARGET_NAME = string;

export type DeployTarget = {
  name: DEPLOY_TARGET_NAME;
  domain: string;
  ts: number;
  status: "online" | "offline";
  db: {
    url: string;
    orm: "prasi" | "prisma";
  };
  history: {
    ts: number;
  }[];
};
export const internal = Symbol(`[internal]`);

export type SiteSettings = {
  prasi: {
    file?: {
      upload_to: DEPLOY_TARGET_NAME;
    };
    db?:
      | {
          use: "deploy_target";
          deploy_target: DEPLOY_TARGET_NAME;
        }
      | {
          use: "db_url";
          orm: "prisma" | "prasi";
          db_url: string;
        };
  };
  deploy_targets: DeployTarget[];
};
