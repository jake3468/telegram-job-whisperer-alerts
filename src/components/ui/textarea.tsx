
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-lg border-2 border-gray-500 bg-gray-700/70 px-4 py-3 text-base text-white ring-offset-background placeholder:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-blue focus-visible:ring-offset-2 focus-visible:border-pastel-blue hover:border-gray-400 hover:bg-gray-600/70 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 backdrop-blur-sm resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
