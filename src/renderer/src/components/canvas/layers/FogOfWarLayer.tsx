import { useEffect, useMemo, useRef } from 'react'
import { Layer, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import type { FogOfWar } from '../../../types'

interface FogOfWarLayerProps {
  fogOfWar: FogOfWar
  mapWidth: number
  mapHeight: number
}

/**
 * Helper to draw an area shape to the canvas context
 */
function drawArea(ctx: CanvasRenderingContext2D, area: FogOfWar['revealedAreas'][0]): void {
  ctx.beginPath()

  if (area.type === 'circle' && area.radius) {
    ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2)
  } else if (area.type === 'rectangle' && area.width && area.height) {
    ctx.rect(area.x, area.y, area.width, area.height)
  } else if (area.type === 'polygon' && area.points) {
    const points = area.points
    if (points.length >= 2) {
      ctx.moveTo(points[0], points[1])
      for (let i = 2; i < points.length; i += 2) {
        ctx.lineTo(points[i], points[i + 1])
      }
      ctx.closePath()
    }
  }

  ctx.fill()
}

/**
 * Renders fog to a canvas element using chronological ordering.
 * Areas are processed in timestamp order so the most recent action wins.
 * This allows reveal → hide → reveal to work correctly.
 */
function renderFogToCanvas(
  canvas: HTMLCanvasElement,
  fogOfWar: FogOfWar,
  mapWidth: number,
  mapHeight: number
): void {
  // Update canvas size if needed
  if (canvas.width !== mapWidth || canvas.height !== mapHeight) {
    canvas.width = mapWidth
    canvas.height = mapHeight
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas completely
  ctx.clearRect(0, 0, mapWidth, mapHeight)

  // Draw full fog overlay (opaque black covering everything)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = fogOfWar.color
  ctx.globalAlpha = fogOfWar.opacity
  ctx.fillRect(0, 0, mapWidth, mapHeight)

  // Combine revealed and hidden areas with mode indicator, then sort chronologically
  const allAreas: Array<{ area: FogOfWar['revealedAreas'][0]; mode: 'reveal' | 'hide' }> = [
    ...fogOfWar.revealedAreas.map((area) => ({ area, mode: 'reveal' as const })),
    ...(fogOfWar.hiddenAreas || []).map((area) => ({ area, mode: 'hide' as const }))
  ]

  // Sort by createdAt timestamp (oldest first, so newest wins)
  allAreas.sort((a, b) => (a.area.createdAt || 0) - (b.area.createdAt || 0))

  // Process areas in chronological order
  allAreas.forEach(({ area, mode }) => {
    if (mode === 'reveal') {
      // Cut out revealed area
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else {
      // Paint fog back for hidden area
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = fogOfWar.color
      ctx.globalAlpha = fogOfWar.opacity
    }
    drawArea(ctx, area)
  })

  // Reset context state
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

export function FogOfWarLayer({ fogOfWar, mapWidth, mapHeight }: FogOfWarLayerProps) {
  const imageRef = useRef<Konva.Image | null>(null)

  // Create a stable canvas that persists across renders
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas')
  }

  // Render fog synchronously during render phase (via useMemo)
  // This ensures the canvas has content before Konva first draws it
  useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas || !fogOfWar.enabled) return

    renderFogToCanvas(canvas, fogOfWar, mapWidth, mapHeight)
  }, [fogOfWar, mapWidth, mapHeight])

  // After render, ensure Konva picks up any canvas changes
  useEffect(() => {
    const canvas = canvasRef.current
    const konvaImage = imageRef.current
    if (!canvas || !konvaImage || !fogOfWar.enabled) return

    // Force Konva to re-read the canvas content and redraw
    konvaImage.image(canvas)
    konvaImage.getLayer()?.batchDraw()
  }, [fogOfWar, mapWidth, mapHeight])

  // Don't render if fog is disabled
  if (!fogOfWar.enabled || !canvasRef.current) {
    return null
  }

  return (
    <Layer listening={false}>
      <KonvaImage
        ref={imageRef}
        image={canvasRef.current}
        x={0}
        y={0}
        width={mapWidth}
        height={mapHeight}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Layer>
  )
}
