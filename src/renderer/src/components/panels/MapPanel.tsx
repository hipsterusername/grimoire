import { useState, useId } from 'react'
import { useEncounterStore, useCanvasStore } from '../../stores'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'

export function MapPanel() {
  const encounter = useEncounterStore((s) => s.encounter)
  const updateMapGrid = useEncounterStore((s) => s.updateMapGrid)
  const toggleFog = useEncounterStore((s) => s.toggleFog)
  const clearAllFog = useEncounterStore((s) => s.clearAllFog)
  const resetFog = useEncounterStore((s) => s.resetFog)
  const clearMap = useEncounterStore((s) => s.clearMap)

  const zoomToFit = useCanvasStore((s) => s.zoomToFit)
  const viewportSize = useCanvasStore((s) => s.viewportSize)

  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [showResetFogConfirm, setShowResetFogConfirm] = useState(false)
  const mapHeadingId = useId()
  const fogHeadingId = useId()
  const gridSizeId = useId()

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
        <h3 id={mapHeadingId} className="font-semibold mb-3">Map Settings</h3>

        {map ? (
          <div className="space-y-4">
            {/* Map info */}
            <div className="text-sm text-muted-foreground">
              <div className="truncate font-medium text-foreground" title={map.name}>
                {map.name}
              </div>
              <div>{map.imageWidth} x {map.imageHeight} px</div>
            </div>

            {/* Grid settings */}
            <div className="space-y-2">
              <label htmlFor={gridSizeId} className="text-sm font-medium block">
                Grid Size: {gridSettings?.gridSize ?? 50}px
              </label>
              <input
                id={gridSizeId}
                type="range"
                min={20}
                max={100}
                value={gridSettings?.gridSize ?? 50}
                onChange={(e) => updateMapGrid({ gridSize: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                aria-valuemin={20}
                aria-valuemax={100}
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
                  className="flex-1 min-h-[36px] px-3 py-1.5 text-xs font-medium bg-secondary rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5"
                  aria-label="Fit map to current view"
                >
                  <Icon name="fit-screen" size={14} />
                  Fit to View
                </button>
              </Tooltip>
              <Tooltip content="Remove the current map image">
                <button
                  onClick={handleRemoveMap}
                  className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-1.5"
                  aria-label="Remove map image"
                >
                  <Icon name="trash" size={14} />
                  Remove
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-2">
            No map loaded. Upload a map image or generate a grid using the toolbar buttons above.
          </p>
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
