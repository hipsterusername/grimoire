import { useState, useEffect, useCallback } from 'react'
import { Layer, Circle, Rect } from 'react-konva'
import type Konva from 'konva'
import { useCanvasStore, useEncounterStore } from '../../../stores'

interface FogBrushProps {
  stageRef: React.RefObject<Konva.Stage>
}

export function FogBrush({ stageRef }: FogBrushProps) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  // For rectangle drag-to-create
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const { activeTool, brushSettings, view } = useCanvasStore()
  const addFogReveal = useEncounterStore((s) => s.addFogReveal)

  const isReveal = activeTool === 'fog-reveal'
  const isHide = activeTool === 'fog-hide'
  const isCircleMode = brushSettings.shape === 'circle'
  const isRectMode = brushSettings.shape === 'square'

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
    if (!stage) return

    const container = stage.container()

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getCanvasPos(e)
      setMousePos(pos)
    }

    const handleMouseLeave = () => {
      setMousePos(null)
      // Cancel any in-progress rectangle if mouse leaves
      if (isRectMode && dragStart) {
        setDragStart(null)
        setIsDrawing(false)
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // Only left click

      const pos = getCanvasPos(e)
      if (!pos) return

      setIsDrawing(true)

      if (isReveal) {
        if (isCircleMode) {
          // Circle mode: stamp immediately
          addFogReveal({
            type: 'circle',
            x: pos.x,
            y: pos.y,
            radius: brushSettings.size
          })
        } else if (isRectMode) {
          // Rectangle mode: start drag
          setDragStart(pos)
        }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (isRectMode && dragStart && isReveal) {
        const pos = getCanvasPos(e)
        if (pos) {
          // Create rectangle from drag start to current position
          const x = Math.min(dragStart.x, pos.x)
          const y = Math.min(dragStart.y, pos.y)
          const width = Math.abs(pos.x - dragStart.x)
          const height = Math.abs(pos.y - dragStart.y)

          // Only add if it has some size
          if (width > 5 && height > 5) {
            addFogReveal({
              type: 'rectangle',
              x,
              y,
              width,
              height
            })
          }
        }
        setDragStart(null)
      }
      setIsDrawing(false)
    }

    // Only add listeners when fog tool is active
    if (isReveal || isHide) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
      container.addEventListener('mousedown', handleMouseDown)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [stageRef, isReveal, isHide, isCircleMode, isRectMode, brushSettings, getCanvasPos, addFogReveal, dragStart])

  // Add reveal areas while dragging (circle mode only)
  useEffect(() => {
    if (!isDrawing || !mousePos || !isReveal || !isCircleMode) return

    const interval = setInterval(() => {
      addFogReveal({
        type: 'circle',
        x: mousePos.x,
        y: mousePos.y,
        radius: brushSettings.size
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isDrawing, mousePos, isReveal, isCircleMode, brushSettings, addFogReveal])

  if (!mousePos || (!isReveal && !isHide)) {
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

  const rectPreview = isRectMode ? getRectPreview() : null

  return (
    <Layer listening={false}>
      {isCircleMode ? (
        // Circle brush preview
        <Circle
          x={mousePos.x}
          y={mousePos.y}
          radius={brushSettings.size}
          fill={brushColor}
          stroke={strokeColor}
          strokeWidth={2}
        />
      ) : isRectMode && dragStart && rectPreview ? (
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
      ) : isRectMode ? (
        // Rectangle mode cursor indicator (crosshair-like)
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
      ) : null}
    </Layer>
  )
}
