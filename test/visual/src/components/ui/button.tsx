import * as React from "react";
import { cn } from "../../lib/utils";

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90":
            variant === "default",
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground":
            variant === "outline",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80":
            variant === "secondary",
        },
        {
          "h-9 px-4 py-2": size === "default",
          "h-8 rounded-md px-3": size === "sm",
          "h-10 rounded-md px-6": size === "lg",
          "size-9": size === "icon",
        },
        className
      )}
      {...props}
    />
  );
}

export { Button };
