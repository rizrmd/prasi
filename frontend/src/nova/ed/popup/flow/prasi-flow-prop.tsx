import { useLocal } from "utils/react/use-local";
import { PFPropNode } from "./prop/pf-prop-node";
import { PFPropEdge } from "./prop/pf-prop.edge";
import { RPFlow } from "./runtime/types";
import { fg, PrasiFlowPropLocal } from "./utils/flow-global";

export const PrasiFlowProp = ({ pflow }: { pflow: RPFlow }) => {
  const local = useLocal({
    selection: fg.prop?.selection || {
      nodes: [],
      edges: [],
      loading: false,
      selectAll() {},
    },
  } as PrasiFlowPropLocal);

  fg.prop = local;

  const sel = local.selection;
  const rf_node = local.selection.nodes[0];
  const pf_node = rf_node ? pflow.nodes[rf_node.id] : undefined;

  if (sel.loading) {
    return null;
  }
  return (
    <div className={cx("flex flex-col flex-1 w-full h-full ")}>
      {sel.nodes.length !== 1 && sel.edges.length !== 1 ? (
        <div
          className={cx(
            "flex items-center justify-center flex-1 flex-col space-y-1"
          )}
        >
          {sel.nodes.length === 0 && sel.edges.length === 0 ? (
            <>
              <div className="relative overflow-auto w-full h-full flex-1">
                <div className="absolute inset-0">
                  <pre
                    className={cx("text-[9px]")}
                    contentEditable
                    dangerouslySetInnerHTML={{
                      __html: JSON.stringify(pflow, null, 2),
                    }}
                    spellCheck={false}
                  ></pre>
                </div>
              </div>
              {/* <div className="text-xs">Please Select Node</div>
              <div className="text-xs italic">&mdash; Or &mdash;</div>
              <div className="text-xs">
                <span className="text-[10px] rounded-sm font-mono border border-slate-300 px-[5px] py-[1px]">
                  Shift
                </span>{" "}
                Drag to multi-select
              </div> */}
            </>
          ) : (
            <div
              className={cx(
                "p-2 border rounded-md",
                css`
                  width: 80%;
                `
              )}
            >
              <div className="text-xs">Selected:</div>
              <div className="text-xs">
                {sel.nodes.length} node{sel.nodes.length > 1 && "s"}
              </div>
              <div className="text-xs">
                {sel.edges.length} edge{sel.edges.length > 1 && "s"}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {sel.edges.length === 1 && (
            <>
              <PFPropEdge edge={sel.edges[0]} pflow={pflow} />
            </>
          )}
          {sel.nodes.length === 1 && (
            <>{pf_node && <PFPropNode pflow={pflow} node={pf_node} />}</>
          )}
        </>
      )}
    </div>
  );
};
