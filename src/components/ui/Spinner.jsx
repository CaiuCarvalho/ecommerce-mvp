import * as React from "react"
import { cn } from '../../lib/utils'
import { Loader2 } from "lucide-react"

const Spinner = React.forwardRef(({ className, size = "default", ...props }, ref) => {
  return (
    <Loader2
      ref={ref}
      className={cn(
        "animate-spin text-muted-foreground",
        {
          "h-4 w-4": size === "sm",
          "h-6 w-6": size === "default",
          "h-8 w-8": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
})
Spinner.displayName = "Spinner"

export { Spinner }
