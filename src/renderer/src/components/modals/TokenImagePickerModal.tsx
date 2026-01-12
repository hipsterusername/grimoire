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
      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upload'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upload New
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'library'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          From Library ({library.assets.length})
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-4">
          {!originalPreview ? (
            // Upload button
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full min-h-[120px] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Icon name="spinner" className="animate-spin" size={32} />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <Icon name="upload" size={32} className="text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload image</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF</span>
                </>
              )}
            </button>
          ) : (
            // Preview area
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Original */}
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Original</p>
                  <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-muted">
                    <img
                      src={originalPreview}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Processed */}
                <div className="text-center">
                  <p className="text-sm font-medium mb-2">Result</p>
                  <div className="w-32 h-32 mx-auto flex items-center justify-center">
                    {isProcessing ? (
                      <Icon name="spinner" className="animate-spin" size={32} />
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

              <p className="text-xs text-center text-muted-foreground">
                Image will be cropped to circle with metallic gold border
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setOriginalPreview(null)
                    setProcessedPreview(null)
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Choose Different
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={!processedPreview || isProcessing}
                  className="flex-1 min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Use This Image'}
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <p className="text-sm text-destructive text-center">{uploadError}</p>
          )}
        </div>
      )}

      {activeTab === 'library' && (
        <div>
          {library.assets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Icon name="image" size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No images in library yet.</p>
              <p className="text-xs mt-1">Upload an image to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
              {library.assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleSelectFromLibrary(asset.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    currentAssetId === asset.id
                      ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-secondary'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  <img
                    src={asset.processedDataUrl}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                  />
                  {currentAssetId === asset.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Icon name="eye" className="text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
