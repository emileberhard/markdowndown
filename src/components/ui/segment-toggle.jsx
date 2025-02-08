import React from "react"
import { cn } from "@/lib/utils"

/**
 * options: Array<{ label: string, value: string }>
 * value: string (the currently selected option)
 * onChange: function(newValue: string)
 */
export function SegmentToggle({ options, value, onChange, className }) {
  return (
    <div className={cn("inline-flex items-center space-x-px rounded-md border border-gray-200 dark:border-gray-800", className)}>
      {options.map((opt, idx) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:focus-visible:ring-gray-300",
              // base styles
              "transition-colors whitespace-nowrap",
              // leftmost, rightmost border rounding if we want:
              idx === 0 ? "rounded-l-md" : "",
              idx === options.length - 1 ? "rounded-r-md" : "",
              // active vs inactive
              isActive
                ? "bg-gray-900 text-gray-50 dark:bg-gray-50 dark:text-gray-900"
                : "bg-white hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-50"
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
} 