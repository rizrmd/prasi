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
import { useLocal } from "base/libs/use-local";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";

export type MenuItem =
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
    <ContextMenu
      onOpenChange={(open) => {
        onOpenChange?.(open);
      }}
      modal={false}
    >
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {menu?.map((item, idx) => {
          if (typeof item === "string") {
            return <ContextMenuSeparator key={idx} />;
          }

          if (item.children) {
            return (
              <ContextMenuSub>
                <ContextMenuSubTrigger>{item.title}</ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  {item.children.map((subItem, subIdx) => {
                    if (typeof subItem === "string") {
                      return <ContextMenuSeparator key={subIdx} />;
                    }

                    return (
                      <ContextMenuItem
                        key={subIdx}
                        onClick={(e) => {
                          if (subItem.onClick) setTimeout(subItem.onClick, 0);
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
              onClick={(e) => {
                if (item.onClick) setTimeout(item.onClick, 0);
                e.stopPropagation();
                e.preventDefault();
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
