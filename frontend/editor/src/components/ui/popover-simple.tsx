import type { FC, ReactNode } from "react";

import {
  Popover as PopoverComplex,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const Popover: FC<{
  content: ReactNode;
  children: ReactNode;
}> = ({ content, children }) => {
  return (
    <PopoverComplex>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        asChild
        className={
          "bg-popover text-popover-foreground rounded-md border p-1 shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 origin-(--radix-popover-content-transform-origin) text-sm"
        }
        replaceClassName
      >
        {content}
      </PopoverContent>
    </PopoverComplex>
  );
};
