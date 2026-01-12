import { TOKEN_COLORS } from '../../lib/constants'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  colors?: readonly { hex: string; name: string }[]
}

/**
 * Reusable color picker component for selecting token colors.
 * Displays a grid of color swatches with accessible keyboard navigation.
 */
export function ColorPicker({
  value,
  onChange,
  label = 'Color',
  colors = TOKEN_COLORS
}: ColorPickerProps) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`${label} selection`}>
        {colors.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => onChange(c.hex)}
            className={`w-9 h-9 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
              value === c.hex ? 'ring-2 ring-white ring-offset-2 ring-offset-secondary scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: c.hex }}
            role="radio"
            aria-checked={value === c.hex}
            aria-label={c.name}
          />
        ))}
      </div>
    </fieldset>
  )
}
