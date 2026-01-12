import { useState, useId } from 'react'
import { useEncounterStore, useUIStore } from '../../stores'
import { DEFAULT_MAP_SETTINGS } from '../../types'
import { Modal } from '../ui/Modal'
import { validateImageDataUrl, validateImageDimensions, IMAGE_LIMITS } from '../../lib/image-processor'

export function MapUploadModal() {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [gridSize, setGridSize] = useState(50)
  const [mapName, setMapName] = useState('Battle Map')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const mapNameId = useId()
  const gridSizeId = useId()

  const setMap = useEncounterStore((s) => s.setMap)
  const closeModal = useUIStore((s) => s.closeModal)

  const handleUpload = async () => {
    setIsUploading(true)
    setUploadError(null)
    try {
      const result = await window.electronAPI.uploadImage('map')

      if (!result) {
        // User cancelled file picker
        setIsUploading(false)
        return
      }

      // Get the image as data URL for preview and use
      const dataUrl = await window.electronAPI.getImageDataUrl(result.path)

      if (!dataUrl) {
        throw new Error('Failed to read image file')
      }

      // Validate file size first (synchronous, fast)
      const sizeValidation = validateImageDataUrl(dataUrl, {
        maxFileSizeMB: IMAGE_LIMITS.maxFileSizeMB
      })
      if (!sizeValidation.valid) {
        setUploadError(sizeValidation.error ?? 'Image file is too large')
        setIsUploading(false)
        return
      }

      // Validate dimensions (requires loading image)
      const dimensionValidation = await validateImageDimensions(dataUrl, {
        maxDimension: IMAGE_LIMITS.maxDimension,
        minDimension: 50 // Minimum map size
      })
      if (!dimensionValidation.valid) {
        setUploadError(dimensionValidation.error ?? 'Image dimensions are invalid')
        setIsUploading(false)
        return
      }

      setPreviewUrl(dataUrl)
      setImageDimensions({
        width: dimensionValidation.width!,
        height: dimensionValidation.height!
      })
      setMapName(result.filename.replace(/\.\w+$/, ''))
    } catch (error) {
      console.error('Failed to upload image:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleConfirm = () => {
    if (!previewUrl || !imageDimensions) return

    const now = new Date().toISOString()

    setMap({
      id: crypto.randomUUID(),
      name: mapName,
      imageUrl: previewUrl,
      imageWidth: imageDimensions.width,
      imageHeight: imageDimensions.height,
      gridSettings: {
        ...DEFAULT_MAP_SETTINGS,
        gridSize
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
      title="Upload Battle Map"
      size="xl"
    >
      {!previewUrl ? (
        <div className="space-y-4">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary focus-visible:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
            aria-label="Upload map image"
            aria-describedby="upload-hint"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <p className="text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <svg className="w-12 h-12 mx-auto mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg mb-2 font-medium">Click to upload an image</p>
                <p id="upload-hint" className="text-sm text-muted-foreground">
                  Supports PNG, JPG, WEBP, and GIF
                </p>
              </>
            )}
          </button>

          {uploadError && (
            <p className="text-sm text-destructive" role="alert">
              {uploadError}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative aspect-video bg-background rounded-lg overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview of the selected battle map"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Map info */}
          {imageDimensions && (
            <p className="text-sm text-muted-foreground">
              {imageDimensions.width} × {imageDimensions.height} pixels
            </p>
          )}

          {/* Map name */}
          <div>
            <label htmlFor={mapNameId} className="block text-sm font-medium mb-1">
              Map Name
            </label>
            <input
              id={mapNameId}
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              maxLength={100}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Grid size */}
          <div>
            <label htmlFor={gridSizeId} className="block text-sm font-medium mb-1">
              Grid Size: {gridSize}px per square
            </label>
            <input
              id={gridSizeId}
              type="range"
              min={20}
              max={100}
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              aria-valuemin={20}
              aria-valuemax={100}
              aria-valuenow={gridSize}
              aria-valuetext={`${gridSize} pixels per grid square`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Adjust to match your map's grid. You can fine-tune this later.
            </p>
          </div>

          {/* Change image */}
          <button
            onClick={() => {
              setPreviewUrl(null)
              setImageDimensions(null)
              setUploadError(null)
            }}
            className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Choose different image
          </button>
        </div>
      )}

      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={closeModal}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Cancel
        </button>
        {previewUrl && (
          <button
            onClick={handleConfirm}
            disabled={!mapName.trim()}
            className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
          >
            Use This Map
          </button>
        )}
      </div>
    </Modal>
  )
}
