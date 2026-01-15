import { useRef, useState, useEffect } from 'react'
import { TOKEN_COLORS } from '../../lib/constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  colors?: readonly { hex: string; name: string }[]
  /** Allow custom color selection beyond the palette */
  allowCustom?: boolean
}

/**
 * Check if a color is in the predefined palette
 */
function isInPalette(color: string, palette: readonly { hex: string; name: string }[]): boolean {
  return palette.some((c) => c.hex.toLowerCase() === color.toLowerCase())
}

/**
 * Reusable color picker component for selecting token colors.
 * Displays a grid of color swatches with accessible keyboard navigation.
 * Optionally allows custom color selection via native color picker.
 */
export function ColorPicker({
  value,
  onChange,
  label = 'Color',
  colors = TOKEN_COLORS,
  allowCustom = true
}: ColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customHexInput, setCustomHexInput] = useState('')

  // Track if current value is a custom color (not in palette)
  const isCustomColor = !isInPalette(value, colors)

  // Sync hex input with current value when it changes externally
  useEffect(() => {
    if (isCustomColor) {
      setCustomHexInput(value.toUpperCase())
    }
  }, [value, isCustomColor])

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    onChange(newColor)
    setCustomHexInput(newColor.toUpperCase())
  }

  const handleCustomButtonClick = () => {
    // Open the native color picker
    colorInputRef.current?.click()
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.toUpperCase()
    // Ensure it starts with #
    if (!input.startsWith('#')) {
      input = '#' + input.replace('#', '')
    }
    // Limit to valid hex characters
    input = input.replace(/[^#0-9A-F]/g, '').slice(0, 7)
    setCustomHexInput(input)

    // Only update if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(input)) {
      onChange(input)
    }
  }

  const handleHexInputBlur = () => {
    // On blur, reset to current value if invalid
    if (!/^#[0-9A-F]{6}$/i.test(customHexInput)) {
      setCustomHexInput(value.toUpperCase())
    }
    setShowCustomInput(false)
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`${label} selection`}>
        {/* Preset color swatches */}
        {colors.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            className={`w-8 h-8 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
              value.toLowerCase() === c.hex.toLowerCase()
                ? 'ring-2 ring-white ring-offset-2 ring-offset-secondary scale-110'
                : 'hover:scale-105'
            }`}
            style={{ backgroundColor: c.hex }}
            role="radio"
            aria-checked={value.toLowerCase() === c.hex.toLowerCase()}
            aria-label={c.name}
          />
        ))}

        {/* Custom color picker */}
        {allowCustom && (
          <div className="relative">
            <button
              type="button"
              onClick={handleCustomButtonClick}
              className={`w-8 h-8 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
                isCustomColor
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-secondary scale-110'
                  : 'hover:scale-105 border-2 border-dashed border-muted-foreground/40 hover:border-muted-foreground/60'
              }`}
              style={isCustomColor ? { backgroundColor: value } : undefined}
              role="radio"
              aria-checked={isCustomColor}
              aria-label={isCustomColor ? `Custom color: ${value}` : 'Choose custom color'}
            >
              {!isCustomColor && (
                <span className="flex items-center justify-center w-full h-full">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground/60"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 0 0 20" fill="currentColor" opacity="0.6" />
                  </svg>
                </span>
              )}
            </button>

            {/* Hidden native color input */}
            <input
              ref={colorInputRef}
              type="color"
              value={value}
              onChange={handleColorInputChange}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        )}
      </div>

      {/* Hex input row - shown when custom color is active */}
      {allowCustom && isCustomColor && (
        <div className="mt-3 flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-border/60"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
          {showCustomInput ? (
            <input
              type="text"
              value={customHexInput}
              onChange={handleHexInputChange}
              onBlur={handleHexInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
              className="w-20 px-2 py-1 text-xs font-mono bg-muted rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring uppercase"
              placeholder="#000000"
              maxLength={7}
              autoFocus
              aria-label="Hex color code"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustomHexInput(value.toUpperCase())
                setShowCustomInput(true)
              }}
              className="px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded transition-colors"
              aria-label="Edit hex color code"
            >
              {value.toUpperCase()}
            </button>
          )}
          <button
            type="button"
            onClick={handleCustomButtonClick}
            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted/60 transition-colors"
            aria-label="Open color picker"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      )}
    </fieldset>
  )
}
