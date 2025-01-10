import { waitUntil } from "prasi-utils";
import { editor } from "../../editor";

export const siteLoadingMessage = async (site_id: string, status: string) => {
  let loading = g.site.loading[site_id];
  let loaded = g.site.loaded[site_id];
  if (!loading && !loaded) {
    await waitUntil(() => g.site.loading[site_id]);
  }
  if (loading) {
    loading.status = status;
    editor.broadcast(
      { site_id },
      { action: "site-loading", status: loading.status }
    );
  } else {
    loaded.last_msg = status;
    editor.broadcast({ site_id }, { action: "site-loading", status: status });
  }
};

export const siteBroadcastBuildLog = (site_id: string, log: string) => {
  const loading = g.site.loading[site_id];
  if (loading) {
    editor.broadcast({ site_id }, { action: "site-build-log", log });
  }
};

export const siteBroadcastTscLog = (site_id: string, log: string) => {
  const loading = g.site.loading[site_id];
  if (loading) {
    editor.broadcast({ site_id }, { action: "site-tsc-log", log });
  }
};
