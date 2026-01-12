import { useRef, useCallback, useEffect, useMemo, useState } from 'react'
import { Stage, Layer, Rect, Text } from 'react-konva'
import type Konva from 'konva'
import { useEncounterStore, useCanvasStore, usePresentationStore } from '../../stores'
import { MapLayer } from './layers/MapLayer'
import { GridLayer } from './layers/GridLayer'
import { TokenLayer } from './layers/TokenLayer'
import { FogOfWarLayer } from './layers/FogOfWarLayer'
import { FogBrush } from './tools/FogBrush'
import { PresentationBounds } from './tools/PresentationBounds'

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
  const emptyTextColor = useCSSVariable('--canvas-empty-text', '#9ca3af')

  const encounter = useEncounterStore((s) => s.encounter)
  const updateViewState = useEncounterStore((s) => s.updateViewState)

  const { view, activeTool, isPanning, viewportSize } = useCanvasStore()
  const { setZoom, setPan, setPanning, clearSelection, resetZoom, setLastClickedCell } = useCanvasStore()

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

  // Handle mouse down for middle button panning
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        // Middle mouse button
        e.evt.preventDefault()
        setIsMiddleMouseHeld(true)
        setPanning(true)
      }
    },
    [setPanning]
  )

  // Handle mouse up for middle button panning
  const handleMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.evt.button === 1) {
        // Middle mouse button released
        setIsMiddleMouseHeld(false)
        setPanning(false)
        const stage = stageRef.current
        if (stage) {
          setPan(stage.x(), stage.y())
        }
      }
    },
    [setPanning, setPan]
  )

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

  // Load saved view state
  useEffect(() => {
    if (encounter?.viewState) {
      setZoom(encounter.viewState.zoom)
      setPan(encounter.viewState.panX, encounter.viewState.panY)
    }
  }, [encounter?.id])

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
      onMouseUp={handleMouseUp}
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

      {/* Empty state overlay */}
      {!encounter.map && (
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={mapWidth}
            height={mapHeight}
            fill="transparent"
          />
          <Text
            x={mapWidth / 2 - 150}
            y={mapHeight / 2 - 20}
            text="Upload a map or generate a grid to get started"
            fontSize={16}
            fill={emptyTextColor}
            width={300}
            align="center"
          />
        </Layer>
      )}
    </Stage>
  )
}
