import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Spinner } from "@/components/ui/spinner";
import { writeLogger } from "@/editor/state/logger";
import type { DeepReadonly } from "@/lib/crdt";
import { type SiteLogMessage } from "backend/server/src/ws/typings";
import { gunzipSync } from "fflate";
import { unpack } from "msgpackr";
import { useEffect, type FC, type ReactNode } from "react";
import { ref, useSnapshot } from "valtio";
export default () => {
  const readLogger = useSnapshot(writeLogger);
  useEffect(() => {
    if (!readLogger.ws) {
      const url = new URL(location.href);
      url.protocol = url.protocol.replace("http", "ws");
      url.pathname = `/_prasi/${params.id}/logger`;
      const ws = new WebSocket(url);
      ws.onmessage = async ({ data }: { data: Blob }) => {
        const compressed_msg = gunzipSync(
          new Uint8Array(await data.arrayBuffer())
        );
        const msg = unpack(compressed_msg) as SiteLogMessage;

        if (msg.status === "site-loading") {
          writeLogger.status = "loading";
          writeLogger.server.startup = msg.message;
        } else if (msg.status === "init") {
          writeLogger.status = "ready";
          writeLogger.frontend.logs = msg.frontend;
          writeLogger.backend.logs = msg.backend;
          writeLogger.server.logs = msg.server;
          writeLogger.server.status = msg.server_status;
        } else if (msg.status === "server") {
          writeLogger.server.logs = msg.message;
        } else if (msg.status === "frontend") {
          writeLogger.frontend.logs = msg.message;
        } else if (msg.status === "backend") {
          writeLogger.backend.logs = msg.message;
        } else if (msg.status === "server-stop") {
          writeLogger.server.status = "stopped";
        } else if (msg.status === "server-start") {
          writeLogger.server.status = "started";
        }
      };
      writeLogger.ws = ref(ws);
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 items-stretch">
      <div className="border-b h-[40px] flex items-stretch">
        {readLogger.status !== "ready" && (
          <div className="flex items-center p-2 space-x-2 text-sm">
            <Spinner asChild />
            <div>Connecting to logger...</div>
          </div>
        )}
      </div>
      {readLogger.status === "init" && <Spinner size="lg" />}
      {readLogger.status === "loading" && (
        <pre className="overflow-auto flex-1 whitespace-pre-wrap p-[10px] text-sm">
          {readLogger.server.startup}
        </pre>
      )}
      {readLogger.status === "ready" && (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={25}
            className="flex flex-col items-stretch whitespace-pre-wrap text-sm"
          >
            <LogOutput title="FrontEnd Build" logs={readLogger.frontend.logs} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={25}
            className="flex flex-col items-stretch whitespace-pre-wrap text-sm"
          >
            <LogOutput title="BackEnd Build" logs={readLogger.backend.logs} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={50}
            className="flex flex-col items-stretch whitespace-pre-wrap text-sm"
          >
            <LogOutput
              title="Server Logs"
              status={
                readLogger.server.status === "started" ? (
                  <div className="bg-green-700 text-white rounded-md px-2">
                    Running
                  </div>
                ) : (
                  <div className="bg-red-700 text-white rounded-md px-2">
                    Stopped
                  </div>
                )
              }
              logs={readLogger.server.logs}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};

const LogOutput: FC<{
  title: ReactNode;
  status?: ReactNode;
  logs: string | DeepReadonly<{ ts: number; raw: string }[]>;
}> = ({ logs, title, status }) => {
  return (
    <>
      <div className="text-[9px] px-[10px] py-[5px] border-b bg-slate-50 flex space-x-1">
        <div>{title}</div>
        {status}
      </div>
      <div className="relative overflow-auto flex-1">
        <div className="absolute font-mono text-[11px] inset-0 flex flex-col items-stretch whitespace-pre-wrap p-[10px]">
          {typeof logs === "string"
            ? logs
            : logs.map((e, idx) => <div key={idx}>{e.raw}</div>)}
        </div>
      </div>
    </>
  );
};
