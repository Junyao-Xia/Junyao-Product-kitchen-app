import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";

type KitchenPanelProps = ComponentProps<"div"> & {
  children: ReactNode;
};

export function KitchenPanel({
  children,
  className,
  ...props
}: KitchenPanelProps) {
  return (
    <div className={cn("kitchen-panel p-5 md:p-6", className)} {...props}>
      {children}
    </div>
  );
}
