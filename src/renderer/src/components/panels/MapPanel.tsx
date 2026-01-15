import { useState, useId, useEffect } from 'react'
import { useEncounterStore, useCanvasStore, useUIStore } from '../../stores'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { GRID_LIMITS } from '../../lib/constants'

export function MapPanel() {
  const encounter = useEncounterStore((s) => s.encounter)
  const updateMapGrid = useEncounterStore((s) => s.updateMapGrid)
  const resizeMap = useEncounterStore((s) => s.resizeMap)
  const toggleFog = useEncounterStore((s) => s.toggleFog)
  const clearAllFog = useEncounterStore((s) => s.clearAllFog)
  const resetFog = useEncounterStore((s) => s.resetFog)
  const clearMap = useEncounterStore((s) => s.clearMap)

  const zoomToFit = useCanvasStore((s) => s.zoomToFit)
  const viewportSize = useCanvasStore((s) => s.viewportSize)

  const openModal = useUIStore((s) => s.openModal)

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showResetFogConfirm, setShowResetFogConfirm] = useState(false)
  const [showResizeControls, setShowResizeControls] = useState(false)
  const [resizeWidth, setResizeWidth] = useState<number | ''>(1000)
  const [resizeHeight, setResizeHeight] = useState<number | ''>(800)
  const [aspectLocked, setAspectLocked] = useState(true)
  const [aspectRatio, setAspectRatio] = useState(1)
  const mapHeadingId = useId()
  const fogHeadingId = useId()
  const gridSizeId = useId()
  const mapWidthId = useId()
  const mapHeightId = useId()

  // Sync resize inputs with current map dimensions
  useEffect(() => {
    if (encounter?.map) {
      setResizeWidth(encounter.map.imageWidth)
      setResizeHeight(encounter.map.imageHeight)
      setAspectRatio(encounter.map.imageWidth / encounter.map.imageHeight)
    }
  }, [encounter?.map?.imageWidth, encounter?.map?.imageHeight])

  const handleWidthChange = (value: string) => {
    if (value === '') {
      setResizeWidth('')
      return
    }
    const num = parseInt(value, 10)
    if (!isNaN(num)) {
      const clamped = Math.min(4000, num)
      setResizeWidth(clamped)
      if (aspectLocked && clamped > 0) {
        setResizeHeight(Math.round(clamped / aspectRatio))
      }
    }
  }

  const handleHeightChange = (value: string) => {
    if (value === '') {
      setResizeHeight('')
      return
    }
    const num = parseInt(value, 10)
    if (!isNaN(num)) {
      const clamped = Math.min(4000, num)
      setResizeHeight(clamped)
      if (aspectLocked && clamped > 0) {
        setResizeWidth(Math.round(clamped * aspectRatio))
      }
    }
  }

  const handleBlur = (field: 'width' | 'height') => {
    if (field === 'width') {
      if (resizeWidth === '' || resizeWidth < 100) {
        setResizeWidth(100)
        if (aspectLocked) {
          setResizeHeight(Math.round(100 / aspectRatio))
        }
      }
    } else {
      if (resizeHeight === '' || resizeHeight < 100) {
        setResizeHeight(100)
        if (aspectLocked) {
          setResizeWidth(Math.round(100 * aspectRatio))
        }
      }
    }
  }

  if (!encounter) return null

  const map = encounter.map
  const gridSettings = map?.gridSettings

  const handleZoomToFit = () => {
    if (map) {
      zoomToFit(viewportSize.width, viewportSize.height, map.imageWidth, map.imageHeight)
    }
  }

  const handleRemoveMap = () => {
    setShowRemoveConfirm(true)
  }

  const confirmRemoveMap = () => {
    clearMap()
    setShowRemoveConfirm(false)
  }

  const handleResetFog = () => {
    if (encounter.fogOfWar.revealedAreas.length > 0) {
      setShowResetFogConfirm(true)
    } else {
      resetFog()
    }
  }

  const confirmResetFog = () => {
    resetFog()
    setShowResetFogConfirm(false)
  }

  return (
    <>
      <section className="p-4 border-b border-border" aria-labelledby={mapHeadingId}>
        <h3 id={mapHeadingId} className="font-semibold mb-3">Map</h3>

        {map ? (
          <div className="space-y-4">
            {/* Map info */}
            <div className="text-sm text-muted-foreground">
              <div className="truncate font-medium text-foreground" title={map.name}>
                {map.name}
              </div>
              <button
                onClick={() => setShowResizeControls(!showResizeControls)}
                className="text-left hover:text-foreground transition-colors flex items-center gap-1"
              >
                {map.imageWidth} x {map.imageHeight} px
                <Icon name={showResizeControls ? 'chevron-up' : 'chevron-down'} size={12} />
              </button>
            </div>

            {/* Map resize controls */}
            {showResizeControls && (
              <div className="p-3 bg-background rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Resize Map</p>
                  <Tooltip content={aspectLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}>
                    <button
                      onClick={() => setAspectLocked(!aspectLocked)}
                      className={`p-1.5 rounded transition-colors ${
                        aspectLocked
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      aria-pressed={aspectLocked}
                      aria-label={aspectLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {aspectLocked ? (
                          <>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 019.9-1" />
                          </>
                        )}
                      </svg>
                    </button>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={mapWidthId} className="text-xs text-muted-foreground block mb-1">
                      Width (px)
                    </label>
                    <input
                      id={mapWidthId}
                      type="number"
                      min={100}
                      max={4000}
                      value={resizeWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      onBlur={() => handleBlur('width')}
                      className="w-full h-8 px-2 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor={mapHeightId} className="text-xs text-muted-foreground block mb-1">
                      Height (px)
                    </label>
                    <input
                      id={mapHeightId}
                      type="number"
                      min={100}
                      max={4000}
                      value={resizeHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      onBlur={() => handleBlur('height')}
                      className="w-full h-8 px-2 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
                {typeof resizeWidth === 'number' && typeof resizeHeight === 'number' && resizeWidth * resizeHeight > GRID_LIMITS.maxTotalPixels && (
                  <p className="text-xs text-destructive">
                    Exceeds {(GRID_LIMITS.maxTotalPixels / 1000000).toFixed(0)}MP limit
                  </p>
                )}
                <button
                  onClick={() => {
                    const w = typeof resizeWidth === 'number' ? resizeWidth : 100
                    const h = typeof resizeHeight === 'number' ? resizeHeight : 100
                    if (w * h <= GRID_LIMITS.maxTotalPixels) {
                      resizeMap(w, h)
                      setShowResizeControls(false)
                    }
                  }}
                  disabled={
                    resizeWidth === '' ||
                    resizeHeight === '' ||
                    (typeof resizeWidth === 'number' && typeof resizeHeight === 'number' && resizeWidth * resizeHeight > GRID_LIMITS.maxTotalPixels) ||
                    (resizeWidth === map.imageWidth && resizeHeight === map.imageHeight)
                  }
                  className="w-full min-h-[32px] px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Apply Size
                </button>
              </div>
            )}

            {/* Grid settings */}
            <div className="space-y-2">
              <label htmlFor={gridSizeId} className="text-sm font-medium block">
                Grid Size: {gridSettings?.gridSize ?? 50}px
              </label>
              <input
                id={gridSizeId}
                type="range"
                min={20}
                max={200}
                value={gridSettings?.gridSize ?? 50}
                onChange={(e) => updateMapGrid({ gridSize: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                aria-valuemin={20}
                aria-valuemax={200}
                aria-valuenow={gridSettings?.gridSize ?? 50}
                aria-valuetext={`${gridSettings?.gridSize ?? 50} pixels per grid square`}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={gridSettings?.showGrid ?? true}
                onChange={(e) => updateMapGrid({ showGrid: e.target.checked })}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm">Show grid overlay</span>
            </label>

            {/* Actions */}
            <div className="flex gap-2">
              <Tooltip content="Zoom to fit the entire map in view">
                <button
                  onClick={handleZoomToFit}
                  className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium bg-muted rounded hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5"
                  aria-label="Fit map to current view"
                >
                  <Icon name="fit-screen" size={14} />
                  Fit to View
                </button>
              </Tooltip>
              <Tooltip content="Remove the current map image">
                <button
                  onClick={handleRemoveMap}
                  className="min-h-[36px] px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5"
                  aria-label="Remove map image"
                >
                  <Icon name="trash" size={14} />
                  Remove
                </button>
              </Tooltip>
            </div>

            {/* Replace map options */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Replace map:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal('map-upload')}
                  className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium bg-muted rounded hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5"
                >
                  <Icon name="upload" size={14} />
                  Upload
                </button>
                <button
                  onClick={() => openModal('grid-generator')}
                  className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium bg-muted rounded hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5"
                >
                  <Icon name="grid" size={14} />
                  Generate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No map loaded. Upload an image or generate a grid.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => openModal('map-upload')}
                className="w-full min-h-[44px] px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
              >
                <Icon name="upload" size={16} />
                Upload Map Image
              </button>
              <button
                onClick={() => openModal('grid-generator')}
                className="w-full min-h-[44px] px-4 py-2 text-sm font-medium bg-muted rounded-lg hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
              >
                <Icon name="grid" size={16} />
                Generate Grid
              </button>
            </div>
          </div>
        )}

        {/* Fog of War section */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 id={fogHeadingId} className="font-semibold mb-3">Fog of War</h4>

          <div className="space-y-3" role="group" aria-labelledby={fogHeadingId}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={encounter.fogOfWar.enabled}
                onChange={(e) => toggleFog(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring"
                aria-describedby="fog-description"
              />
              <span className="text-sm">Enable fog of war</span>
            </label>
            <p id="fog-description" className="text-xs text-muted-foreground">
              Hide areas of the map from players until revealed.
            </p>

            {encounter.fogOfWar.enabled && (
              <div className="flex gap-2" role="group" aria-label="Fog visibility actions">
                <Tooltip content="Reveal entire map">
                  <button
                    onClick={clearAllFog}
                    className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium bg-secondary rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Reveal all fog, show entire map"
                  >
                    Reveal All
                  </button>
                </Tooltip>
                <Tooltip content="Cover entire map with fog">
                  <button
                    onClick={handleResetFog}
                    className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium bg-secondary rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Hide all areas, cover entire map with fog"
                  >
                    Hide All
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Remove map confirmation */}
      <ConfirmDialog
        isOpen={showRemoveConfirm}
        title="Remove Map"
        message="Remove the current map image? Tokens will remain but you'll need to upload a new map."
        confirmLabel="Remove Map"
        cancelLabel="Keep Map"
        variant="danger"
        onConfirm={confirmRemoveMap}
        onCancel={() => setShowRemoveConfirm(false)}
      />

      {/* Reset fog confirmation */}
      <ConfirmDialog
        isOpen={showResetFogConfirm}
        title="Reset Fog of War"
        message="This will hide all currently revealed areas. Are you sure?"
        confirmLabel="Hide All"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={confirmResetFog}
        onCancel={() => setShowResetFogConfirm(false)}
      />
    </>
  )
}
