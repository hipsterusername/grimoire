import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactElement } from 'react'
import { useState, useCallback } from 'react'
import { Stage, Layer, Rect, Line } from 'react-konva'
import { Token } from './tokens/Token'
import { TokenHealthBar } from './tokens/TokenHealthBar'
import { FogOfWarLayer } from './layers/FogOfWarLayer'
import { TokenType, CreatureSize, type Token as TokenType_, type FogOfWar } from '../../types'

// Mock token factory
function createMockToken(overrides: Partial<TokenType_> = {}): TokenType_ {
  return {
    id: crypto.randomUUID(),
    name: 'Token',
    type: TokenType.PlayerCharacter,
    size: CreatureSize.Medium,
    gridX: 0,
    gridY: 0,
    color: '#3b82f6',
    stats: {
      maxHp: 30,
      currentHp: 30,
      tempHp: 0,
      armorClass: 15,
      initiativeModifier: 2
    },
    conditions: [],
    visible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }
}

// Grid rendering
function GridOverlay({
  width,
  height,
  gridSize
}: {
  width: number
  height: number
  gridSize: number
}) {
  const lines: ReactElement[] = []

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={1}
      />
    )
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={1}
      />
    )
  }

  return <>{lines}</>
}

// Full canvas playground component
function CanvasPlayground() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fogEnabled, setFogEnabled] = useState(false)
  const [tokens] = useState<TokenType_[]>([
    createMockToken({
      id: 'pc-1',
      name: 'Fighter',
      gridX: 2,
      gridY: 2,
      color: '#ef4444',
      stats: { maxHp: 45, currentHp: 45, tempHp: 0, armorClass: 18, initiativeModifier: 1 }
    }),
    createMockToken({
      id: 'pc-2',
      name: 'Wizard',
      gridX: 3,
      gridY: 3,
      color: '#3b82f6',
      stats: { maxHp: 22, currentHp: 18, tempHp: 5, armorClass: 12, initiativeModifier: 3 }
    }),
    createMockToken({
      id: 'pc-3',
      name: 'Rogue',
      gridX: 4,
      gridY: 2,
      color: '#22c55e',
      stats: { maxHp: 30, currentHp: 12, tempHp: 0, armorClass: 15, initiativeModifier: 5 }
    }),
    createMockToken({
      id: 'monster-1',
      name: 'Dragon',
      type: TokenType.Monster,
      size: CreatureSize.Large,
      gridX: 6,
      gridY: 3,
      color: '#dc2626',
      stats: { maxHp: 150, currentHp: 120, tempHp: 0, armorClass: 19, initiativeModifier: 1 }
    }),
    createMockToken({
      id: 'monster-2',
      name: 'Goblin',
      type: TokenType.Monster,
      gridX: 8,
      gridY: 2,
      color: '#65a30d',
      stats: { maxHp: 7, currentHp: 7, tempHp: 0, armorClass: 15, initiativeModifier: 2 }
    })
  ])

  const [fog] = useState<FogOfWar>({
    enabled: true,
    color: '#000000',
    opacity: 0.9,
    revealedAreas: [
      { id: 'r1', type: 'circle', x: 175, y: 175, radius: 120, createdAt: Date.now() }
    ],
    hiddenAreas: []
  })

  const gridSize = 50
  const canvasWidth = 600
  const canvasHeight = 400

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  const handleStageClick = useCallback((e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null)
    }
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Controls */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          padding: '12px',
          background: '#1f2937',
          borderRadius: '8px'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <input
            type="checkbox"
            checked={fogEnabled}
            onChange={(e) => setFogEnabled(e.target.checked)}
          />
          Fog of War
        </label>

        <span style={{ color: '#9ca3af', fontSize: '14px' }}>
          Selected: {selectedId ? tokens.find((t) => t.id === selectedId)?.name : 'None'}
        </span>

        <span style={{ color: '#6b7280', fontSize: '12px', marginLeft: 'auto' }}>
          Click tokens to select, drag to move (in real app)
        </span>
      </div>

      {/* Canvas */}
      <div style={{ background: '#374151', borderRadius: '8px', overflow: 'hidden' }}>
        <Stage
          width={canvasWidth}
          height={canvasHeight}
          onClick={handleStageClick}
          onTap={handleStageClick}
        >
          {/* Background */}
          <Layer listening={false}>
            <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#4a5568" />
          </Layer>

          {/* Grid */}
          <Layer listening={false}>
            <GridOverlay width={canvasWidth} height={canvasHeight} gridSize={gridSize} />
          </Layer>

          {/* Tokens */}
          <Layer>
            {tokens.map((token) => (
              <Token
                key={token.id}
                token={token}
                gridSize={gridSize}
                isSelected={token.id === selectedId}
                onSelect={handleSelect}
              />
            ))}
          </Layer>

          {/* Fog of War */}
          {fogEnabled && (
            <FogOfWarLayer
              fogOfWar={fog}
              mapWidth={canvasWidth}
              mapHeight={canvasHeight}
            />
          )}
        </Stage>
      </div>

      {/* Token list */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          background: '#1f2937',
          borderRadius: '8px'
        }}
      >
        <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '14px' }}>Tokens</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {tokens.map((token) => (
            <div
              key={token.id}
              style={{
                padding: '8px',
                background: token.id === selectedId ? '#374151' : '#111827',
                borderRadius: '6px',
                border: token.id === selectedId ? '1px solid #3b82f6' : '1px solid transparent',
                cursor: 'pointer'
              }}
              onClick={() => handleSelect(token.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: token.color
                  }}
                />
                <span style={{ color: 'white', fontSize: '13px' }}>{token.name}</span>
              </div>
              <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px' }}>
                HP: {token.stats.currentHp}
                {token.stats.tempHp > 0 && `+${token.stats.tempHp}`}/{token.stats.maxHp} | AC:{' '}
                {token.stats.armorClass}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const meta = {
  title: 'Canvas/Playground',
  component: CanvasPlayground,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Interactive playground demonstrating the battle map canvas with tokens, grid, and fog of war. This showcases how all canvas components work together.'
      }
    }
  },
  tags: ['autodocs']
} satisfies Meta<typeof CanvasPlayground>

