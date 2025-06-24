import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  variant?: "default" | "success" | "warning" | "danger";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant = "default", ...props }, ref) => {
    const getVariantClass = () => {
      switch (variant) {
        case "success":
          return "bg-green-500";
        case "warning":
          return "bg-amber-500";
        case "danger":
          return "bg-red-500";
        default:
          return "bg-primary";
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary/30",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            getVariantClass()
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress"

export { Progress } 