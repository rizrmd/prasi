import { Button } from "@/components/ui/button";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FC, ReactNode } from "react";
import { Tooltip as TooltipComplex } from "./tooltip";

export const Tooltip: FC<{
  content: ReactNode;
  children: ReactNode;
}> = ({ content, children }) => {
  return (
    <TooltipProvider>
      <TooltipComplex>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </TooltipComplex>
    </TooltipProvider>
  );
};
