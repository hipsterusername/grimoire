import { useRef, useCallback, useEffect } from 'react'
import { Group, Rect, Circle, Line } from 'react-konva'
import type Konva from 'konva'
import { usePresentationStore, useCanvasStore } from '../../../stores'

interface PresentationBoundsProps {
  mapWidth: number
  mapHeight: number
}

const HANDLE_SIZE = 10
const MIN_SIZE = 100

export function PresentationBounds({ mapWidth, mapHeight }: PresentationBoundsProps) {
  const groupRef = useRef<Konva.Group>(null)

  const { bounds, setBounds, isPresenting } = usePresentationStore()
  const view = useCanvasStore((s) => s.view)
  const activeTool = useCanvasStore((s) => s.activeTool)

  // Only editable when the presentation-bounds tool is active
  const isEditable = activeTool === 'presentation-bounds'

  // Initialize bounds to center of map if not set
  useEffect(() => {
    if (bounds.width === 800 && bounds.height === 600 && bounds.x === 0 && bounds.y === 0) {
      setBounds({
        x: Math.max(0, (mapWidth - 800) / 2),
        y: Math.max(0, (mapHeight - 600) / 2),
        width: Math.min(800, mapWidth),
        height: Math.min(600, mapHeight)
      })
    }
  }, [mapWidth, mapHeight])

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const node = e.target
      const newX = Math.max(0, Math.min(mapWidth - bounds.width, node.x()))
      const newY = Math.max(0, Math.min(mapHeight - bounds.height, node.y()))

      setBounds({
        ...bounds,
        x: newX,
        y: newY
      })

      // Snap position
      node.position({ x: newX, y: newY })
    },
    [bounds, mapWidth, mapHeight, setBounds]
  )

  const handleResize = useCallback(
    (corner: 'nw' | 'ne' | 'se' | 'sw', e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const node = e.target
      const pos = node.position()

      let newBounds = { ...bounds }

      switch (corner) {
        case 'nw':
          newBounds = {
            x: Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            y: Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE)),
            width: bounds.x + bounds.width - Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            height: bounds.y + bounds.height - Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE))
          }
          break
        case 'ne':
          newBounds = {
            x: bounds.x,
            y: Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE)),
            width: Math.max(MIN_SIZE, Math.min(pos.x - bounds.x, mapWidth - bounds.x)),
            height: bounds.y + bounds.height - Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE))
          }
          break
        case 'se':
          newBounds = {
            x: bounds.x,
            y: bounds.y,
            width: Math.max(MIN_SIZE, Math.min(pos.x - bounds.x, mapWidth - bounds.x)),
            height: Math.max(MIN_SIZE, Math.min(pos.y - bounds.y, mapHeight - bounds.y))
          }
          break
        case 'sw':
          newBounds = {
            x: Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            y: bounds.y,
            width: bounds.x + bounds.width - Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            height: Math.max(MIN_SIZE, Math.min(pos.y - bounds.y, mapHeight - bounds.y))
          }
          break
      }

      setBounds(newBounds)
    },
    [bounds, mapWidth, mapHeight, setBounds]
  )

  if (!isPresenting) return null

  const handlePositions = {
    nw: { x: bounds.x, y: bounds.y },
    ne: { x: bounds.x + bounds.width, y: bounds.y },
    se: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    sw: { x: bounds.x, y: bounds.y + bounds.height }
  }

  return (
    <Group ref={groupRef}>
      {/* Darkened area outside the bounds */}
      {/* Top */}
      <Rect x={0} y={0} width={mapWidth} height={bounds.y} fill="rgba(0, 0, 0, 0.5)" listening={false} />
      {/* Bottom */}
      <Rect
        x={0}
        y={bounds.y + bounds.height}
        width={mapWidth}
        height={mapHeight - bounds.y - bounds.height}
        fill="rgba(0, 0, 0, 0.5)"
        listening={false}
      />
      {/* Left */}
      <Rect x={0} y={bounds.y} width={bounds.x} height={bounds.height} fill="rgba(0, 0, 0, 0.5)" listening={false} />
      {/* Right */}
      <Rect
        x={bounds.x + bounds.width}
        y={bounds.y}
        width={mapWidth - bounds.x - bounds.width}
        height={bounds.height}
        fill="rgba(0, 0, 0, 0.5)"
        listening={false}
      />

      {/* Center area - only draggable when editing */}
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        fill="transparent"
        stroke="#22d3ee"
        strokeWidth={2 / view.zoom}
        draggable={isEditable}
        listening={isEditable}
        onDragStart={(e) => { e.cancelBubble = true }}
        onDragEnd={handleDragEnd}
        onDragMove={(e) => { e.cancelBubble = true }}
      />

      {/* Border decoration */}
      <Line
        points={[bounds.x + 20, bounds.y, bounds.x, bounds.y, bounds.x, bounds.y + 20]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />
      <Line
        points={[bounds.x + bounds.width - 20, bounds.y, bounds.x + bounds.width, bounds.y, bounds.x + bounds.width, bounds.y + 20]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />
      <Line
        points={[bounds.x + bounds.width, bounds.y + bounds.height - 20, bounds.x + bounds.width, bounds.y + bounds.height, bounds.x + bounds.width - 20, bounds.y + bounds.height]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />
      <Line
        points={[bounds.x + 20, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height, bounds.x, bounds.y + bounds.height - 20]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />

      {/* Resize handles - only visible and draggable when editing */}
      {isEditable && (['nw', 'ne', 'se', 'sw'] as const).map((corner) => (
        <Circle
          key={corner}
          x={handlePositions[corner].x}
          y={handlePositions[corner].y}
          radius={HANDLE_SIZE / view.zoom}
          fill="#22d3ee"
          stroke="#fff"
          strokeWidth={2 / view.zoom}
          draggable
          onDragStart={(e) => { e.cancelBubble = true }}
          onDragEnd={(e) => handleResize(corner, e)}
          onDragMove={(e) => { e.cancelBubble = true }}
          cursor={corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize'}
        />
      ))}
    </Group>
  )
}
