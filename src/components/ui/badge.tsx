import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 tahoe-text font-semibold tahoe-transition focus:outline-none relative z-10",
  {
    variants: {
      variant: {
        default:
          "tahoe-glass border-white/25 text-white",
        secondary:
          "tahoe-glass border-white/20 text-white/90",
        destructive:
          "bg-gradient-to-b from-red-500/25 to-red-500/20 backdrop-filter blur(20px) border-red-500/50 text-red-300",
        outline: "tahoe-glass border-white/25 text-white/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
