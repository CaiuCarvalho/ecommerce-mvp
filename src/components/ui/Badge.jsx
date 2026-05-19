import * as React from "react"
import { cn } from '../../lib/utils'

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary/10 text-primary": variant === "default",
          "bg-secondary/50 text-secondary-foreground": variant === "secondary",
          "bg-destructive/10 text-destructive": variant === "destructive",
          "border border-border text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
