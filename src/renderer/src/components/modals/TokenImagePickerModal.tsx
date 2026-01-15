import { useState, useEffect } from 'react'
import { useLibraryStore } from '../../stores'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { processTokenImage, hashImageData, validateImageDataUrl, IMAGE_LIMITS } from '../../lib/image-processor'

interface TokenImagePickerModalProps {
  onSelectAsset: (assetId: string) => void
  onClose: () => void
  currentAssetId?: string
}

export function TokenImagePickerModal({ onSelectAsset, onClose, currentAssetId }: TokenImagePickerModalProps) {
  const library = useLibraryStore((s) => s.library)
  const addAsset = useLibraryStore((s) => s.addAsset)
  const findAssetByHash = useLibraryStore((s) => s.findAssetByHash)

  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [processedPreview, setProcessedPreview] = useState<string | null>(null)
  const [originalFilename, setOriginalFilename] = useState<string>('')
  const [originalPath, setOriginalPath] = useState<string>('')

  // Reset state when modal opens
  useEffect(() => {
    setOriginalPreview(null)
    setProcessedPreview(null)
    setUploadError(null)
    setIsUploading(false)
    setIsProcessing(false)
  }, [])

  const handleUpload = async () => {
    setUploadError(null)
    setIsUploading(true)

    try {
      const result = await window.electronAPI.uploadImage('token')
      if (!result) {
        setIsUploading(false)
        return // User cancelled
      }

      const dataUrl = await window.electronAPI.getImageDataUrl(result.path)
      if (!dataUrl) {
        throw new Error('Failed to load image')
      }

      // Validate file size for token images (smaller limit than maps)
      const validation = validateImageDataUrl(dataUrl, {
        maxFileSizeMB: IMAGE_LIMITS.tokenMaxFileSizeMB
      })
      if (!validation.valid) {
        setUploadError(validation.error ?? 'Image file is too large')
        setIsUploading(false)
        return
      }

      setOriginalPreview(dataUrl)
      setOriginalFilename(result.filename)
      setOriginalPath(result.path)
      setIsUploading(false)

      // Process the image
      setIsProcessing(true)
      const processed = await processTokenImage(dataUrl)
      setProcessedPreview(processed.dataUrl)
      setIsProcessing(false)
    } catch (error) {
      setUploadError((error as Error).message)
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  const handleConfirmUpload = async () => {
    if (!originalPreview || !processedPreview) return

    setIsProcessing(true)

    try {
      // Check for duplicate by hash
      const hash = await hashImageData(originalPreview)
      const existingAsset = findAssetByHash(hash)

      if (existingAsset) {
        // Asset already exists, reuse it
        onSelectAsset(existingAsset.id)
        onClose()
        return
      }

      // Save the processed image to disk
      await window.electronAPI.saveAsset({
        filename: originalFilename.replace(/\.[^.]+$/, '.png'),
        dataUrl: processedPreview
      })

      // Add to library
      const assetId = addAsset({
        filename: originalFilename,
        originalPath: originalPath,
        processedDataUrl: processedPreview,
        hash,
        width: 256,
        height: 256
      })

      onSelectAsset(assetId)
      onClose()
    } catch (error) {
      setUploadError((error as Error).message)
      setIsProcessing(false)
    }
  }

  const handleSelectFromLibrary = (assetId: string) => {
    onSelectAsset(assetId)
    onClose()
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Token Image" size="lg">
      {/* Tabs - refined with pill-style indicator */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-5">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 h-9 px-4 text-sm font-medium rounded-md transition-all ${
            activeTab === 'upload'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upload New
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 h-9 px-4 text-sm font-medium rounded-md transition-all ${
            activeTab === 'library'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          From Library
          {library.assets.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({library.assets.length})</span>
          )}
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-4">
          {!originalPreview ? (
            // Upload button - refined dashed border
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full min-h-[140px] border border-dashed border-border/80 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/60 hover:bg-primary/5 transition-all disabled:opacity-50 group"
            >
              {isUploading ? (
                <>
                  <Icon name="spinner" className="animate-spin text-muted-foreground" size={28} />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-muted/70 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Icon name="upload" size={22} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium">Click to upload image</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF</span>
                </>
              )}
            </button>
          ) : (
            // Preview area - refined layout
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-8">
                {/* Original */}
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Original</p>
                  <div className="w-28 h-28 rounded-lg overflow-hidden bg-muted/50 ring-1 ring-border/50">
                    <img
                      src={originalPreview}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-muted-foreground/50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Processed */}
                <div className="text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Result</p>
                  <div className="w-28 h-28 flex items-center justify-center">
                    {isProcessing ? (
                      <Icon name="spinner" className="animate-spin text-muted-foreground" size={28} />
                    ) : processedPreview ? (
                      <img
                        src={processedPreview}
                        alt="Processed"
                        className="w-full h-full object-contain"
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-muted-foreground">
                Image will be cropped to circle with metallic gold border
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOriginalPreview(null)
                    setProcessedPreview(null)
                  }}
                  className="flex-1 h-10 px-4 text-sm rounded-lg border border-border/60 hover:bg-muted/70 transition-colors"
                >
                  Choose Different
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={!processedPreview || isProcessing}
                  className="flex-1 h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Use This Image'}
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-destructive text-center py-2" role="alert">{uploadError}</p>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div>
          {library.assets.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <Icon name="image" size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-0.5">No images in library</p>
              <p className="text-xs text-muted-foreground">Upload an image to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 max-h-[280px] overflow-y-auto p-0.5">
              {library.assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectFromLibrary(asset.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    currentAssetId === asset.id
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-secondary'
                      : 'ring-1 ring-border/50 hover:ring-primary/50'
                  }`}
                >
                  <img
                    src={asset.processedDataUrl}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                  />
                  {currentAssetId === asset.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="check" size={14} className="text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6 pt-4 border-t border-border/50">
        <button
          onClick={onClose}
          className="h-10 px-4 text-sm rounded-lg hover:bg-muted/70 transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
