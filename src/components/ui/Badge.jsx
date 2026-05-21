import * as React from "react"
import { cn } from '../../lib/utils'

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-agon-orange focus:ring-offset-2",
        {
          "border-transparent bg-agon-orange text-white hover:bg-agon-orange-hover": variant === "default",
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
