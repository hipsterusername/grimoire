import { useState, useEffect, useCallback } from 'react'
import { Layer, Rect } from 'react-konva'
import type Konva from 'konva'
import { useCanvasStore, useEncounterStore } from '../../../stores'

interface FogBrushProps {
  stageRef: React.RefObject<Konva.Stage>
}

export function FogBrush({ stageRef }: FogBrushProps) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const activeTool = useCanvasStore((s) => s.activeTool)
  const view = useCanvasStore((s) => s.view)
  const addFogReveal = useEncounterStore((s) => s.addFogReveal)
  const addFogHide = useEncounterStore((s) => s.addFogHide)

  const isReveal = activeTool === 'fog-reveal'
  const isHide = activeTool === 'fog-hide'
  const isFogTool = isReveal || isHide

  // Get mouse position in canvas coordinates
  const getCanvasPos = useCallback((e: MouseEvent) => {
    const stage = stageRef.current
    if (!stage) return null

    const rect = stage.container().getBoundingClientRect()
    const x = (e.clientX - rect.left - view.panX) / view.zoom
    const y = (e.clientY - rect.top - view.panY) / view.zoom

    return { x, y }
  }, [stageRef, view])

  // Handle mouse events
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || !isFogTool) return

    const container = stage.container()

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e)
      setMousePos(pos)
    }

    const handleMouseLeave = () => {
      setMousePos(null)
      setDragStart(null)
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // Only left click

      const pos = getCanvasPos(e)
      if (!pos) return

      setDragStart(pos)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStart) return

      const pos = getCanvasPos(e)
      if (pos) {
        // Create rectangle from drag start to current position
        const x = Math.min(dragStart.x, pos.x)
        const y = Math.min(dragStart.y, pos.y)
        const width = Math.abs(pos.x - dragStart.x)
        const height = Math.abs(pos.y - dragStart.y)

        // Only add if it has some size
        if (width > 5 && height > 5) {
          const area = {
            type: 'rectangle' as const,
            x,
            y,
            width,
            height
          }
          if (isReveal) {
            addFogReveal(area)
          } else {
            addFogHide(area)
          }
        }
      }
      setDragStart(null)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [stageRef, isFogTool, isReveal, getCanvasPos, addFogReveal, addFogHide, dragStart])

  if (!mousePos || !isFogTool) {
    return null
  }

  const brushColor = isReveal
    ? 'rgba(74, 222, 128, 0.3)'
    : 'rgba(239, 68, 68, 0.3)'
  const strokeColor = isReveal ? '#4ade80' : '#ef4444'

  // Calculate rectangle preview bounds
  const getRectPreview = () => {
    if (!dragStart || !mousePos) return null
    const x = Math.min(dragStart.x, mousePos.x)
    const y = Math.min(dragStart.y, mousePos.y)
    const width = Math.abs(mousePos.x - dragStart.x)
    const height = Math.abs(mousePos.y - dragStart.y)
    return { x, y, width, height }
  }

  const rectPreview = getRectPreview()

  return (
    <Layer listening={false}>
      {dragStart && rectPreview ? (
        // Rectangle drag preview
        <Rect
          x={rectPreview.x}
          y={rectPreview.y}
          width={rectPreview.width}
          height={rectPreview.height}
          fill={brushColor}
          stroke={strokeColor}
          strokeWidth={2}
          dash={[8, 4]}
        />
      ) : (
        // Crosshair cursor indicator
        <>
          <Rect
            x={mousePos.x - 10}
            y={mousePos.y - 1}
            width={20}
            height={2}
            fill={strokeColor}
          />
          <Rect
            x={mousePos.x - 1}
            y={mousePos.y - 10}
            width={2}
            height={20}
            fill={strokeColor}
          />
        </>
      )}
    </Layer>
  )
}
