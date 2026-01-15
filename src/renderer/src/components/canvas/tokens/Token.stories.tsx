import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, Layer } from 'react-konva'
import { Token } from './Token'
import { TokenType, CreatureSize, type Token as TokenType_ } from '../../../types'

// Create a mock token for stories
function createMockToken(overrides: Partial<TokenType_> = {}): TokenType_ {
  return {
    id: 'token-1',
    name: 'Aragorn',
    type: TokenType.PlayerCharacter,
    size: CreatureSize.Medium,
    gridX: 1,
    gridY: 1,
    color: '#3b82f6',
    stats: {
      maxHp: 45,
      currentHp: 45,
      tempHp: 0,
      armorClass: 17,
      initiativeModifier: 2
    },
    conditions: [],
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

// Wrapper component that provides Konva Stage context
function KonvaWrapper({
  children,
  width = 400,
  height = 300
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
  title: 'Canvas/Token',
  component: Token,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Token component for rendering creatures on the battle map canvas.'
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
} satisfies Meta<typeof Token>

export default meta
type Story = StoryObj<typeof Token>

// Basic token without image
export const Default: Story = {
  args: {
    token: createMockToken(),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Selected token with selection ring
export const Selected: Story = {
  args: {
    token: createMockToken({ name: 'Gandalf' }),
    gridSize: 50,
    isSelected: true,
    onSelect: () => {}
  }
}

// Token with low HP (yellow border)
export const LowHealth: Story = {
  args: {
    token: createMockToken({
      name: 'Wounded Fighter',
      color: '#ef4444',
      stats: {
        maxHp: 40,
        currentHp: 15, // 37.5% HP - yellow
        tempHp: 0,
        armorClass: 16,
        initiativeModifier: 1
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Token with critical HP (red border)
export const CriticalHealth: Story = {
  args: {
    token: createMockToken({
      name: 'Dying Warrior',
      color: '#dc2626',
      stats: {
        maxHp: 50,
        currentHp: 8, // 16% HP - red
        tempHp: 0,
        armorClass: 14,
        initiativeModifier: 0
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Token with temporary HP
export const WithTempHP: Story = {
  args: {
    token: createMockToken({
      name: 'Buffed Paladin',
      color: '#8b5cf6',
      stats: {
        maxHp: 45,
        currentHp: 45,
        tempHp: 10,
        armorClass: 18,
        initiativeModifier: 0
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Monster token
export const Monster: Story = {
  args: {
    token: createMockToken({
      id: 'monster-1',
      name: 'Goblin',
      type: TokenType.Monster,
      color: '#22c55e',
      stats: {
        maxHp: 7,
        currentHp: 7,
        tempHp: 0,
        armorClass: 15,
        initiativeModifier: 2
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Large creature (2x2)
export const LargeCreature: Story = {
  args: {
    token: createMockToken({
      name: 'Ogre',
      type: TokenType.Monster,
      size: CreatureSize.Large,
      color: '#b45309',
      stats: {
        maxHp: 59,
        currentHp: 59,
        tempHp: 0,
        armorClass: 11,
        initiativeModifier: -1
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  },
  decorators: [
    (Story) => (
      <KonvaWrapper width={500} height={400}>
        <Story />
      </KonvaWrapper>
    )
  ]
}

// Huge creature (3x3)
export const HugeCreature: Story = {
  args: {
    token: createMockToken({
      name: 'Giant',
      type: TokenType.Monster,
      size: CreatureSize.Huge,
      color: '#7c3aed',
      stats: {
        maxHp: 126,
        currentHp: 126,
        tempHp: 0,
        armorClass: 13,
        initiativeModifier: 0
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  },
  decorators: [
    (Story) => (
      <KonvaWrapper width={600} height={500}>
        <Story />
      </KonvaWrapper>
    )
  ]
}

// Tiny creature (0.5x0.5)
export const TinyCreature: Story = {
  args: {
    token: createMockToken({
      name: 'Sprite',
      type: TokenType.Monster,
      size: CreatureSize.Tiny,
      color: '#ec4899',
      stats: {
        maxHp: 2,
        currentHp: 2,
        tempHp: 0,
        armorClass: 15,
        initiativeModifier: 4
      }
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Hidden/invisible token
export const Hidden: Story = {
  args: {
    token: createMockToken({
      name: 'Shadow',
      color: '#6b7280',
      visible: false
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Token with conditions
export const WithConditions: Story = {
  args: {
    token: createMockToken({
      name: 'Afflicted Mage',
      color: '#0ea5e9',
      conditions: [
        { id: 'c1', name: 'Poisoned', color: '#22c55e' },
        { id: 'c2', name: 'Stunned', color: '#eab308' },
        { id: 'c3', name: 'Frightened', color: '#a855f7' }
      ]
    }),
    gridSize: 50,
    isSelected: false,
    onSelect: () => {}
  }
}

// Multiple tokens showcase
function MultipleTokensDemo() {
  const tokens = [
    createMockToken({ id: '1', name: 'Fighter', gridX: 0, gridY: 0, color: '#ef4444' }),
    createMockToken({ id: '2', name: 'Wizard', gridX: 2, gridY: 0, color: '#3b82f6' }),
    createMockToken({ id: '3', name: 'Rogue', gridX: 1, gridY: 2, color: '#22c55e' }),
    createMockToken({
      id: '4',
      name: 'Dragon',
      type: TokenType.Monster,
      size: CreatureSize.Large,
      gridX: 3,
      gridY: 1,
      color: '#dc2626',
      stats: { maxHp: 180, currentHp: 120, tempHp: 0, armorClass: 19, initiativeModifier: 1 }
    })
  ]

  return (
    <div style={{ background: '#374151', padding: '20px', borderRadius: '8px' }}>
      <Stage width={500} height={350}>
        <Layer>
          {tokens.map((token) => (
            <Token
              key={token.id}
              token={token}
              gridSize={50}
              isSelected={token.id === '2'}
              onSelect={() => {}}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}

export const MultipleTokens: Story = {
  render: () => <MultipleTokensDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Multiple tokens on a canvas including a Large creature.'
      }
    }
  }
}
