import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-[#d5d8eb] bg-white px-3 py-1.5 text-sm text-[#333333] placeholder:text-[#999999] transition-all outline-none focus-visible:border-[#A4873E] focus-visible:ring-3 focus-visible:ring-[#A4873E]/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1] dark:bg-[#080e0a]/70 dark:text-[#f5f7fa] dark:placeholder:text-slate-500 dark:focus-visible:border-[#dfb962] dark:focus-visible:ring-[#dfb962]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
