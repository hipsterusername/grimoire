import { useRef, useCallback, useEffect, useState } from 'react'
import { Group, Rect, Circle, Line } from 'react-konva'
import type Konva from 'konva'
import { usePresentationStore, useCanvasStore } from '../../../stores'
import type { PresentationBounds as PresentationBoundsType } from '../../../stores/presentation-store'

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

  // Preview bounds during drag operations for live feedback
  const [previewBounds, setPreviewBounds] = useState<PresentationBoundsType | null>(null)

  // Use preview bounds during drag, otherwise use store bounds
  const displayBounds = previewBounds ?? bounds

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

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const node = e.target
      const newX = Math.max(0, Math.min(mapWidth - bounds.width, node.x()))
      const newY = Math.max(0, Math.min(mapHeight - bounds.height, node.y()))

      setPreviewBounds({
        ...bounds,
        x: newX,
        y: newY
      })
    },
    [bounds, mapWidth, mapHeight]
  )

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const node = e.target
      const newX = Math.max(0, Math.min(mapWidth - bounds.width, node.x()))
      const newY = Math.max(0, Math.min(mapHeight - bounds.height, node.y()))

      const newBounds = {
        ...bounds,
        x: newX,
        y: newY
      }

      setBounds(newBounds)
      setPreviewBounds(null)

      // Snap position
      node.position({ x: newX, y: newY })
    },
    [bounds, mapWidth, mapHeight, setBounds]
  )

  const calculateResizeBounds = useCallback(
    (corner: 'nw' | 'ne' | 'se' | 'sw', pos: { x: number; y: number }) => {
      switch (corner) {
        case 'nw':
          return {
            x: Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            y: Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE)),
            width: bounds.x + bounds.width - Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            height: bounds.y + bounds.height - Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE))
          }
        case 'ne':
          return {
            x: bounds.x,
            y: Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE)),
            width: Math.max(MIN_SIZE, Math.min(pos.x - bounds.x, mapWidth - bounds.x)),
            height: bounds.y + bounds.height - Math.max(0, Math.min(pos.y, bounds.y + bounds.height - MIN_SIZE))
          }
        case 'se':
          return {
            x: bounds.x,
            y: bounds.y,
            width: Math.max(MIN_SIZE, Math.min(pos.x - bounds.x, mapWidth - bounds.x)),
            height: Math.max(MIN_SIZE, Math.min(pos.y - bounds.y, mapHeight - bounds.y))
          }
        case 'sw':
          return {
            x: Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            y: bounds.y,
            width: bounds.x + bounds.width - Math.max(0, Math.min(pos.x, bounds.x + bounds.width - MIN_SIZE)),
            height: Math.max(MIN_SIZE, Math.min(pos.y - bounds.y, mapHeight - bounds.y))
          }
      }
    },
    [bounds, mapWidth, mapHeight]
  )

  const handleResizeMove = useCallback(
    (corner: 'nw' | 'ne' | 'se' | 'sw', e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const pos = e.target.position()
      setPreviewBounds(calculateResizeBounds(corner, pos))
    },
    [calculateResizeBounds]
  )

  const handleResizeEnd = useCallback(
    (corner: 'nw' | 'ne' | 'se' | 'sw', e: Konva.KonvaEventObject<DragEvent>) => {
      e.cancelBubble = true
      const pos = e.target.position()
      setBounds(calculateResizeBounds(corner, pos))
      setPreviewBounds(null)
    },
    [calculateResizeBounds, setBounds]
  )

  if (!isPresenting) return null

  const handlePositions = {
    nw: { x: displayBounds.x, y: displayBounds.y },
    ne: { x: displayBounds.x + displayBounds.width, y: displayBounds.y },
    se: { x: displayBounds.x + displayBounds.width, y: displayBounds.y + displayBounds.height },
    sw: { x: displayBounds.x, y: displayBounds.y + displayBounds.height }
  }

  return (
    <Group ref={groupRef}>
      {/* Darkened area outside the bounds */}
      {/* Top */}
      <Rect x={0} y={0} width={mapWidth} height={displayBounds.y} fill="rgba(0, 0, 0, 0.5)" listening={false} />
      {/* Bottom */}
      <Rect
        x={0}
        y={displayBounds.y + displayBounds.height}
        width={mapWidth}
        height={mapHeight - displayBounds.y - displayBounds.height}
        fill="rgba(0, 0, 0, 0.5)"
        listening={false}
      />
      {/* Left */}
      <Rect x={0} y={displayBounds.y} width={displayBounds.x} height={displayBounds.height} fill="rgba(0, 0, 0, 0.5)" listening={false} />
      {/* Right */}
      <Rect
        x={displayBounds.x + displayBounds.width}
        y={displayBounds.y}
        width={mapWidth - displayBounds.x - displayBounds.width}
        height={displayBounds.height}
        fill="rgba(0, 0, 0, 0.5)"
        listening={false}
      />

      {/* Center area - only draggable when editing */}
      <Rect
        x={displayBounds.x}
        y={displayBounds.y}
        width={displayBounds.width}
        height={displayBounds.height}
        fill="transparent"
        stroke="#22d3ee"
        strokeWidth={2 / view.zoom}
        draggable={isEditable}
        listening={isEditable}
        onDragStart={(e) => { e.cancelBubble = true }}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
      />

      {/* Border decoration */}
      <Line
        points={[displayBounds.x + 20, displayBounds.y, displayBounds.x, displayBounds.y, displayBounds.x, displayBounds.y + 20]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />
      <Line
        points={[displayBounds.x + displayBounds.width - 20, displayBounds.y, displayBounds.x + displayBounds.width, displayBounds.y, displayBounds.x + displayBounds.width, displayBounds.y + 20]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />
      <Line
        points={[displayBounds.x + displayBounds.width, displayBounds.y + displayBounds.height - 20, displayBounds.x + displayBounds.width, displayBounds.y + displayBounds.height, displayBounds.x + displayBounds.width - 20, displayBounds.y + displayBounds.height]}
        stroke="#22d3ee"
        strokeWidth={3 / view.zoom}
        lineCap="round"
        listening={false}
      />
      <Line
        points={[displayBounds.x + 20, displayBounds.y + displayBounds.height, displayBounds.x, displayBounds.y + displayBounds.height, displayBounds.x, displayBounds.y + displayBounds.height - 20]}
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
          onDragEnd={(e) => handleResizeEnd(corner, e)}
          onDragMove={(e) => handleResizeMove(corner, e)}
          cursor={corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize'}
        />
      ))}
    </Group>
  )
}
