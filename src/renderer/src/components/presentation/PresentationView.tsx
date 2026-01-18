import { useEffect, useRef, useState, useMemo, useCallback, createContext, useContext } from 'react'
import { Stage, Layer, Rect, Group, Image as KonvaImage, Line } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import { usePresentationStore } from '../../stores'
import type { PresentationState, PresentationBounds } from '../../stores/presentation-store'
import type { Encounter, Token, FogOfWar, Asset } from '../../types'
import { SIZE_TO_GRID_UNITS, CreatureSize, TokenType } from '../../types'
import { ConditionIndicators } from '../canvas/tokens/ConditionIndicators'
import { Icon } from '../ui/Icon'

// Context to provide synced library assets to child components
// This replaces the useLibraryStore hook which doesn't work in the presentation window
// because it depends on campaign context that isn't synced
const SyncedAssetsContext = createContext<Asset[]>([])

function useSyncedAssets() {
  return useContext(SyncedAssetsContext)
}

// Explicit state machine for view initialization
type ViewStatus =
  | { state: 'initializing' }
  | { state: 'waiting'; startTime: number }
  | { state: 'ready'; data: PresentationState }
  | { state: 'error'; message: string }

const INIT_TIMEOUT_MS = 3000

// Design token colors for health status
const HEALTH_COLORS = {
  healthy: 'var(--color-success, #22c55e)',
  injured: 'var(--color-warning, #eab308)',
  critical: 'var(--color-destructive, #ef4444)'
} as const

interface TokenDisplayProps {
  token: Token
  gridSize: number
  offsetX: number
  offsetY: number
}

function TokenDisplay({ token, gridSize, offsetX, offsetY }: TokenDisplayProps) {
  // Early return before hooks for invisible or hidden tokens
  const isVisible = token.visible && !token.hidden

  const syncedAssets = useSyncedAssets()

  const imageUrl = useMemo(() => {
    if (!isVisible) return null
    if (token.assetId) {
      const asset = syncedAssets.find((a) => a.id === token.assetId)
      return asset?.processedDataUrl
    }
    return token.imageUrl
  }, [isVisible, token.assetId, token.imageUrl, syncedAssets])

  const [image] = useImage(imageUrl ?? '', 'anonymous')

  // Skip rendering if not visible
  if (!isVisible) return null

  const hasImage = !!imageUrl && !!image
  const gridUnits = SIZE_TO_GRID_UNITS[token.size]
  const tokenSize = gridUnits * gridSize
  const x = token.gridX * gridSize - offsetX
  const y = token.gridY * gridSize - offsetY
  const offset = token.size === CreatureSize.Tiny ? gridSize * 0.25 : 0
  const radius = tokenSize / 2
  const borderWidth = 4

  return (
    <Group x={x} y={y}>
      {hasImage ? (
        <Group>
          {/* Border ring */}
          <Rect
            x={offset}
            y={offset}
            width={tokenSize}
            height={tokenSize}
            cornerRadius={radius}
            stroke={token.color}
            strokeWidth={borderWidth}
          />
          {/* Clipped image */}
          <Group
            clipFunc={(ctx) => {
              ctx.arc(radius + offset, radius + offset, radius - borderWidth, 0, Math.PI * 2)
            }}
          >
            <KonvaImage
              image={image}
              x={offset + borderWidth}
              y={offset + borderWidth}
              width={tokenSize - borderWidth * 2}
              height={tokenSize - borderWidth * 2}
            />
          </Group>
        </Group>
      ) : (
        <Rect
          x={offset}
          y={offset}
          width={tokenSize}
          height={tokenSize}
          cornerRadius={radius}
          fill={token.color}
        />
      )}

      {/* Condition indicators with icons - visible to players */}
      <ConditionIndicators
        conditions={token.conditions}
        tokenSize={tokenSize}
        offset={offset}
      />
    </Group>
  )
}

interface InitiativePanelProps {
  tokens: Token[]
  currentTurnTokenId: string | null
}

