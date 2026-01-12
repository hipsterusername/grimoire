import type { ReactElement } from 'react'
import { Layer, Line } from 'react-konva'
import type { MapSettings } from '../../../types'
import { DEFAULT_MAP_SETTINGS } from '../../../types'

interface GridLayerProps {
  settings: MapSettings | undefined
  width: number
  height: number
}

export function GridLayer({ settings, width, height }: GridLayerProps) {
  const gridSettings = settings ?? DEFAULT_MAP_SETTINGS

  if (!gridSettings.showGrid) {
    return <Layer listening={false} />
  }

  const { gridSize, gridColor, gridOpacity } = gridSettings

  // Prevent infinite loop if gridSize is 0 or negative
  if (gridSize <= 0) {
    return <Layer listening={false} />
  }

  const verticalLines: ReactElement[] = []
  const horizontalLines: ReactElement[] = []

  // Generate vertical lines (limit to prevent performance issues)
  const maxLines = 1000
  let lineCount = 0
  for (let x = 0; x <= width && lineCount < maxLines; x += gridSize) {
    verticalLines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke={gridColor}
        strokeWidth={1}
        opacity={gridOpacity}
      />
    )
    lineCount++
  }

  // Generate horizontal lines
  lineCount = 0
  for (let y = 0; y <= height && lineCount < maxLines; y += gridSize) {
    horizontalLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke={gridColor}
        strokeWidth={1}
        opacity={gridOpacity}
      />
    )
    lineCount++
  }

  return (
    <Layer listening={false}>
      {verticalLines}
      {horizontalLines}
    </Layer>
  )
}
