import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, Layer } from 'react-konva'
import { TokenHealthBar } from './TokenHealthBar'

// Wrapper component that provides Konva Stage context
function KonvaWrapper({
  children,
  width = 200,
  height = 60
}: {
  children: React.ReactNode
  width?: number
  height?: number
}) {
  return (
    <div style={{ background: '#374151', padding: '20px', borderRadius: '8px' }}>
      <Stage width={width} height={height}>
        <Layer>{children}</Layer>
      </Stage>
    </div>
  )
}

const meta = {
  title: 'Canvas/TokenHealthBar',
  component: TokenHealthBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Health bar displayed below tokens showing current HP, temp HP, and max HP.'
      }
    }
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <KonvaWrapper>
        <Story />
      </KonvaWrapper>
    )
  ]
} satisfies Meta<typeof TokenHealthBar>

export default meta
type Story = StoryObj<typeof TokenHealthBar>

// Full health (green bar)
export const FullHealth: Story = {
  args: {
    currentHp: 45,
    maxHp: 45,
    tempHp: 0,
    width: 60,
    x: 10,
    y: 10
  }
}

// High health > 50% (green bar)
export const HighHealth: Story = {
  args: {
    currentHp: 35,
    maxHp: 50,
    tempHp: 0,
    width: 60,
    x: 10,
    y: 10
  }
}

// Medium health 25-50% (yellow bar)
export const MediumHealth: Story = {
  args: {
    currentHp: 18,
    maxHp: 50,
    tempHp: 0,
    width: 60,
    x: 10,
    y: 10
  }
}

// Low health < 25% (red bar)
export const LowHealth: Story = {
  args: {
    currentHp: 8,
    maxHp: 50,
    tempHp: 0,
    width: 60,
    x: 10,
    y: 10
  }
}

// Critical health (almost dead)
export const CriticalHealth: Story = {
  args: {
    currentHp: 1,
    maxHp: 50,
    tempHp: 0,
    width: 60,
    x: 10,
    y: 10
  }
}

// Zero HP (knocked out)
export const ZeroHealth: Story = {
  args: {
    currentHp: 0,
    maxHp: 45,
    tempHp: 0,
    width: 60,
    x: 10,
    y: 10
  }
}

// With temporary HP (cyan extension)
export const WithTempHP: Story = {
  args: {
    currentHp: 30,
    maxHp: 45,
    tempHp: 10,
    width: 60,
    x: 10,
    y: 10
  }
}

// Low health with temp HP
export const LowWithTempHP: Story = {
  args: {
    currentHp: 10,
    maxHp: 50,
    tempHp: 15,
    width: 60,
    x: 10,
    y: 10
  }
}

// Wider bar (for larger creatures)
export const WideBar: Story = {
  args: {
    currentHp: 80,
    maxHp: 120,
    tempHp: 20,
    width: 120,
    x: 10,
    y: 10
  },
  decorators: [
    (Story) => (
      <KonvaWrapper width={300} height={60}>
        <Story />
      </KonvaWrapper>
    )
  ]
}

// Comparison of all health states
function HealthStatesComparison() {
  const states = [
    { label: 'Full', current: 50, max: 50, temp: 0, y: 5 },
    { label: 'High', current: 40, max: 50, temp: 0, y: 35 },
    { label: 'Medium', current: 20, max: 50, temp: 0, y: 65 },
    { label: 'Low', current: 10, max: 50, temp: 0, y: 95 },
    { label: 'Critical', current: 3, max: 50, temp: 0, y: 125 },
    { label: 'With Temp', current: 30, max: 50, temp: 15, y: 155 }
  ]

  return (
    <div style={{ background: '#374151', padding: '20px', borderRadius: '8px' }}>
      <Stage width={200} height={200}>
        <Layer>
          {states.map((state) => (
            <TokenHealthBar
              key={state.label}
              currentHp={state.current}
              maxHp={state.max}
              tempHp={state.temp}
              width={80}
              x={60}
              y={state.y}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export const AllStates: Story = {
  render: () => <HealthStatesComparison />,
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all health bar states from full to critical with temp HP.'
      }
    }
  }
}
