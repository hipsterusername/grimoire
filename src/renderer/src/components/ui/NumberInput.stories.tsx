import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { NumberInput } from './NumberInput'

const meta = {
  title: 'UI/NumberInput',
  component: NumberInput,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof NumberInput>

export default meta
type Story = StoryObj<typeof NumberInput>

// Interactive wrapper
function NumberInputDemo({
  initialValue = 10,
  min,
  max,
  label
}: {
  initialValue?: number
  min?: number
  max?: number
  label?: string
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <div className="w-48 space-y-2">
      <NumberInput value={value} onChange={setValue} min={min} max={max} label={label} />
      <p className="text-xs text-muted-foreground text-center">Current value: {value}</p>
    </div>
  )
}

export const Default: Story = {
  render: () => <NumberInputDemo />
}

export const WithLabel: Story = {
  render: () => <NumberInputDemo label="Hit Points" initialValue={20} />
}

export const WithMinMax: Story = {
  render: () => (
    <NumberInputDemo label="Armor Class" initialValue={15} min={1} max={30} />
  )
}

export const Initiative: Story = {
  render: () => (
    <NumberInputDemo label="Initiative" initialValue={0} min={0} max={99} />
  )
}

// Multiple inputs demo
function CharacterStatsDemo() {
  const [hp, setHp] = useState(45)
  const [maxHp, setMaxHp] = useState(45)
  const [ac, setAc] = useState(16)
  const [initiative, setInitiative] = useState(12)

  return (
    <div className="p-6 bg-secondary rounded-lg space-y-4 w-64">
      <h3 className="text-lg font-semibold mb-4">Character Stats</h3>

      <div className="grid grid-cols-2 gap-3">
        <NumberInput value={hp} onChange={setHp} min={0} max={maxHp} label="Current HP" />
        <NumberInput value={maxHp} onChange={setMaxHp} min={1} label="Max HP" />
      </div>

      <NumberInput value={ac} onChange={setAc} min={1} max={30} label="Armor Class" />

      <NumberInput value={initiative} onChange={setInitiative} min={0} max={99} label="Initiative" />

      <div className="pt-4 border-t border-border text-xs text-muted-foreground">
        <p>HP: {hp}/{maxHp}</p>
        <p>AC: {ac}</p>
        <p>Init: {initiative}</p>
      </div>
    </div>
  )
}

export const CharacterStats: Story = {
  render: () => <CharacterStatsDemo />
}

// Negative values demo
function NegativeValuesDemo() {
  const [modifier, setModifier] = useState(-2)

  return (
    <div className="w-48 space-y-2">
      <NumberInput value={modifier} onChange={setModifier} min={-5} max={10} label="Ability Modifier" />
      <p className="text-xs text-muted-foreground text-center">
        {modifier >= 0 ? '+' : ''}{modifier}
      </p>
    </div>
  )
}

export const NegativeValues: Story = {
  render: () => <NegativeValuesDemo />
}
