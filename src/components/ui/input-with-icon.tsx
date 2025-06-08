
import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, type, icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border-2 border-white/25 bg-white/8 py-3 text-base text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:border-white/45 hover:border-white/35 hover:bg-white/12 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm",
            icon && iconPosition === 'left' ? "pl-12 pr-4" : "px-4",
            icon && iconPosition === 'right' ? "pr-12 pl-4" : "px-4",
            className
          )}
          ref={ref}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70">
            {icon}
          </div>
        )}
      </div>
    )
  }
)
InputWithIcon.displayName = "InputWithIcon"

export { InputWithIcon }