// Get health status text and color based on HP percentage
function getHealthStatus(hpPercent: number): { text: string; colorKey: keyof typeof HEALTH_COLORS; hex: string } {
  if (hpPercent > 0.6) return { text: 'Healthy', colorKey: 'healthy', hex: '#22c55e' }
  if (hpPercent > 0.2) return { text: 'Injured', colorKey: 'injured', hex: '#eab308' }
  return { text: 'Near Death', colorKey: 'critical', hex: '#ef4444' }
}

// Get HP bar color based on percentage
function getHpBarColor(hpPercent: number): string {
  if (hpPercent > 0.5) return '#22c55e'
  if (hpPercent > 0.25) return '#eab308'
  return '#ef4444'
}

function InitiativePanel({ tokens, currentTurnTokenId }: InitiativePanelProps) {
  const syncedAssets = useSyncedAssets()

  // Sort by initiative (descending), filtering out invisible and hidden tokens
  const sortedTokens = [...tokens]
    .filter((t) => t.visible && !t.hidden)
    .sort((a, b) => (b.stats.initiative ?? 0) - (a.stats.initiative ?? 0))

  const getAssetPreview = (assetId?: string) => {
    if (!assetId) return null
    return syncedAssets.find((a) => a.id === assetId)?.processedDataUrl
  }

  return (
    <div className="bg-secondary/95 backdrop-blur rounded-lg p-3 shadow-lg">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Icon name="dice" size={16} />
        Initiative
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sortedTokens.map((token) => {
          const preview = getAssetPreview(token.assetId)
          const isCurrentTurn = token.id === currentTurnTokenId
          const hpPercent = token.stats.maxHp > 0 ? token.stats.currentHp / token.stats.maxHp : 1
          const isPlayer = token.type === TokenType.PlayerCharacter
          const healthStatus = getHealthStatus(hpPercent)

          return (
            <div
              key={token.id}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentTurn ? 'bg-primary/20 ring-1 ring-primary' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Token avatar */}
                <div
                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2"
                  style={{
                    backgroundColor: token.color,
                    borderColor: token.color
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                      {token.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{token.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Init: {token.stats.initiative ?? '-'}</span>
                    {isPlayer && <span>AC: {token.stats.armorClass}</span>}
                  </div>
                </div>

                {/* HP display - different for players vs non-players */}
                {isPlayer ? (
                  // Players: Show HP bar with numbers
                  <div className="w-16">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.max(0, Math.min(100, hpPercent * 100))}%`,
                          backgroundColor: getHpBarColor(hpPercent)
                        }}
                      />
                    </div>
                    <p className="text-xs text-center mt-0.5 text-muted-foreground">
                      {token.stats.currentHp}/{token.stats.maxHp}
                    </p>
                  </div>
                ) : (
                  // Non-players: Show health status text
                  <span
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: `${healthStatus.hex}20`, color: healthStatus.hex }}
                  >
                    {healthStatus.text}
                  </span>
                )}
              </div>

              {/* Conditions row */}
              {token.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 ml-10">
                  {token.conditions.map((condition) => (
                    <span
                      key={condition.id}
                      className="px-1.5 py-0.5 text-[10px] rounded-full text-white font-medium"
                      style={{ backgroundColor: condition.color ?? '#ef4444' }}
                      title={condition.duration !== undefined ? `${condition.name} (${condition.duration} rounds)` : condition.name}
                    >
                      {condition.name}
                      {condition.duration !== undefined && (
                        <span className="ml-0.5 opacity-75">({condition.duration})</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface TokenDetailsPanelProps {
  token: Token | null
}

function TokenDetailsPanel({ token }: TokenDetailsPanelProps) {
  const syncedAssets = useSyncedAssets()

  if (!token) {
    return null
  }

  const preview = token.assetId
    ? syncedAssets.find((a) => a.id === token.assetId)?.processedDataUrl
    : null

  const hpPercent = token.stats.maxHp > 0 ? token.stats.currentHp / token.stats.maxHp : 1
  const isPlayer = token.type === TokenType.PlayerCharacter
  const healthStatus = getHealthStatus(hpPercent)

  return (
    <div className="bg-secondary/95 backdrop-blur rounded-lg p-3 shadow-lg">
      <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
        Active Turn
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full overflow-hidden border-2"
          style={{ backgroundColor: token.color, borderColor: token.color }}
        >
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
              {token.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{token.name}</h3>
          <p className="text-xs text-muted-foreground">
            {token.type === TokenType.PlayerCharacter ? 'Player' : token.type === TokenType.Monster ? 'Monster' : 'NPC'}
          </p>
        </div>
      </div>

      {/* Stats - different display for players vs non-players */}
      {isPlayer ? (
        // Players: Show full HP and AC
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted/50 rounded p-2 text-center">
            <p className="text-xs text-muted-foreground">HP</p>
            <p className="font-bold">
              {token.stats.currentHp}
              {token.stats.tempHp > 0 && <span className="text-cyan-400">+{token.stats.tempHp}</span>}
              /{token.stats.maxHp}
            </p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, hpPercent * 100))}%`,
                  backgroundColor: getHpBarColor(hpPercent)
                }}
              />
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2 text-center">
            <p className="text-xs text-muted-foreground">AC</p>
            <p className="font-bold text-xl">{token.stats.armorClass}</p>
          </div>
        </div>
      ) : (
        // Non-players: Show health status only
        <div className="mb-3">
          <div
            className="rounded p-3 text-center"
            style={{ backgroundColor: `${healthStatus.hex}15` }}
          >
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <p className="font-bold text-lg" style={{ color: healthStatus.hex }}>
              {healthStatus.text}
            </p>
          </div>
        </div>
      )}

      {/* Conditions */}
      {token.conditions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-muted-foreground mb-1">Conditions</p>
          <div className="flex flex-wrap gap-1">
            {token.conditions.map((condition) => (
              <span
                key={condition.id}
                className="px-2 py-0.5 text-xs rounded-full"
                style={{ backgroundColor: condition.color ?? '#ef4444', color: '#fff' }}
              >
                {condition.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes - only show for players */}
      {isPlayer && token.notes && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="text-sm bg-muted/50 rounded p-2">{token.notes}</p>
        </div>
      )}
    </div>
  )
}

const SIDEBAR_WIDTH = 288 // w-72 = 18rem = 288px

interface PresentationFogLayerProps {
  fogOfWar: FogOfWar
  mapWidth: number
  mapHeight: number
  boundsX: number
  boundsY: number
}

/**
 * Helper to draw an area shape to the canvas context
 */
function drawFogArea(ctx: CanvasRenderingContext2D, area: FogOfWar['revealedAreas'][0]): void {
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
 * Renders fog to a canvas using chronological ordering.
 * Areas are processed in timestamp order so the most recent action wins.
 * This allows reveal → hide → reveal to work correctly.
 *
 * Note: Presentation view uses full opacity (1.0) for fog,
 * unlike the editor which uses semi-transparent fog so the DM can
 * see what's underneath. Players should never see through fog.
 */
function renderFogToCanvas(
  canvas: HTMLCanvasElement,
  fogOfWar: FogOfWar,
  mapWidth: number,
  mapHeight: number
): void {
  // Size canvas to full map dimensions
  if (canvas.width !== mapWidth || canvas.height !== mapHeight) {
    canvas.width = mapWidth
    canvas.height = mapHeight
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, mapWidth, mapHeight)

  // Draw full fog overlay covering the entire map
  // Use full opacity for presentation - players should not see through fog
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = fogOfWar.color
  ctx.globalAlpha = 1.0
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
      // Paint fog back for hidden area (full opacity for players)
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = fogOfWar.color
      ctx.globalAlpha = 1.0
    }
    drawFogArea(ctx, area)
  })

  // Reset context state
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
}

/**
 * Fog of War layer for presentation view.
 *
 * Architecture: Renders fog at full map size using absolute coordinates,
 * then positions it within the already-transformed coordinate space.
 * The parent Layer's clip bounds handle viewport cropping.
 *
 * This mirrors the editor's FogOfWarLayer approach - the fog canvas
 * uses the same coordinate system as the map, and Konva handles
 * the viewport transformation.
 */
function PresentationFogLayer({ fogOfWar, mapWidth, mapHeight, boundsX, boundsY }: PresentationFogLayerProps) {
  const imageRef = useRef<Konva.Image | null>(null)

  // Create stable canvas - persists across renders
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  if (!canvasRef.current && typeof document !== 'undefined') {
    canvasRef.current = document.createElement('canvas')
  }

  // Render fog synchronously during render phase
  // This ensures canvas has content before Konva first draws
  useMemo(() => {
    const canvas = canvasRef.current
    if (!canvas || !fogOfWar.enabled) return

    renderFogToCanvas(canvas, fogOfWar, mapWidth, mapHeight)
  }, [fogOfWar, mapWidth, mapHeight])

  // After render, ensure Konva picks up canvas changes
  useEffect(() => {
    const canvas = canvasRef.current
    const konvaImage = imageRef.current
    if (!canvas || !konvaImage || !fogOfWar.enabled) return

    konvaImage.image(canvas)
    konvaImage.getLayer()?.batchDraw()
  }, [fogOfWar, mapWidth, mapHeight])

  if (!fogOfWar.enabled || !canvasRef.current) {
    return null
  }

  // Position fog at (-boundsX, -boundsY) so it aligns with the map image
  // The map is also positioned at (-boundsX, -boundsY) in the parent Layer
  // This keeps fog and map in perfect alignment
  return (
    <KonvaImage
      ref={imageRef}
      image={canvasRef.current}
      x={-boundsX}
      y={-boundsY}
      width={mapWidth}
      height={mapHeight}
      listening={false}
      perfectDrawEnabled={false}
    />
  )
}

export function PresentationView() {
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { setReceivedState } = usePresentationStore()

  // State machine for initialization
  const [viewStatus, setViewStatus] = useState<ViewStatus>({ state: 'initializing' })
  const [bounds, setBounds] = useState<PresentationBounds>({ x: 0, y: 0, width: 800, height: 600 })
  // Library assets synced from main window - used for token images
  const [syncedAssets, setSyncedAssets] = useState<Asset[]>([])

  // Derive showInitiative from ready state
  const showInitiative = viewStatus.state === 'ready' ? (viewStatus.data.showInitiative ?? true) : false

  // Use window dimensions directly, accounting for sidebar when visible
  const [windowSize, setWindowSize] = useState(() => ({
    width: window.innerWidth - (showInitiative ? SIDEBAR_WIDTH : 0),
    height: window.innerHeight
  }))

  // Track window resize and sidebar visibility
  useEffect(() => {
    const sidebarWidth = showInitiative ? SIDEBAR_WIDTH : 0
    setWindowSize({
      width: window.innerWidth - sidebarWidth,
      height: window.innerHeight
    })

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth - sidebarWidth,
        height: window.innerHeight
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showInitiative])

  // Handle incoming state - transition to ready
  const handleStateReceived = useCallback((state: PresentationState) => {
    setReceivedState(state)
    setViewStatus({ state: 'ready', data: state })

    // Update bounds if valid
    if (state.viewBounds && state.viewBounds.width > 0 && state.viewBounds.height > 0) {
      setBounds(state.viewBounds)
    }

    // Update synced library assets for token images
    if (state.libraryAssets) {
      setSyncedAssets(state.libraryAssets)
    }
  }, [setReceivedState])

  // Handle bounds update while in ready state
  const handleBoundsUpdate = useCallback((newBounds: PresentationBounds) => {
    if (newBounds.width > 0 && newBounds.height > 0) {
      setBounds(newBounds)
    }
  }, [])

  // State machine initialization and transitions
  useEffect(() => {
    // Start waiting phase
    if (viewStatus.state === 'initializing') {
      setViewStatus({ state: 'waiting', startTime: Date.now() })
      return
    }

    // Check timeout while waiting
    if (viewStatus.state === 'waiting') {
      const checkTimeout = setInterval(() => {
        if (Date.now() - viewStatus.startTime > INIT_TIMEOUT_MS) {
          setViewStatus({
            state: 'error',
            message: 'No response from main window. Ensure an encounter is open.'
          })
        }
      }, 500)
      return () => clearInterval(checkTimeout)
    }
  }, [viewStatus.state, viewStatus.state === 'waiting' ? viewStatus.startTime : 0])

  // Listen for state updates from main window
  useEffect(() => {
    const unsubState = window.electronAPI.onPresentationStateUpdate((state) => {
      handleStateReceived(state as PresentationState)
    })

    const unsubBounds = window.electronAPI.onPresentationBoundsUpdate((newBounds) => {
      handleBoundsUpdate(newBounds as PresentationBounds)
    })

    // Request initial state from main window
    const requestState = () => {
      window.electronAPI.requestPresentationState()
    }

    // Request state immediately and retry a few times
    requestState()
    const retryTimeouts = [
      setTimeout(requestState, 300),
      setTimeout(requestState, 800),
      setTimeout(requestState, 1500)
    ]

    return () => {
      unsubState()
      unsubBounds()
      retryTimeouts.forEach(clearTimeout)
    }
  }, [handleStateReceived, handleBoundsUpdate])

  // Extract encounter from ready state
  const encounter = viewStatus.state === 'ready'
    ? (viewStatus.data.encounter as Encounter | undefined)
    : undefined

  // Derive current turn token from combat state - NOT tied to user selection
  const currentTurnTokenId = useMemo(() => {
    if (!encounter?.inCombat || !encounter.initiativeOrder.length) return null
    return encounter.initiativeOrder[encounter.currentTurnIndex] ?? null
  }, [encounter?.inCombat, encounter?.initiativeOrder, encounter?.currentTurnIndex])

  // Consolidated bounds with validation - single source of truth
  const safeBounds = useMemo(() => ({
    x: bounds.x || 0,
    y: bounds.y || 0,
    width: Math.max(bounds.width || 800, 100),  // Minimum 100px
    height: Math.max(bounds.height || 600, 100)  // Minimum 100px
  }), [bounds])

  // Calculate scale and offset to fit and center bounds in container
  const { scale, offsetX, offsetY } = useMemo(() => {
    const scaleX = windowSize.width / safeBounds.width
    const scaleY = windowSize.height / safeBounds.height
    // Clamp scale to reasonable range (0.1 to 10)
    const s = Math.max(0.1, Math.min(10, Math.min(scaleX, scaleY)))

    // Center the content
    const scaledWidth = safeBounds.width * s
    const scaledHeight = safeBounds.height * s
    const ox = (windowSize.width - scaledWidth) / 2
    const oy = (windowSize.height - scaledHeight) / 2

    return {
      scale: s,
      offsetX: ox,
      offsetY: oy
    }
  }, [windowSize, safeBounds])

  // Get map image
  const mapImageUrl = encounter?.map?.imageUrl
  const [mapImage] = useImage(mapImageUrl ?? '', 'anonymous')

  const currentTurnToken = encounter?.tokens.find((t) => t.id === currentTurnTokenId) ?? null
  const gridSize = encounter?.map?.gridSettings.gridSize ?? 50

  // Render based on state machine
  if (viewStatus.state === 'initializing' || viewStatus.state === 'waiting') {
    return (
      <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <div className="w-12 h-12 mx-auto mb-4 border-2 border-zinc-600 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-lg font-medium text-zinc-300">Connecting to session...</p>
          <p className="text-sm mt-2">Waiting for encounter data from main window</p>
        </div>
      </div>
    )
  }

  if (viewStatus.state === 'error') {
    return (
      <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-zinc-400 max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <Icon name="alert-triangle" size={24} className="text-red-400" />
          </div>
          <p className="text-lg font-medium text-zinc-300">Connection Failed</p>
          <p className="text-sm mt-2">{viewStatus.message}</p>
          <button
            onClick={() => {
              setViewStatus({ state: 'waiting', startTime: Date.now() })
              window.electronAPI.requestPresentationState()
            }}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  // Ready state - render the presentation
  if (!encounter) {
    return (
      <div className="w-screen h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center text-zinc-400">
          <Icon name="map" size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No encounter loaded</p>
          <p className="text-sm mt-2">Open an encounter in the main window</p>
        </div>
      </div>
    )
  }

  // Calculate what portion of the map to show based on bounds
  const mapWidth = encounter.map?.imageWidth ?? safeBounds.width
  const mapHeight = encounter.map?.imageHeight ?? safeBounds.height

  return (
    <SyncedAssetsContext.Provider value={syncedAssets}>
      <div className="w-screen h-screen bg-zinc-950 flex">
        {/* Map canvas - uses absolute positioning with explicit window dimensions */}
        <div ref={containerRef} className="flex-1 relative">
          <Stage
            ref={stageRef}
            width={windowSize.width}
            height={windowSize.height}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
              {/* Content layer with transforms and CLIPPING to bounds */}
              <Layer
                x={offsetX}
                y={offsetY}
                scaleX={scale}
                scaleY={scale}
                clipX={0}
                clipY={0}
                clipWidth={safeBounds.width}
                clipHeight={safeBounds.height}
              >
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={safeBounds.width}
                  height={safeBounds.height}
                  fill="#2a2a3e"
                />

                {/* Map image - positioned so bounds area is at origin */}
                {mapImage && (
                  <KonvaImage
                    image={mapImage}
                    x={-safeBounds.x}
                    y={-safeBounds.y}
                    width={mapWidth}
                    height={mapHeight}
                  />
                )}

                {/* Grid overlay */}
                {encounter.map?.gridSettings?.showGrid && (() => {
                  const settings = encounter.map.gridSettings
                  const lines: React.ReactElement[] = []

                  // Vertical lines
                  for (let x = 0; x <= mapWidth; x += settings.gridSize) {
                    lines.push(
                      <Line
                        key={`v-${x}`}
                        points={[x - safeBounds.x, -safeBounds.y, x - safeBounds.x, mapHeight - safeBounds.y]}
                        stroke={settings.gridColor}
                        strokeWidth={1}
                        opacity={settings.gridOpacity}
                      />
                    )
                  }

                  // Horizontal lines
                  for (let y = 0; y <= mapHeight; y += settings.gridSize) {
                    lines.push(
                      <Line
                        key={`h-${y}`}
                        points={[-safeBounds.x, y - safeBounds.y, mapWidth - safeBounds.x, y - safeBounds.y]}
                        stroke={settings.gridColor}
                        strokeWidth={1}
                        opacity={settings.gridOpacity}
                      />
                    )
                  }

                  return lines
                })()}

                {/* Tokens */}
                {encounter.tokens.map((token) => (
                  <TokenDisplay
                    key={token.id}
                    token={token}
                    gridSize={gridSize}
                    offsetX={safeBounds.x}
                    offsetY={safeBounds.y}
                  />
                ))}

                {/* Fog of War - rendered on top of everything */}
                {viewStatus.data.showFogOfWar && encounter.fogOfWar && (
                  <PresentationFogLayer
                    fogOfWar={encounter.fogOfWar}
                    mapWidth={mapWidth}
                    mapHeight={mapHeight}
                    boundsX={safeBounds.x}
                    boundsY={safeBounds.y}
                  />
                )}
              </Layer>
            </Stage>
        </div>

        {/* Sidebar */}
        {showInitiative && (
          <div className="w-72 bg-secondary/50 p-3 flex flex-col gap-3 overflow-y-auto">
            <InitiativePanel tokens={encounter.tokens} currentTurnTokenId={currentTurnTokenId} />
            <TokenDetailsPanel token={currentTurnToken} />
          </div>
        )}
      </div>
    </SyncedAssetsContext.Provider>
  )
}
