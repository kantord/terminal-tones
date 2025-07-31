"use client"

import * as React from "react"
import { 
  getAvailableFlavors, 
  getFlavorMetadata,
  type FlavorName 
} from '@terminal-tones/theme-generator'
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"

interface FlavorComboboxProps {
  value?: FlavorName | null
  onValueChange?: (value: FlavorName) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function FlavorCombobox({
  value,
  onValueChange,
  placeholder = "Select a flavor...",
  disabled = false,
  className,
}: FlavorComboboxProps) {
  const availableFlavors = getAvailableFlavors()
  
  // Convert flavors to combobox options
  const options: ComboboxOption[] = React.useMemo(() => {
    return availableFlavors.map((flavorName) => {
      const metadata = getFlavorMetadata(flavorName)
      return {
        value: flavorName,
        label: metadata?.scheme || flavorName,
        searchableText: `${metadata?.scheme || flavorName} ${metadata?.author || ''} ${flavorName}`.toLowerCase(),
      }
    })
  }, [availableFlavors])
  
  const handleValueChange = (newValue: string) => {
    if (newValue && onValueChange) {
      onValueChange(newValue as FlavorName)
    }
  }
  
  const selectedOption = options.find(option => option.value === value)
  
  return (
    <div className={className}>
      <Combobox
        options={options}
        value={value || ""}
        onValueChange={handleValueChange}
        placeholder={placeholder}
        searchPlaceholder="Search flavors (e.g., gruvbox, solarized, monokai)..."
        emptyMessage="No flavors found."
        disabled={disabled}
      />
      
      {selectedOption && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {getFlavorMetadata(value!)?.author && (
              <span>by {getFlavorMetadata(value!)?.author}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}