export default meta
type Story = StoryObj<typeof CanvasPlayground>

export const Default: Story = {
  render: () => <CanvasPlayground />
}

// Health bar showcase
function HealthBarShowcase() {
  const healthStates = [
    { label: 'Full HP', current: 50, max: 50, temp: 0 },
    { label: 'Bloodied', current: 25, max: 50, temp: 0 },
    { label: 'Critical', current: 8, max: 50, temp: 0 },
    { label: 'With Temp HP', current: 35, max: 50, temp: 15 },
    { label: 'Low + Temp', current: 10, max: 50, temp: 20 }
  ]

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: 'white', marginBottom: '16px' }}>Health Bar States</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {healthStates.map((state) => (
          <div
            key={state.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              background: '#374151',
              padding: '16px',
              borderRadius: '8px'
            }}
          >
            <span style={{ color: 'white', width: '120px' }}>{state.label}</span>
            <Stage width={100} height={30}>
              <Layer>
                <TokenHealthBar
                  currentHp={state.current}
                  maxHp={state.max}
                  tempHp={state.temp}
                  width={80}
                  x={10}
                  y={5}
                />
              </Layer>
            </Stage>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
              {state.current}
              {state.temp > 0 && `+${state.temp}`}/{state.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const HealthBars: Story = {
  render: () => <HealthBarShowcase />,
  parameters: {
    backgrounds: { default: 'dark' }
  }
}

// Token sizes showcase
function TokenSizesShowcase() {
  const sizes = [
    { size: CreatureSize.Tiny, name: 'Sprite', gridUnits: 0.5, color: '#ec4899' },
    { size: CreatureSize.Small, name: 'Goblin', gridUnits: 1, color: '#22c55e' },
    { size: CreatureSize.Medium, name: 'Human', gridUnits: 1, color: '#3b82f6' },
    { size: CreatureSize.Large, name: 'Ogre', gridUnits: 2, color: '#f97316' },
    { size: CreatureSize.Huge, name: 'Giant', gridUnits: 3, color: '#a855f7' },
    { size: CreatureSize.Gargantuan, name: 'Dragon', gridUnits: 4, color: '#ef4444' }
  ]

  const gridSize = 40

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ color: 'white', marginBottom: '16px' }}>Token Sizes</h2>
      <div style={{ background: '#374151', padding: '20px', borderRadius: '8px' }}>
        <Stage width={700} height={350}>
          <Layer listening={false}>
            <Rect x={0} y={0} width={700} height={350} fill="#4a5568" />
            <GridOverlay width={700} height={350} gridSize={gridSize} />
          </Layer>
          <Layer>
            {sizes.map((s, i) => {
              const token = createMockToken({
                id: `size-${i}`,
                name: s.name,
                size: s.size,
                color: s.color,
                gridX: i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 2 : i === 3 ? 3 : i === 4 ? 5 : 8,
                gridY: i < 3 ? 1 : 1,
                stats: { maxHp: 50, currentHp: 50, tempHp: 0, armorClass: 15, initiativeModifier: 0 }
              })
              return (
                <Token
                  key={token.id}
                  token={token}
                  gridSize={gridSize}
                  isSelected={false}
                  onSelect={() => {}}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>

      <div
        style={{
          marginTop: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px'
        }}
      >
        {sizes.map((s) => (
          <div
            key={s.size}
            style={{
              padding: '8px',
              background: '#1f2937',
              borderRadius: '6px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: s.color,
                margin: '0 auto 8px'
              }}
            />
            <div style={{ color: 'white', fontSize: '12px' }}>{s.size}</div>
            <div style={{ color: '#6b7280', fontSize: '10px' }}>{s.gridUnits}x{s.gridUnits}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const TokenSizes: Story = {
  render: () => <TokenSizesShowcase />,
  parameters: {
    backgrounds: { default: 'dark' }
  }
}
