import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#175624] text-[#E5E6F9] font-medium shadow-xs hover:bg-[#12441d] active:scale-[0.99] transition-all dark:bg-[#dfb962] dark:text-[#080e0a] dark:font-semibold dark:hover:bg-[#eac36e] dark:shadow-md dark:shadow-[#dfb962]/20",
        gold:
          "bg-[#A4873E] text-white font-medium shadow-xs hover:bg-[#8f7433] active:scale-[0.99] transition-all dark:bg-[#dfb962] dark:text-[#080e0a] dark:font-semibold dark:hover:bg-[#eac36e]",
        pine:
          "bg-[#175624] text-white font-medium shadow-xs hover:bg-[#1b632a] active:scale-[0.99] transition-all dark:bg-[#34d399] dark:text-[#080e0a] dark:font-semibold dark:hover:bg-[#4ade80]",
        frost:
          "bg-[#E5E6F9] text-[#175624] border border-[#d2d4f2] font-medium hover:bg-[#d8daf5] active:scale-[0.99] transition-all dark:bg-[#E5E6F9]/15 dark:text-[#E5E6F9] dark:border-[#E5E6F9]/25 dark:hover:bg-[#E5E6F9]/25",
        outline:
          "border border-[#e2e4f0] bg-white text-[#333333] hover:bg-[#E5E6F9]/40 hover:text-[#175624] hover:border-[#A4873E]/40 active:scale-[0.99] transition-all dark:border-white/10 dark:bg-white/[0.04] dark:text-[#f5f7fa] dark:hover:bg-white/[0.08] dark:hover:text-white dark:hover:border-[#dfb962]/30",
        secondary:
          "bg-[#E5E6F9]/60 text-[#333333] hover:bg-[#E5E6F9] active:scale-[0.99] transition-all dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:border dark:border-white/[0.08]",
        ghost:
          "hover:bg-[#E5E6F9]/50 hover:text-[#175624] text-[#333333] transition-colors dark:text-[#9ca3af] dark:hover:bg-white/[0.06] dark:hover:text-white",
        destructive:
          "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 active:scale-[0.99] dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/25",
        link: "text-[#A4873E] underline-offset-4 hover:underline dark:text-[#dfb962]",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
