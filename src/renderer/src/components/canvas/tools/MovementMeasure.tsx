import { useMemo } from 'react'
import { Layer, Line, Group, Rect, Text } from 'react-konva'
import { useCanvasStore } from '../../../stores'

interface MovementMeasureProps {
  gridSize: number
}

/**
 * Calculate the movement path using Chebyshev distance (diagonal movement counts as 1 cell)
 * Returns array of cell centers forming the path
 */
function calculatePath(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = []
  let x = startX
  let y = startY

  path.push({ x, y })

  while (x !== endX || y !== endY) {
    const dx = Math.sign(endX - x)
    const dy = Math.sign(endY - y)
    x += dx
    y += dy
    path.push({ x, y })
  }

  return path
}

export function MovementMeasure({ gridSize }: MovementMeasureProps) {
  const movementMeasure = useCanvasStore((s) => s.movementMeasure)
  const view = useCanvasStore((s) => s.view)

  const pathData = useMemo(() => {
    if (!movementMeasure) return null

    const { startGridX, startGridY, currentGridX, currentGridY } = movementMeasure

    // Don't show if we haven't moved
    if (startGridX === currentGridX && startGridY === currentGridY) {
      return null
    }

    const path = calculatePath(startGridX, startGridY, currentGridX, currentGridY)

    // Convert grid cells to pixel coordinates (center of each cell)
    const halfCell = gridSize / 2
    const points = path.flatMap(p => [
      p.x * gridSize + halfCell,
      p.y * gridSize + halfCell
    ])

    // Distance is path length - 1 (number of moves) * 5ft per cell
    const cellsMoved = path.length - 1
    const distanceFeet = cellsMoved * 5

    // Position for the distance label (at the current/end position)
    const labelX = currentGridX * gridSize + halfCell
    const labelY = currentGridY * gridSize + halfCell

    return {
      points,
      distanceFeet,
      cellsMoved,
      labelX,
      labelY,
      path
    }
  }, [movementMeasure, gridSize])

  if (!pathData) return null

  // Scale stroke widths inversely with zoom for consistent visual size
  const strokeScale = 1 / view.zoom

  return (
    <Layer listening={false}>
      {/* Path line with dashed pattern */}
      <Line
        points={pathData.points}
        stroke="#f59e0b"
        strokeWidth={Math.max(3 * strokeScale, 1)}
        lineCap="round"
        lineJoin="round"
        opacity={0.9}
      />

      {/* Cell waypoint markers */}
      {pathData.path.slice(1).map((cell, i) => (
        <Group key={i}>
          {/* Small dot at each waypoint */}
          <Rect
            x={cell.x * gridSize + gridSize / 2 - 4 * strokeScale}
            y={cell.y * gridSize + gridSize / 2 - 4 * strokeScale}
            width={8 * strokeScale}
            height={8 * strokeScale}
            cornerRadius={4 * strokeScale}
            fill="#f59e0b"
            opacity={0.8}
          />
        </Group>
      ))}

      {/* Distance label */}
      <Group
        x={pathData.labelX}
        y={pathData.labelY - gridSize / 2 - 24 * strokeScale}
      >
        {/* Background pill */}
        <Rect
          x={-28 * strokeScale}
          y={-12 * strokeScale}
          width={56 * strokeScale}
          height={24 * strokeScale}
          cornerRadius={12 * strokeScale}
          fill="#1c1917"
          opacity={0.95}
        />
        {/* Distance text */}
        <Text
          x={-28 * strokeScale}
          y={-8 * strokeScale}
          width={56 * strokeScale}
          height={20 * strokeScale}
          text={`${pathData.distanceFeet}ft`}
          fontSize={Math.max(13 * strokeScale, 8)}
          fill="#fbbf24"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
        />
      </Group>
    </Layer>
  )
}
