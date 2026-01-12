import { useState, useEffect, useId } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
  id?: string
  className?: string
  'aria-describedby'?: string
}

/**
 * Number input that allows empty state while editing.
 * Only commits the value on blur, allowing users to clear and retype numbers.
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  label,
  id: providedId,
  className = '',
  'aria-describedby': ariaDescribedBy
}: NumberInputProps) {
  const generatedId = useId()
  const id = providedId ?? generatedId

  // Track the display value as a string to allow empty state while editing
  const [displayValue, setDisplayValue] = useState(value.toString())
  const [isFocused, setIsFocused] = useState(false)

  // Sync display value with prop when not focused
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value.toString())
    }
  }, [value, isFocused])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    // Allow empty string, digits, and negative sign at start
    if (newValue === '' || newValue === '-' || /^-?\d*$/.test(newValue)) {
      setDisplayValue(newValue)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)

    // Parse the value, defaulting to 0 if empty or invalid
    let numValue = parseInt(displayValue, 10)
    if (isNaN(numValue)) {
      numValue = 0
    }

    // Apply min/max constraints
    if (min !== undefined) {
      numValue = Math.max(min, numValue)
    }
    if (max !== undefined) {
      numValue = Math.min(max, numValue)
    }

    // Update display and notify parent
    setDisplayValue(numValue.toString())
    onChange(numValue)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    // Select all text on focus for easy replacement
    e.target.select()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Commit on Enter
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
    // Revert on Escape
    if (e.key === 'Escape') {
      setDisplayValue(value.toString())
      e.currentTarget.blur()
    }
  }

  const inputElement = (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="-?[0-9]*"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      aria-describedby={ariaDescribedBy}
      className={`w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  )

  if (label) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1">
          {label}
        </label>
        {inputElement}
      </div>
    )
  }

  return inputElement
}
