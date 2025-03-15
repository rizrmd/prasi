import type { ReactNode } from "react";
import { useErrorBoundary, withErrorBoundary } from "react-use-error-boundary";
import type { PNode } from "../logic/types";
import { useLocal } from "./use-local";

export const ErrorBox = withErrorBoundary(
  ({
    children,
    error_jsx,
    node,
    id,
    silent = true,
    onError,
  }: {
    children: any;
    error_jsx?: ReactNode;
    node?: PNode;
    id?: string;
    silent?: boolean;
    onError?: (error: any) => void;
  }) => {
    const local = useLocal({ retrying: false, node });
    const [error, resetError] = useErrorBoundary((error, errorInfo) => {
      if (silent !== true) console.error(error);
      if (onError) onError(error);
    });

    if (error) {
      if (typeof error_jsx !== "undefined") return error_jsx;
      return (
        <div className="bg-red-100 border border-red-300 rounded-sm text-xs flex flex-col items-center">
          <div className="text-[10px] font-bold text-red-900 self-stretch px-1">
            ERROR {node?.item.name ? "[" + node.item.name + "]:" : ""}
          </div>
          <p className="border-b border-red-300 text-black px-1 pb-1 min-w-[100px]">
            {!local.retrying ? <>{(error as any).message}</> : <>Retrying...</>}
          </p>
          <div className="p-1">
            <button
              onClick={() => {
                local.retrying = true;
                local.render();

                setTimeout(() => {
                  local.retrying = false;
                  local.render();
                  resetError();
                }, 100);
              }}
              className="bg-white border text-black border-white hover:border-red-400 hover:bg-red-50 rounded px-2"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
);
