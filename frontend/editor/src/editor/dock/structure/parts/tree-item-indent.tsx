import { editor } from "@/editor/state/editor";
import type { NodeModel, RenderParams } from "@minoru/react-dnd-treeview";
import type { PNode } from "base/prasi/logic/types";
import { type FC, type ReactNode } from "react";
import { useSnapshot } from "valtio";

export const TreeItemIndent: FC<{
  node: NodeModel<PNode>;
  render_params: RenderParams;
}> = ({ node, render_params }) => {
  const read = useSnapshot(editor.tree);
  const isRenaming = read.renaming.id === node.data?.item.id;

  const data = node.data!;
  const item = data.item;
  if (!item) {
    return <>ERROR: No Data</>;
  }

  const isComponent = item.type === "item" && item.component?.id;

  return (
    <div
      className={cx(
        "node-indent-root flex items-stretch cursor-pointer",
        read.search.text && "pl-2"
      )}
      onClick={(e) => {
        e.stopPropagation();

        if (item && item.type !== "text") {
          const id = read.select.component_id
            ? `comp-${read.select.component_id}`
            : "page";
          if (!editor.tree.expanded[id]) {
            editor.tree.expanded[id] = [];
          }
          const open = editor.tree.expanded[id];
          if (!render_params.isOpen) {
            open.push(item.id);
          } else {
            editor.tree.expanded[id] = open.filter((e) => e !== item.id);
          }

          localStorage.setItem(
            "prasi-tree-open",
            JSON.stringify(editor.tree.expanded)
          );
          render_params.onToggle();
        }
      }}
    >
      <div className={cx("flex items-stretch ml-1", "-mr-[7px]")}>
        {Array.from({ length: render_params.depth }, (_, n) => n).map((n) => {
          return (
            <div
              key={n}
              className={cx(
                "border-l node-indent mr-[4px]",
                item.id === read.select.id
                  ? "border-l-transparent"
                  : cn(
                      "border-opacity-30",
                      n === 0 && "border-l-slate-100",
                      n === 1 && "border-l-slate-200",
                      n === 2 && "border-l-slate-300",
                      n === 3 && "border-l-slate-300",
                      n === 4 && "border-l-slate-400",
                      n === 5 && "border-l-slate-400",
                      n === 6 && "border-l-slate-500",
                      n > 6 && "border-l-purple-600"
                    )
              )}
            ></div>
          );
        })}
      </div>
      <div className={cx("flex items-center justify-center w-[20px]")}>
        {item.type === "text" && (
          <div className="-mt-[2px]">
            <Text />
          </div>
        )}
        {item.type === "item" && !isComponent && !render_params.hasChild && (
          <div className={cn(render_params.depth === 0 && "pl-[3px]")}>
            <ItemIcon />
          </div>
        )}
        {isComponent && !render_params.hasChild && (
          <div className="node-text text-purple-600 mt-[1px]">
            <ComponentIcon />
          </div>
        )}
        {item.type === "item" && render_params.hasChild && (
          <>{render_params.isOpen ? <ChevronDown /> : <ChevronRight />}</>
        )}

        {item.type === "section" && (
          <>{render_params.isOpen ? <ChevronDown /> : <ChevronRight />}</>
        )}
      </div>
    </div>
  );
};

const chevronSize = 13;
const sectionSize = 17;

export const ChevronRight = ({ size: size }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || chevronSize}
    height={size || chevronSize}
    fill="none"
    viewBox="0 0 15 15"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M6.158 3.135a.5.5 0 01.707.023l3.75 4a.5.5 0 010 .684l-3.75 4a.5.5 0 11-.73-.684L9.566 7.5l-3.43-3.658a.5.5 0 01.023-.707z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={chevronSize}
    height={chevronSize}
    fill="none"
    viewBox="0 0 15 15"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M3.135 6.158a.5.5 0 01.707-.023L7.5 9.565l3.658-3.43a.5.5 0 01.684.73l-4 3.75a.5.5 0 01-.684 0l-4-3.75a.5.5 0 01-.023-.707z"
      clipRule="evenodd"
    ></path>
  </svg>
);
export const ComponentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={10}
    height={10}
    fill="none"
    viewBox="0 0 15 15"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M7.289.797a.5.5 0 01.422 0l6 2.8A.5.5 0 0114 4.05v6.9a.5.5 0 01-.289.453l-6 2.8a.5.5 0 01-.422 0l-6-2.8A.5.5 0 011 10.95v-6.9a.5.5 0 01.289-.453l6-2.8zM2 4.806L7 6.93v6.034l-5-2.333V4.806zm6 8.159l5-2.333V4.806L8 6.93v6.034zm-.5-6.908l4.772-2.028L7.5 1.802 2.728 4.029 7.5 6.057z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export const ItemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={9}
    height={9}
    fill="none"
    viewBox="0 0 15 15"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2.857 2h9.286c.473 0 .857.384.857.857v9.286a.857.857 0 01-.857.857H2.857A.857.857 0 012 12.143V2.857C2 2.384 2.384 2 2.857 2zM1 2.857C1 1.831 1.831 1 2.857 1h9.286C13.168 1 14 1.831 14 2.857v9.286A1.857 1.857 0 0112.143 14H2.857A1.857 1.857 0 011 12.143V2.857zM7.5 5a.5.5 0 100-1 .5.5 0 000 1zm-3 6a.5.5 0 100-1 .5.5 0 000 1zM5 7.5a.5.5 0 11-1 0 .5.5 0 011 0zM4.5 5a.5.5 0 100-1 .5.5 0 000 1zm6.5 5.5a.5.5 0 11-1 0 .5.5 0 011 0zM10.5 8a.5.5 0 100-1 .5.5 0 000 1zm.5-3.5a.5.5 0 11-1 0 .5.5 0 011 0zM7.5 11a.5.5 0 100-1 .5.5 0 000 1z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const SectionRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={sectionSize}
    height={sectionSize}
    fill="none"
    viewBox="0 0 15 15"
  >
    <path fill="currentColor" d="M6 11V4l4.5 3.5L6 11z"></path>
  </svg>
);

const SectionDown = () => (
  <svg
    width={sectionSize}
    height={sectionSize}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 6H11L7.5 10.5L4 6Z" fill="currentColor"></path>
  </svg>
);

const Text = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="none"
    viewBox="0 0 15 15"
    className="opacity-50 mt-[1px] mb-[-1px]"
  >
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M3.95 2.95V4.5a.45.45 0 01-.9 0v-2a.45.45 0 01.45-.45h8a.45.45 0 01.45.45v2a.45.45 0 11-.9 0V2.95h-3v9.1h1.204a.45.45 0 010 .9h-3.5a.45.45 0 110-.9H6.95v-9.1h-3z"
      clipRule="evenodd"
    ></path>
  </svg>
);
