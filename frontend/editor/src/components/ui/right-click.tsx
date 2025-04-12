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
      <ContextMenuContent
        replaceClassName
        className={cn(
          "bg-popover text-popover-foreground data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto border",
          css``
        )}
      >
        {menu?.map((item, idx) => {
          if (typeof item === "string") {
            return <ContextMenuSeparator key={idx} />;
          }

          if (item.children) {
            return (
              <ContextMenuSub>
                <ContextMenuSubTrigger>{item.title}</ContextMenuSubTrigger>
                <ContextMenuSubContent
                  replaceClassName
                  className={cn(
                    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden border"
                  )}
                >
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
