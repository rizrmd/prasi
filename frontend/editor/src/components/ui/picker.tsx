import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocal } from "base/libs/use-local";
import type { ForwardedRef, ReactNode } from "react";
import { forwardRef } from "react";

export const Picker = forwardRef<
  HTMLDivElement,
  {
    children: ReactNode | ((arg: { open: boolean }) => ReactNode);
    onOpenChange?: (open: boolean) => void;
    menu?: {
      title?: ReactNode;
      onClick?: () => void;
      shortcut?: ReactNode;
      icon?: ReactNode;
    }[];
  }
>(({ children, menu, onOpenChange }, ref: ForwardedRef<HTMLDivElement>) => {
  const local = useLocal({ open: false });
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        local.open = open;
        local.render();
        if (onOpenChange) onOpenChange(open);
      }}
      open={local.open}
    >
      <DropdownMenuTrigger asChild>
        {typeof children === "function"
          ? children({ open: local.open })
          : children}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {menu?.map((item, idx) => (
          <DropdownMenuItem
            key={idx}
            onClick={() => {
              if (item.onClick) setTimeout(item.onClick);
            }}
          >
            {item.icon}
            {item.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

Picker.displayName = "Picker";
