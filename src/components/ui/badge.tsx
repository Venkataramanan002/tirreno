import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1.5 tahoe-text font-semibold tahoe-transition focus:outline-none relative z-10",
  {
    variants: {
      variant: {
        default:
          "tahoe-glass border-[rgba(255,255,255,0.35)] tahoe-text",
        secondary:
          "tahoe-glass border-[rgba(255,255,255,0.25)] tahoe-text",
        destructive:
          "tahoe-glass border-red-500/40 text-red-400",
        outline: "tahoe-glass border-[rgba(255,255,255,0.35)] tahoe-text",
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
