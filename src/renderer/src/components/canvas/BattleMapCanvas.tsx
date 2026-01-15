import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import type Konva from 'konva'
import { useEncounterStore, useCanvasStore, usePresentationStore, useUIStore } from '../../stores'
import { MapLayer } from './layers/MapLayer'
import { GridLayer } from './layers/GridLayer'
import { TokenLayer } from './layers/TokenLayer'
import { FogOfWarLayer } from './layers/FogOfWarLayer'
import { FogBrush } from './tools/FogBrush'
import { PresentationBounds } from './tools/PresentationBounds'
import { MovementMeasure } from './tools/MovementMeasure'
import { Icon } from '../ui/Icon'

interface BattleMapCanvasProps {
  width: number
  height: number
}

// Hook to get CSS variable values for canvas rendering
function useCSSVariable(variableName: string, fallback: string): string {
  return useMemo(() => {
    if (typeof window === 'undefined') return fallback
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
    return value || fallback
  }, [variableName, fallback])
}

export function BattleMapCanvas({ width, height }: BattleMapCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null)

  // Get theme colors for canvas (use base CSS variables for runtime values)
  const canvasBg = useCSSVariable('--canvas-bg', '#e5e7eb')

  const encounter = useEncounterStore((s) => s.encounter)
  const updateViewState = useEncounterStore((s) => s.updateViewState)

  const { view, activeTool, isPanning, viewportSize } = useCanvasStore()
  const { setZoom, setPan, setPanning, clearSelection, resetZoom, setLastClickedCell, zoomToFit } = useCanvasStore()

  const openModal = useUIStore((s) => s.openModal)

  // Track space key and middle mouse for alternative panning
  const [isSpaceHeld, setIsSpaceHeld] = useState(false)
  const [isMiddleMouseHeld, setIsMiddleMouseHeld] = useState(false)

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()

      const stage = stageRef.current
      if (!stage) return

      const oldScale = view.zoom
      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const mousePointTo = {
        x: (pointer.x - view.panX) / oldScale,
        y: (pointer.y - view.panY) / oldScale
      }

      const direction = e.evt.deltaY > 0 ? -1 : 1
      const scaleBy = 1.1
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy

      const clampedScale = Math.max(0.1, Math.min(3, newScale))

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale
      }

      setZoom(clampedScale)
      setPan(newPos.x, newPos.y)
    },
    [view.zoom, view.panX, view.panY, setZoom, setPan]
  )

  // Handle drag for panning (pan tool, space+drag, middle mouse)
  const handleDragStart = useCallback(() => {
    setPanning(true)
  }, [setPanning])

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      // Only clear panning state if not holding space or middle mouse
      if (!isSpaceHeld && !isMiddleMouseHeld) {
        setPanning(false)
      }
      const stage = e.target as Konva.Stage
      setPan(stage.x(), stage.y())
    },
    [isSpaceHeld, isMiddleMouseHeld, setPanning, setPan]
  )

  // Handle stage click for deselection and tracking last clicked cell
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = stageRef.current
      if (!stage) return

      // Track the clicked cell for token placement
      const pointer = stage.getPointerPosition()
      if (pointer && encounter?.map?.gridSettings) {
        const gridSize = encounter.map.gridSettings.gridSize
        // Prevent division by zero
        if (gridSize > 0) {
          // Convert screen coords to canvas coords
          const canvasX = (pointer.x - view.panX) / view.zoom
          const canvasY = (pointer.y - view.panY) / view.zoom
          // Convert to grid cell
          const gridX = Math.floor(canvasX / gridSize)
          const gridY = Math.floor(canvasY / gridSize)
          setLastClickedCell(gridX, gridY)
        }
      }

      if (e.target === e.target.getStage()) {
        clearSelection()
      }
    },
    [clearSelection, encounter?.map?.gridSettings, view.panX, view.panY, view.zoom, setLastClickedCell]
  )

  // Handle mouse down for middle button panning (on stage)
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        // Middle mouse button - prevent default auto-scroll behavior
        e.evt.preventDefault()
      }
    },
    []
  )

  // Global mouse handlers for middle button panning
  // These must be global because the mouse can be released outside the canvas
  useEffect(() => {
    const handleGlobalMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        // Middle mouse button - prevent auto-scroll and start panning
        e.preventDefault()
        setIsMiddleMouseHeld(true)
        setPanning(true)

        // Programmatically start the drag since the stage isn't draggable yet
        // when this mousedown fires (React hasn't re-rendered with isDraggable=true)
        const stage = stageRef.current
        if (stage) {
          stage.startDrag()
        }
      }
    }

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        // Middle mouse button released
        setIsMiddleMouseHeld(false)
        setPanning(false)
        const stage = stageRef.current
        if (stage) {
          stage.stopDrag()
          setPan(stage.x(), stage.y())
        }
      }
    }

    window.addEventListener('mousedown', handleGlobalMouseDown)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [setPanning, setPan])

  // Keyboard handlers for space and Ctrl+R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space key for panning
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setIsSpaceHeld(true)
      }
      // Ctrl+R for recenter
      if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (encounter?.map) {
          const mapWidth = encounter.map.imageWidth
          const mapHeight = encounter.map.imageHeight
          // Center the map in the viewport
          const scale = Math.min(viewportSize.width / mapWidth, viewportSize.height / mapHeight, 1) * 0.9
          const panX = (viewportSize.width - mapWidth * scale) / 2
          const panY = (viewportSize.height - mapHeight * scale) / 2
          setZoom(scale)
          setPan(panX, panY)
        } else {
          resetZoom()
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpaceHeld(false)
        setPanning(false)
        const stage = stageRef.current
        if (stage) {
          setPan(stage.x(), stage.y())
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [encounter, viewportSize, setZoom, setPan, setPanning, resetZoom])

  // Sync view state to encounter on unmount
  useEffect(() => {
    return () => {
      updateViewState(view)
    }
  }, [])

  // Fit map to view on load, or center empty canvas
  useEffect(() => {
    if (encounter?.map && width > 0 && height > 0) {
      // Has a map - fit it to view so the full map is visible
      zoomToFit(width, height, encounter.map.imageWidth, encounter.map.imageHeight)
    } else if (encounter && !encounter.map && width > 0 && height > 0) {
      // No map - center the default canvas area
      const defaultWidth = 1000
      const defaultHeight = 800
      const panX = (width - defaultWidth) / 2
      const panY = (height - defaultHeight) / 2
      setZoom(1)
      setPan(panX, panY)
    }
  }, [encounter?.id, encounter?.map, width, height, setZoom, setPan, zoomToFit])

  // Get presentation sync function
  const syncState = usePresentationStore((s) => s.syncState)
  const isPresenting = usePresentationStore((s) => s.isPresenting)
  const presentationBounds = usePresentationStore((s) => s.bounds)

  // Function to sync state - presentation view derives current turn from encounter state
  const doSyncState = useCallback(() => {
    if (!encounter) return

    syncState({
      encounterId: encounter.id,
      encounter,
      viewBounds: presentationBounds,
      showFogOfWar: true,
      showInitiative: true,
      selectedTokenId: null // Presentation view derives this from combat state
    })
  }, [encounter, presentationBounds, syncState])

  // Listen for state requests from presentation window
  useEffect(() => {
    const unsubscribe = window.electronAPI.onPresentationStateRequest(() => {
      doSyncState()
    })
    return () => {
      unsubscribe()
    }
  }, [doSyncState])

  // Sync state to presentation window when relevant data changes
  // Include fogOfWar.revealedAreas.length to trigger sync when fog changes
  const fogAreasCount = encounter?.fogOfWar?.revealedAreas?.length ?? 0

  useEffect(() => {
    if (!isPresenting || !encounter) return

    // Small delay to ensure presentation window is ready
    const timeoutId = setTimeout(() => {
      doSyncState()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [isPresenting, encounter, presentationBounds, fogAreasCount, doSyncState])

  if (!encounter) {
    return null
  }

  const mapWidth = encounter.map?.imageWidth ?? 1000
  const mapHeight = encounter.map?.imageHeight ?? 800
  const gridSize = encounter.map?.gridSettings.gridSize ?? 50

  // Panning is enabled when: pan tool is active, space is held, or middle mouse is held
  const isDraggable = activeTool === 'pan' || isSpaceHeld || isMiddleMouseHeld
  const isFogTool = activeTool === 'fog-reveal' || activeTool === 'fog-hide'

  return (
    <div className="relative" style={{ width, height }}>
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      scaleX={view.zoom}
      scaleY={view.zoom}
      x={view.panX}
      y={view.panY}
      draggable={isDraggable}
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDraggable ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Background layer */}
      <Layer listening={false}>
        <Rect
          x={0}
          y={0}
          width={mapWidth}
          height={mapHeight}
          fill={canvasBg}
        />
      </Layer>

      {/* Map image layer */}
      <MapLayer map={encounter.map} />

      {/* Grid overlay layer */}
      <GridLayer
        settings={encounter.map?.gridSettings}
        width={mapWidth}
        height={mapHeight}
      />

      {/* Tokens layer */}
      <TokenLayer tokens={encounter.tokens} gridSize={gridSize} />

      {/* Movement measurement overlay */}
      <MovementMeasure gridSize={gridSize} />

      {/* Fog of War layer */}
      <FogOfWarLayer
        fogOfWar={encounter.fogOfWar}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
      />

      {/* Presentation bounds overlay */}
      <Layer>
        <PresentationBounds mapWidth={mapWidth} mapHeight={mapHeight} />
      </Layer>

      {/* Fog brush preview */}
      {isFogTool && stageRef.current && (
        <FogBrush
          stageRef={stageRef as React.RefObject<Konva.Stage>}
        />
      )}
    </Stage>

    {/* Empty state overlay - HTML for interactivity */}
    {!encounter.map && (
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-live="polite"
      >
        <div className="pointer-events-auto text-center">
          <p className="text-muted-foreground mb-6 text-sm tracking-wide uppercase">
            No map loaded
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => openModal('map-upload')}
              className="group relative px-5 py-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 rounded-lg transition-all duration-200 flex items-center gap-3"
            >
              <Icon name="upload" size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Upload a map</span>
            </button>
            <button
              onClick={() => openModal('grid-generator')}
              className="group relative px-5 py-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/50 rounded-lg transition-all duration-200 flex items-center gap-3"
            >
              <Icon name="grid" size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium">Generate a grid</span>
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
