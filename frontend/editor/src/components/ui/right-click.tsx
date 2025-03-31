import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";

type MenuItem =
  | {
      title?: ReactNode;
      onClick?: () => void;
      shortcut?: ReactNode;
      children?: MenuItem[];
    }
  | "---";

export const RightClick = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    onOpenChange?: (open: boolean) => void;
    menu?: MenuItem[];
  }
>(({ children, menu, onOpenChange }, ref: ForwardedRef<HTMLDivElement>) => {
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {menu?.map((item, idx) => {
          if (typeof item === "string") {
            return <ContextMenuSeparator key={idx} />;
          }

          if (item.children) {
            return (
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  {item.title}
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {item.children.map((subItem, subIdx) => {
                    if (typeof subItem === "string") {
                      return <ContextMenuSeparator key={subIdx} />;
                    }

                    return (
                      <ContextMenuItem
                        key={subIdx}
                        onClick={() => {
                          if (subItem.onClick) setTimeout(subItem.onClick, 300);
                        }}
                      >
                        {subItem.title}
                        {subItem.shortcut && (
                          <ContextMenuShortcut>
                            {subItem.shortcut}
                          </ContextMenuShortcut>
                        )}
                      </ContextMenuItem>
                    );
                  })}
                </ContextMenuSubContent>
              </ContextMenuSub>
            );
          }
          return (
            <ContextMenuItem
              key={idx}
              onClick={() => {
                if (item.onClick) setTimeout(item.onClick, 300);
              }}
            >
              {item.title}
              {item.shortcut && (
                <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
              )}
            </ContextMenuItem>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
});

RightClick.displayName = "RightClick";
