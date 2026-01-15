import type { Meta, StoryObj } from '@storybook/react-vite'
import { Stage, Layer, Rect, Circle, Text } from 'react-konva'
import { FogOfWarLayer } from './FogOfWarLayer'
import type { FogOfWar, FogRevealArea } from '../../../types'

// Helper to create fog reveal areas
function createCircleReveal(
  x: number,
  y: number,
  radius: number,
  id: string = crypto.randomUUID()
): FogRevealArea {
  return {
    id,
    type: 'circle',
    x,
    y,
    radius,
    createdAt: Date.now()
  }
}

function createRectReveal(
  x: number,
  y: number,
  width: number,
  height: number,
  id: string = crypto.randomUUID()
): FogRevealArea {
  return {
    id,
    type: 'rectangle',
    x,
    y,
    width,
    height,
    createdAt: Date.now()
  }
}

// Create mock fog configurations
function createMockFog(overrides: Partial<FogOfWar> = {}): FogOfWar {
  return {
    enabled: true,
    color: '#000000',
    opacity: 0.95,
    revealedAreas: [],
    hiddenAreas: [],
    ...overrides
  }
}

// Background with sample content to show through fog
function MapBackground({ width, height }: { width: number; height: number }) {
  const gridSize = 50
  const cols = Math.ceil(width / gridSize)
  const rows = Math.ceil(height / gridSize)

  return (
    <Layer listening={false}>
      {/* Background */}
      <Rect x={0} y={0} width={width} height={height} fill="#4a5568" />

      {/* Grid */}
      {Array.from({ length: cols }).map((_, col) =>
        Array.from({ length: rows }).map((_, row) => (
          <Rect
            key={`${col}-${row}`}
            x={col * gridSize}
            y={row * gridSize}
            width={gridSize}
            height={gridSize}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
          />
        ))
      )}

      {/* Sample tokens to show through revealed areas */}
      <Circle x={150} y={150} radius={20} fill="#3b82f6" />
      <Text x={140} y={180} text="PC" fill="white" fontSize={10} />

      <Circle x={300} y={200} radius={20} fill="#ef4444" />
      <Text x={285} y={230} text="Enemy" fill="white" fontSize={10} />

      <Circle x={200} y={300} radius={25} fill="#22c55e" />
      <Text x={185} y={335} text="NPC" fill="white" fontSize={10} />
    </Layer>
  )
}

// Wrapper component that provides full canvas context
function FogCanvasWrapper({
  fog,
  width = 400,
  height = 400
}: {
  fog: FogOfWar
  width?: number
  height?: number
}) {
  return (
    <div style={{ background: '#1f2937', padding: '10px', borderRadius: '8px' }}>
      <Stage width={width} height={height}>
        <MapBackground width={width} height={height} />
        <FogOfWarLayer fogOfWar={fog} mapWidth={width} mapHeight={height} />
      </Stage>
    </div>
  )
}

const meta = {
  title: 'Canvas/FogOfWarLayer',
  component: FogOfWarLayer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Fog of War layer that covers the map and can be revealed/hidden by the DM. Supports circle, rectangle, and polygon reveal shapes.'
      }
    }
  },
  tags: ['autodocs']
} satisfies Meta<typeof FogOfWarLayer>

export default meta
type Story = StoryObj<typeof FogOfWarLayer>

// Fog disabled (no fog visible)
export const Disabled: Story = {
  render: () => <FogCanvasWrapper fog={createMockFog({ enabled: false })} />,
  parameters: {
    docs: {
      description: {
        story: 'When fog is disabled, the entire map is visible.'
      }
    }
  }
}

// Full fog (nothing revealed)
export const FullFog: Story = {
  render: () => <FogCanvasWrapper fog={createMockFog()} />,
  parameters: {
    docs: {
      description: {
        story: 'Full fog coverage - players see nothing until DM reveals areas.'
      }
    }
  }
}

// Single circle reveal
export const CircleReveal: Story = {
  render: () => (
    <FogCanvasWrapper
      fog={createMockFog({
        revealedAreas: [createCircleReveal(150, 150, 60)]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'A circular area revealed around a point (e.g., torch light).'
      }
    }
  }
}

// Multiple circle reveals
export const MultipleCircleReveals: Story = {
  render: () => (
    <FogCanvasWrapper
      fog={createMockFog({
        revealedAreas: [
          createCircleReveal(150, 150, 50),
          createCircleReveal(300, 200, 60),
          createCircleReveal(200, 300, 40)
        ]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple revealed areas from different light sources or explored regions.'
      }
    }
  }
}

// Rectangle reveal
export const RectangleReveal: Story = {
  render: () => (
    <FogCanvasWrapper
      fog={createMockFog({
        revealedAreas: [createRectReveal(100, 100, 200, 150)]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'A rectangular revealed area (e.g., a room).'
      }
    }
  }
}

// Mixed reveal shapes
export const MixedShapes: Story = {
  render: () => (
    <FogCanvasWrapper
      fog={createMockFog({
        revealedAreas: [
          createCircleReveal(100, 100, 40),
          createRectReveal(180, 80, 150, 100),
          createCircleReveal(300, 300, 50)
        ]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Combination of circle and rectangle reveals for complex dungeon layouts.'
      }
    }
  }
}

// Reveal then hide (showing chronological order works)
export const RevealThenHide: Story = {
  render: () => {
    const baseTime = Date.now()
    return (
      <FogCanvasWrapper
        fog={createMockFog({
          revealedAreas: [
            { id: '1', type: 'rectangle', x: 100, y: 100, width: 200, height: 200, createdAt: baseTime }
          ],
          hiddenAreas: [
            { id: '2', type: 'circle', x: 200, y: 200, radius: 40, createdAt: baseTime + 100 }
          ]
        })}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates reveal-then-hide: a rectangle is revealed, then a circle in the center is hidden again.'
      }
    }
  }
}

// Custom fog color (dark blue for underwater)
export const CustomColor: Story = {
  render: () => (
    <FogCanvasWrapper
      fog={createMockFog({
        color: '#1e3a5f',
        opacity: 0.9,
        revealedAreas: [createCircleReveal(200, 200, 80)]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom fog color for themed environments (e.g., underwater, smoke).'
      }
    }
  }
}

// Lower opacity fog (misty)
export const MistyFog: Story = {
  render: () => (
    <FogCanvasWrapper
      fog={createMockFog({
        opacity: 0.6,
        revealedAreas: [createCircleReveal(200, 200, 100)]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Lower opacity fog for light mist or partial concealment effects.'
      }
    }
  }
}

// Corridor exploration pattern
export const CorridorExploration: Story = {
  render: () => (
    <FogCanvasWrapper
      width={500}
      height={400}
      fog={createMockFog({
        revealedAreas: [
          // Starting room
          createRectReveal(20, 150, 80, 100),
          // Corridor
          createRectReveal(100, 175, 150, 50),
          // Second room
          createRectReveal(250, 125, 100, 150),
          // Continuing corridor
          createRectReveal(350, 175, 100, 50)
        ]
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Typical dungeon exploration pattern with rooms connected by corridors.'
      }
    }
  }
}
