import { forwardRef } from "react";
import type { ReactNode, ForwardedRef } from "react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export const RightClick = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode;
    onOpenChange?: (open: boolean) => void;
    menu?: { title?: ReactNode; onClick?: () => void; shortcut?: ReactNode }[];
  }
>(({ children, menu, onOpenChange }, ref: ForwardedRef<HTMLDivElement>) => {
  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {menu?.map((item, idx) => (
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
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
});

RightClick.displayName = "RightClick";
