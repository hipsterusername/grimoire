import { useState, useMemo, useEffect } from 'react'
import { useLibraryStore, useUIStore } from '../../stores'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { UI_TIMING } from '../../lib/constants'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export function AssetManagementModal() {
  const library = useLibraryStore((s) => s.library)
  const removeAsset = useLibraryStore((s) => s.removeAsset)
  const closeModal = useUIStore((s) => s.closeModal)

  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    name: string
    usageCount: number
  } | null>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, UI_TIMING.debounceMs)

  const getTemplatesUsingAsset = (assetId: string) => {
    return library.templates.filter((t) => t.assetId === assetId)
  }

  const filteredAssets = useMemo(() => {
    if (!debouncedSearch.trim()) return library.assets
    const lowerSearch = debouncedSearch.toLowerCase()
    return library.assets.filter((a) => a.filename.toLowerCase().includes(lowerSearch))
  }, [library.assets, debouncedSearch])

  const handleDeleteAsset = (assetId: string, filename: string) => {
    const usageCount = getTemplatesUsingAsset(assetId).length
    setDeleteConfirm({ id: assetId, name: filename, usageCount })
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      removeAsset(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const totalAssets = library.assets.length
  const unusedAssets = library.assets.filter(
    (a) => getTemplatesUsingAsset(a.id).length === 0
  ).length

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Manage Token Images"
      size="lg"
      ariaDescribedBy="asset-management-desc"
    >
      <p id="asset-management-desc" className="sr-only">
        View and manage token images stored in your campaign library
      </p>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold">{totalAssets}</p>
          <p className="text-xs text-muted-foreground">Total images</p>
        </div>
        <div className="flex-1 p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold">{totalAssets - unusedAssets}</p>
          <p className="text-xs text-muted-foreground">In use</p>
        </div>
        <div className="flex-1 p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-warning">{unusedAssets}</p>
          <p className="text-xs text-muted-foreground">Unused</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[40px] pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Asset grid */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {library.assets.length === 0 ? (
              <>
                <Icon name="image" size={48} className="mx-auto mb-3 opacity-50" />
                <p>No token images yet.</p>
                <p className="text-sm mt-1">
                  Images are added when you upload them to templates.
                </p>
              </>
            ) : (
              <>
                <Icon name="search" size={48} className="mx-auto mb-3 opacity-50" />
                <p>No matching images.</p>
                <p className="text-sm mt-1">Try a different search term.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filteredAssets.map((asset) => {
              const usedBy = getTemplatesUsingAsset(asset.id)
              const isUnused = usedBy.length === 0
              return (
                <div
                  key={asset.id}
                  className={`group relative rounded-lg overflow-hidden aspect-square border-2 ${
                    isUnused ? 'border-warning/50' : 'border-transparent'
                  }`}
                >
                  <img
                    src={asset.processedDataUrl}
                    alt={asset.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                    <p
                      className="text-xs text-white text-center truncate w-full"
                      title={asset.filename}
                    >
                      {asset.filename}
                    </p>
                    <p
                      className={`text-xs ${isUnused ? 'text-warning' : 'text-white/70'}`}
                    >
                      {usedBy.length === 0
                        ? 'Not used'
                        : `Used by ${usedBy.length} template${usedBy.length !== 1 ? 's' : ''}`}
                    </p>
                    <button
                      onClick={() => handleDeleteAsset(asset.id, asset.filename)}
                      className={`mt-1 p-2 rounded-lg transition-colors ${
                        isUnused
                          ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                          : 'bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
                      }`}
                      title={isUnused ? 'Delete unused image' : 'Delete image (in use)'}
                      aria-label={`Delete ${asset.filename}`}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  {isUnused && (
                    <div className="absolute top-1 right-1 p-1 bg-warning rounded-full">
                      <Icon name="alert-triangle" size={12} className="text-warning-foreground" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-6 pt-4 border-t border-border/50">
        <button
          onClick={closeModal}
          className="h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Done
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Image"
        message={
          deleteConfirm?.usageCount && deleteConfirm.usageCount > 0
            ? `"${deleteConfirm?.name}" is used by ${deleteConfirm.usageCount} template${deleteConfirm.usageCount !== 1 ? 's' : ''}. Deleting it will remove the image from those templates. Are you sure?`
            : `Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Modal>
  )
}
