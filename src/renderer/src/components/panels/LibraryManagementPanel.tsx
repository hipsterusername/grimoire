import { useState, useMemo, useEffect } from 'react'
import { useLibraryStore, useUIStore } from '../../stores'
import { Icon } from '../ui/Icon'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TokenType } from '../../types'
import { UI_TIMING } from '../../lib/constants'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

type LibraryTab = 'players' | 'monsters'

export function LibraryManagementPanel() {
  const library = useLibraryStore((s) => s.library)
  const removeTemplate = useLibraryStore((s) => s.removeTemplate)
  const duplicateTemplate = useLibraryStore((s) => s.duplicateTemplate)

  const openModal = useUIStore((s) => s.openModal)

  const [activeTab, setActiveTab] = useState<LibraryTab>('players')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    name: string
  } | null>(null)

  const debouncedSearch = useDebouncedValue(searchQuery, UI_TIMING.debounceMs)

  const playerTemplates = library.templates.filter((t) => t.type === TokenType.PlayerCharacter)
  const monsterTemplates = library.templates.filter(
    (t) => t.type === TokenType.Monster || t.type === TokenType.NonPlayerCharacter
  )

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

  const handleDuplicate = (templateId: string) => {
    duplicateTemplate(templateId)
  }

  const handleEdit = (templateId: string) => {
    openModal('template-editor', { templateId })
  }

  const handleDeleteTemplate = (templateId: string, name: string) => {
    setDeleteConfirm({ id: templateId, name })
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      removeTemplate(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleCreateTemplate = () => {
    const defaultType = activeTab === 'players' ? TokenType.PlayerCharacter : TokenType.Monster
    openModal('template-editor', { templateId: null, defaultType })
  }

  const getAssetPreview = (assetId?: string) => {
    if (!assetId) return null
    const asset = library.assets.find((a) => a.id === assetId)
    return asset?.processedDataUrl
  }

  const emptyStateMessage = {
    players: { title: 'No player characters yet.', subtitle: 'Create templates for your players.' },
    monsters: { title: 'No monsters yet.', subtitle: 'Create reusable monster templates.' }
  }

  return (
    <div className="bg-secondary rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Icon name="book" size={18} />
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
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'players'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="user" size={16} />
          Players ({playerTemplates.length})
        </button>
        <button
          onClick={() => setActiveTab('monsters')}
          className={`flex-1 min-h-[44px] px-3 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'monsters'
              ? 'border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="skull" size={16} />
          Monsters ({monsterTemplates.length})
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Icon
            name="search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
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

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {currentTemplates.length === 0 ? (
              <>
                <Icon
                  name={activeTab === 'players' ? 'user' : 'skull'}
                  size={32}
                  className="mx-auto mb-2 opacity-50"
                />
                <p className="text-sm">{emptyStateMessage[activeTab].title}</p>
                <p className="text-xs mt-1">{emptyStateMessage[activeTab].subtitle}</p>
              </>
            ) : (
              <>
                <p className="text-sm">No matching templates.</p>
                <p className="text-xs mt-1">Try a different search term.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTemplates.map((template) => {
              const preview = getAssetPreview(template.assetId)
              return (
                <div
                  key={template.id}
                  className="bg-muted rounded-lg p-3 flex items-center gap-3"
                >
                  {/* Token preview */}
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-border"
                    style={{ backgroundColor: template.color }}
                  >
                    {preview ? (
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {template.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={template.name}>
                      {template.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      HP: {template.stats.maxHp} | AC: {template.stats.armorClass}
                      {template.stats.initiativeModifier !== undefined &&
                        template.stats.initiativeModifier !== 0 &&
                        ` | Init: ${template.stats.initiativeModifier >= 0 ? '+' : ''}${template.stats.initiativeModifier}`}
                    </p>
                    {template.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-xs bg-background rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{template.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDuplicate(template.id)}
                      className="min-w-[36px] min-h-[36px] p-2 rounded hover:bg-background transition-colors"
                      title="Duplicate template"
                      aria-label={`Duplicate ${template.name}`}
                    >
                      <Icon name="copy" size={16} />
                    </button>
                    <button
                      onClick={() => handleEdit(template.id)}
                      className="min-w-[36px] min-h-[36px] p-2 rounded hover:bg-background transition-colors"
                      title="Edit template"
                      aria-label={`Edit ${template.name}`}
                    >
                      <Icon name="edit" size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="min-w-[36px] min-h-[36px] p-2 rounded hover:bg-background text-destructive transition-colors"
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
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
