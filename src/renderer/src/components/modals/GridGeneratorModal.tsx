import { useState, useEffect, useId, useMemo } from 'react'
import { useEncounterStore, useUIStore } from '../../stores'
import { DEFAULT_MAP_SETTINGS } from '../../types'
import { generateGrid, type GridGeneratorOptions } from '../../lib/grid-generator'
import { Modal } from '../ui/Modal'
import { GRID_LIMITS, GRID_THEMES } from '../../lib/constants'

type GridTheme = GridGeneratorOptions['theme']

export function GridGeneratorModal() {
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(15)
  const [cellSize, setCellSize] = useState(50)
  const [theme, setTheme] = useState<GridTheme>('dungeon')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const widthId = useId()
  const heightId = useId()
  const cellSizeId = useId()

  const setMap = useEncounterStore((s) => s.setMap)
  const closeModal = useUIStore((s) => s.closeModal)

  // Calculate pixel dimensions and check limits
  const pixelWidth = width * cellSize
  const pixelHeight = height * cellSize
  const totalPixels = pixelWidth * pixelHeight
  const exceedsLimit = totalPixels > GRID_LIMITS.maxTotalPixels

  // Size warning message
  const sizeWarning = useMemo(() => {
    if (exceedsLimit) {
      return `Map size (${(totalPixels / 1000000).toFixed(1)}MP) exceeds the ${(GRID_LIMITS.maxTotalPixels / 1000000).toFixed(0)}MP limit. Reduce dimensions.`
    }
    if (totalPixels > GRID_LIMITS.maxTotalPixels * 0.75) {
      return 'Large map size may affect performance.'
    }
    return null
  }, [totalPixels, exceedsLimit])

  // Auto-generate preview when parameters change (debounced)
  useEffect(() => {
    if (exceedsLimit) {
      setPreviewUrl(null)
      return
    }

    setIsGenerating(true)
    const timeout = setTimeout(() => {
      try {
        const result = generateGrid({
          width,
          height,
          cellSize,
          theme
        })
        setPreviewUrl(result.imageDataUrl)
      } catch (error) {
        console.error('Failed to generate grid:', error)
        setPreviewUrl(null)
      } finally {
        setIsGenerating(false)
      }
    }, 300) // Debounce for performance

    return () => clearTimeout(timeout)
  }, [width, height, cellSize, theme, exceedsLimit])

  const handleUse = () => {
    if (!previewUrl || exceedsLimit) return

    const now = new Date().toISOString()

    setMap({
      id: crypto.randomUUID(),
      name: `Generated ${theme} map`,
      imageUrl: previewUrl,
      imageWidth: pixelWidth,
      imageHeight: pixelHeight,
      gridSettings: {
        ...DEFAULT_MAP_SETTINGS,
        gridSize: cellSize
      },
      gridOffsetX: 0,
      gridOffsetY: 0,
      createdAt: now,
      updatedAt: now
    })

    closeModal()
  }

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Generate Grid Map"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-4">
          {/* Theme */}
          <fieldset>
            <legend className="block text-sm font-medium mb-2">Theme</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Grid theme selection">
              {GRID_THEMES.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`min-h-[56px] p-3 rounded-lg text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    theme === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-opacity-80'
                  }`}
                  role="radio"
                  aria-checked={theme === opt.value}
                  aria-label={`${opt.label}: ${opt.description}`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs opacity-80">{opt.description}</div>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={widthId} className="block text-sm font-medium mb-1">
                Width: {width} squares
              </label>
              <input
                id={widthId}
                type="range"
                min={GRID_LIMITS.minWidth}
                max={GRID_LIMITS.maxWidth}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                aria-valuemin={GRID_LIMITS.minWidth}
                aria-valuemax={GRID_LIMITS.maxWidth}
                aria-valuenow={width}
                aria-valuetext={`${width} squares wide`}
              />
            </div>
            <div>
              <label htmlFor={heightId} className="block text-sm font-medium mb-1">
                Height: {height} squares
              </label>
              <input
                id={heightId}
                type="range"
                min={GRID_LIMITS.minHeight}
                max={GRID_LIMITS.maxHeight}
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                aria-valuemin={GRID_LIMITS.minHeight}
                aria-valuemax={GRID_LIMITS.maxHeight}
                aria-valuenow={height}
                aria-valuetext={`${height} squares tall`}
              />
            </div>
          </div>

          {/* Cell size */}
          <div>
            <label htmlFor={cellSizeId} className="block text-sm font-medium mb-1">
              Cell Size: {cellSize}px
            </label>
            <input
              id={cellSizeId}
              type="range"
              min={GRID_LIMITS.minCellSize}
              max={GRID_LIMITS.maxCellSize}
              value={cellSize}
              onChange={(e) => setCellSize(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              aria-valuemin={GRID_LIMITS.minCellSize}
              aria-valuemax={GRID_LIMITS.maxCellSize}
              aria-valuenow={cellSize}
              aria-valuetext={`${cellSize} pixels per cell`}
            />
          </div>

          {/* Info */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Final size: {pixelWidth} x {pixelHeight} pixels ({(totalPixels / 1000000).toFixed(2)} megapixels)
            </p>
            {sizeWarning && (
              <p
                className={`text-xs ${exceedsLimit ? 'text-destructive' : 'text-warning'}`}
                role="alert"
              >
                {sizeWarning}
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div>
          <p className="block text-sm font-medium mb-2">Preview</p>
          <div
            className="aspect-square bg-background rounded-lg overflow-hidden flex items-center justify-center relative"
            role="img"
            aria-label={previewUrl ? `Generated ${theme} grid preview, ${width} by ${height} squares` : 'Grid preview area'}
          >
            {isGenerating && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Generated ${theme} grid, ${width} by ${height} squares`}
                className="max-w-full max-h-full object-contain"
              />
            ) : exceedsLimit ? (
              <p className="text-destructive text-sm text-center px-4">
                Map too large to preview
              </p>
            ) : (
              <p className="text-muted-foreground text-sm text-center px-4">
                Generating preview...
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={closeModal}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleUse}
          disabled={!previewUrl || exceedsLimit}
          className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Use This Grid
        </button>
      </div>
    </Modal>
  )
}
