import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import { TOKEN_COLORS } from '../../lib/constants'

const meta = {
  title: 'UI/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof ColorPicker>

export default meta
type Story = StoryObj<typeof ColorPicker>

// Interactive wrapper
function ColorPickerDemo({
  label = 'Token Color',
  initialColor = TOKEN_COLORS[0].hex
}: {
  label?: string
  initialColor?: string
}) {
  const [color, setColor] = useState(initialColor)

  return (
    <div className="p-6 bg-secondary rounded-lg w-80">
      <ColorPicker value={color} onChange={setColor} label={label} />

      <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full" style={{ backgroundColor: color }} />
        <div className="text-sm">
          <p className="text-foreground font-medium">
            {TOKEN_COLORS.find((c) => c.hex === color)?.name || 'Custom'}
          </p>
          <p className="text-muted-foreground">{color}</p>
        </div>
      </div>
    </div>
  )
}

export const Default: Story = {
  render: () => <ColorPickerDemo />
}

export const WithDifferentLabel: Story = {
  render: () => <ColorPickerDemo label="Border Color" />
}

// Custom colors demo
const CUSTOM_COLORS = [
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#8b5cf6', name: 'Purple' }
] as const

function CustomColorsDemo() {
  const [color, setColor] = useState<string>(CUSTOM_COLORS[0].hex)

  return (
    <div className="p-6 bg-secondary rounded-lg">
      <ColorPicker value={color} onChange={setColor} label="Theme Color" colors={CUSTOM_COLORS} />

      <div className="mt-4 text-sm text-muted-foreground">
        Selected: {CUSTOM_COLORS.find((c) => c.hex === color)?.name}
      </div>
    </div>
  )
}

export const CustomColors: Story = {
  render: () => <CustomColorsDemo />
}

// Token preview demo
function TokenPreviewDemo() {
  const [color, setColor] = useState<string>(TOKEN_COLORS[2].hex)

  return (
    <div className="p-6 bg-secondary rounded-lg w-80">
      <div className="mb-6">
        <ColorPicker value={color} onChange={setColor} label="Token Color" />
      </div>

      {/* Token preview */}
      <div className="p-4 bg-canvas rounded-lg">
        <p className="text-xs text-muted-foreground mb-3">Preview</p>
        <div className="flex items-center gap-4">
          {/* Token circle */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg"
            style={{ backgroundColor: color }}
          >
            G
          </div>
          <div>
            <p className="font-medium">Goblin</p>
            <p className="text-xs text-muted-foreground">Small Monster</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const TokenPreview: Story = {
  render: () => <TokenPreviewDemo />
}

// All token colors display
export const AllTokenColors: Story = {
  render: () => (
    <div className="p-6 bg-secondary rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Available Token Colors</h3>
      <div className="grid grid-cols-4 gap-4">
        {TOKEN_COLORS.map((c) => (
          <div key={c.hex} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: c.hex }} />
            <div className="text-sm">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.hex}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
