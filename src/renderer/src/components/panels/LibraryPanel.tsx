import { useState, useMemo, useEffect } from 'react'
import { useLibraryStore, useEncounterStore, useUIStore, useCanvasStore, usePresentationStore } from '../../stores'
import { Icon } from '../ui/Icon'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TokenType } from '../../types'
import { calculateTokenPlacement } from '../../lib/token-placement'
import { UI_TIMING } from '../../lib/constants'

// Simple debounce hook for search
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

type LibraryTab = 'players' | 'monsters'

export function LibraryPanel() {
  const library = useLibraryStore((s) => s.library)
  const removeTemplate = useLibraryStore((s) => s.removeTemplate)
  const duplicateTemplate = useLibraryStore((s) => s.duplicateTemplate)
  const incrementAssetUsage = useLibraryStore((s) => s.incrementAssetUsage)

  const encounter = useEncounterStore((s) => s.encounter)
  const addToken = useEncounterStore((s) => s.addToken)

  const viewportSize = useCanvasStore((s) => s.viewportSize)
  const view = useCanvasStore((s) => s.view)

  const isPresenting = usePresentationStore((s) => s.isPresenting)
  const presentationBounds = usePresentationStore((s) => s.bounds)

  const openModal = useUIStore((s) => s.openModal)

  const [activeTab, setActiveTab] = useState<LibraryTab>('players')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Debounce search query for performance with large libraries
  const debouncedSearch = useDebouncedValue(searchQuery, UI_TIMING.debounceMs)

  // Separate templates by type
  const playerTemplates = library.templates.filter((t) => t.type === TokenType.PlayerCharacter)
  const monsterTemplates = library.templates.filter(
    (t) => t.type === TokenType.Monster || t.type === TokenType.NonPlayerCharacter
  )

  // Filter templates by search query and active tab
  const currentTemplates = activeTab === 'players' ? playerTemplates : monsterTemplates
  const filteredTemplates = useMemo(() => {
    if (!debouncedSearch.trim()) return currentTemplates
    const lowerSearch = debouncedSearch.toLowerCase()
    return currentTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerSearch) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerSearch))
    )
  }, [currentTemplates, debouncedSearch])

  const handleAddToEncounter = (templateId: string) => {
    if (!encounter) return

    const template = library.templates.find((t) => t.id === templateId)
    if (!template) return

    const gridSize = encounter.map?.gridSettings.gridSize ?? 50
    const mapWidth = encounter.map?.imageWidth ?? 1000
    const mapHeight = encounter.map?.imageHeight ?? 800

    // Calculate placement - prioritizes presentation bounds when presenting
    const placement = calculateTokenPlacement({
      gridSize,
      tokens: encounter.tokens,
      mapWidth,
      mapHeight,
      isPresenting,
      presentationBounds: isPresenting ? presentationBounds : null,
      viewport: {
        width: viewportSize.width,
        height: viewportSize.height,
        panX: view.panX,
        panY: view.panY,
        zoom: view.zoom
      }
    })

    // Create token from template
    addToken({
      name: template.name,
      type: template.type,
      size: template.size,
      color: template.color,
      assetId: template.assetId,
      gridX: placement.gridX,
      gridY: placement.gridY,
      stats: {
        maxHp: template.stats.maxHp,
        currentHp: template.stats.maxHp,
        tempHp: 0,
        armorClass: template.stats.armorClass,
        initiativeModifier: template.stats.initiativeModifier ?? 0
      },
      conditions: [],
      notes: template.notes,
      visible: true
    })

    // Increment asset usage if template has one
    if (template.assetId) {
      incrementAssetUsage(template.assetId)
    }
  }

  const handleDuplicate = (templateId: string) => {
    duplicateTemplate(templateId)
  }

  const handleEdit = (templateId: string) => {
    openModal('template-editor', { templateId })
  }

  const handleDelete = (templateId: string) => {
    setDeleteConfirm(templateId)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      removeTemplate(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleCreateTemplate = () => {
    // Pass the default type based on active tab
    const defaultType = activeTab === 'players' ? TokenType.PlayerCharacter : TokenType.Monster
    openModal('template-editor', { templateId: null, defaultType })
  }

  // Get asset preview for a template
  const getAssetPreview = (assetId?: string) => {
    if (!assetId) return null
    const asset = library.assets.find((a) => a.id === assetId)
    return asset?.processedDataUrl
  }

  const emptyStateMessage =
    activeTab === 'players'
      ? { title: 'No player characters yet.', subtitle: 'Create a template for your players.' }
      : { title: 'No monsters yet.', subtitle: 'Create a template to reuse monsters.' }

  return (
    <div className="p-3 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Icon name="book" size={16} />
          Library
        </h3>
        <button
          onClick={handleCreateTemplate}
          className="min-w-[36px] min-h-[36px] p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          aria-label={`Create new ${activeTab === 'players' ? 'player' : 'monster'} template`}
        >
          <Icon name="plus" size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-3">
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-1 min-h-[36px] px-2 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'players'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="user" size={14} />
          Players ({playerTemplates.length})
        </button>
        <button
          onClick={() => setActiveTab('monsters')}
          className={`flex-1 min-h-[36px] px-2 py-1.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'monsters'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="skull" size={14} />
          Monsters ({monsterTemplates.length})
        </button>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full min-h-[40px] px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Template list */}
      {filteredTemplates.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          {currentTemplates.length === 0 ? (
            <>
              <Icon
                name={activeTab === 'players' ? 'user' : 'skull'}
                size={32}
                className="mx-auto mb-2 opacity-50"
              />
              <p className="text-sm">{emptyStateMessage.title}</p>
              <p className="text-xs mt-1">{emptyStateMessage.subtitle}</p>
            </>
          ) : (
            <>
              <p className="text-sm">No matching templates.</p>
              <p className="text-xs mt-1">Try a different search term.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredTemplates.map((template) => {
            const preview = getAssetPreview(template.assetId)
            return (
              <div
                key={template.id}
                className="bg-muted rounded-lg p-2 flex items-center gap-3"
              >
                {/* Token preview */}
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-border"
                  style={{ backgroundColor: template.color }}
                >
                  {preview ? (
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {template.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={template.name}>{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    HP: {template.stats.maxHp} | AC: {template.stats.armorClass}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAddToEncounter(template.id)}
                    disabled={!encounter}
                    className="min-w-[32px] min-h-[32px] p-1.5 rounded hover:bg-background transition-colors disabled:opacity-50"
                    title="Add to encounter"
                    aria-label={`Add ${template.name} to encounter`}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className="min-w-[32px] min-h-[32px] p-1.5 rounded hover:bg-background transition-colors"
                    title="Duplicate template"
                    aria-label={`Duplicate ${template.name}`}
                  >
                    <Icon name="copy" size={16} />
                  </button>
                  <button
                    onClick={() => handleEdit(template.id)}
                    className="min-w-[32px] min-h-[32px] p-1.5 rounded hover:bg-background transition-colors"
                    title="Edit template"
                    aria-label={`Edit ${template.name}`}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="min-w-[32px] min-h-[32px] p-1.5 rounded hover:bg-background text-destructive transition-colors"
                    title="Delete template"
                    aria-label={`Delete ${template.name}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
