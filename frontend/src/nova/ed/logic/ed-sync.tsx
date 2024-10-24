import { clientStartSync } from "../../../utils/sync/client";
import { Loading } from "../../../utils/ui/loading";
import { PG } from "./ed-global";
import { EPage } from "./types";

export const loadSession = (p: PG) => {
  const session = JSON.parse(
    localStorage.getItem("prasi-session") || "null"
  ) as { data: { user: { id: string; username: string } } };
  if (!session && location.pathname.startsWith("/ed/")) {
    location.href = "/login";
    return <Loading note="logging in" />;
  }

  if (session?.data?.user) {
    p.user.id = session.data.user.id;
    p.user.username = session.data.user.username;
  } else {
    p.user.id = "ab1390f5-40d5-448e-a8c3-84b0fb600930";
    p.user.username = "anonymous";
  }
};

export const initSync = (p: PG) => {
  loadSession(p);

  if (p.sync === null) {
    clientStartSync({
      p,
      user_id: p.user.id,
      site_id: params.site_id,
      page_id: params.page_id,
    }).then(async (sync) => {
      p.sync = sync;
      p.status = "ready";
      p.site = await p.sync!.site.load(params.site_id);

      const page = (await p.sync!.page.load(params.page_id)) as EPage;
      p.page.cur = page;

      console.log("🚀 Prasi Connected");
      p.render();
    });
  }

  return p.status === "ready";
};
