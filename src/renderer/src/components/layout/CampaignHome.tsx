import { useState, useMemo, useEffect } from 'react'
import { useEncounterStore, useCampaignStore, useUIStore, useLibraryStore } from '../../stores'
import { Icon } from '../ui/Icon'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { LibraryManagementPanel } from '../panels/LibraryManagementPanel'

type SortField = 'name' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

export function CampaignHome() {
  const activeCampaign = useCampaignStore((s) => s.activeCampaign)
  const closeCampaign = useCampaignStore((s) => s.closeCampaign)
  const exportCampaign = useCampaignStore((s) => s.exportCampaign)

  const recentEncounters = useEncounterStore((s) => s.recentEncounters)
  const loadEncounter = useEncounterStore((s) => s.loadEncounter)
  const deleteEncounter = useEncounterStore((s) => s.deleteEncounter)
  const fetchRecentEncounters = useEncounterStore((s) => s.fetchRecentEncounters)
  const error = useEncounterStore((s) => s.error)

  const loadLibrary = useLibraryStore((s) => s.loadLibrary)
  const openModal = useUIStore((s) => s.openModal)

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    fetchRecentEncounters()
    loadLibrary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredEncounters = useMemo(() => {
    let filtered = recentEncounters

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((enc) => enc.name.toLowerCase().includes(query))
    }

    return [...filtered].sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [recentEncounters, searchQuery, sortField, sortDirection])

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  }

  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(dateString)
  }

  const handleLoad = async (id: string) => {
    setLoadingId(id)
    await loadEncounter(id)
    setLoadingId(null)
  }

  const handleDelete = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteEncounter(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleExport = async () => {
    if (activeCampaign) {
      await exportCampaign(activeCampaign.id)
    }
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection(field === 'name' ? 'asc' : 'desc')
    }
  }

  if (!activeCampaign) {
    return null
  }

  return (
    <main className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 py-4 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={closeCampaign}
              className="min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Back to campaigns"
            >
              <Icon name="arrow-left" size={20} />
            </button>

            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: activeCampaign.color }}
            >
              {activeCampaign.icon ? (
                <img
                  src={window.electronAPI.getLocalFileUrl(activeCampaign.icon)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                activeCampaign.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {activeCampaign.name}
              </h1>
              {activeCampaign.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {activeCampaign.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="min-h-[44px] px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
                aria-label="Export campaign"
              >
                <Icon name="download" size={18} />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => openModal('campaign-settings', { campaignId: activeCampaign.id })}
                className="min-h-[44px] px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Campaign settings"
              >
                <Icon name="settings" size={18} />
              </button>
              <button
                onClick={() => openModal('new-encounter')}
                className="min-h-[44px] px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
              >
                <Icon name="plus" size={18} />
                <span className="hidden sm:inline">New Encounter</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-6xl mx-auto h-full flex gap-6">
          {/* Encounters section */}
          <div className="flex-1 flex flex-col min-w-0">
            {error && (
              <div
                className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive flex-shrink-0"
                role="alert"
              >
                <p className="text-sm font-medium">Failed to load encounter</p>
                <p className="text-xs mt-1 opacity-80">{error}</p>
              </div>
            )}

            {recentEncounters.length > 0 ? (
              <section className="flex flex-col h-full" aria-labelledby="encounters-heading">
                {/* Search and sort controls */}
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Icon
                      name="search"
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Search encounters..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <Icon name="x" size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSort('name')}
                      className={`min-h-[44px] px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                        sortField === 'name'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                      aria-pressed={sortField === 'name'}
                    >
                      Name
                      {sortField === 'name' && (
                        <Icon
                          name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                          size={14}
                        />
                      )}
                    </button>
                    <button
                      onClick={() => toggleSort('updatedAt')}
                      className={`min-h-[44px] px-4 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                        sortField === 'updatedAt'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted'
                      }`}
                      aria-pressed={sortField === 'updatedAt'}
                    >
                      Date
                      {sortField === 'updatedAt' && (
                        <Icon
                          name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                          size={14}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Encounter count */}
                <div className="flex-shrink-0 mb-2">
                  <h2 id="encounters-heading" className="text-sm text-muted-foreground">
                    {filteredEncounters.length === recentEncounters.length
                      ? `${recentEncounters.length} encounter${recentEncounters.length !== 1 ? 's' : ''}`
                      : `${filteredEncounters.length} of ${recentEncounters.length} encounters`}
                  </h2>
                </div>

                {/* Encounter list */}
                {filteredEncounters.length > 0 ? (
                  <ul
                    className="flex-1 space-y-2 overflow-y-auto min-h-0"
                    role="list"
                    aria-label="List of encounters"
                  >
                    {filteredEncounters.map((enc) => {
                      const isLoading = loadingId === enc.id
                      return (
                        <li key={enc.id}>
                          <div className="w-full p-4 bg-secondary rounded-lg flex items-center gap-4 group hover:bg-secondary/80 transition-colors">
                            <button
                              onClick={() => handleLoad(enc.id)}
                              disabled={isLoading}
                              className="flex-1 min-h-[44px] text-left hover:bg-muted -m-2 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                              aria-label={`Open encounter: ${enc.name}`}
                            >
                              <div
                                className="font-medium truncate flex items-center gap-2"
                                title={enc.name}
                              >
                                {isLoading && <LoadingSpinner size="sm" />}
                                {enc.name}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <time dateTime={enc.updatedAt} title={formatDate(enc.updatedAt)}>
                                  {formatRelativeDate(enc.updatedAt)}
                                </time>
                              </div>
                            </button>

                            <button
                              onClick={() => handleDelete(enc.id, enc.name)}
                              className="min-w-[40px] min-h-[40px] p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Delete ${enc.name}`}
                            >
                              <Icon name="trash" size={18} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-12 px-6">
                      <Icon
                        name="search"
                        size={48}
                        className="mx-auto mb-4 text-muted-foreground opacity-50"
                      />
                      <p className="text-lg font-medium mb-2">No matches found</p>
                      <p className="text-sm text-muted-foreground">Try a different search term</p>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-12 px-6 bg-secondary rounded-lg max-w-md">
                  <Icon name="map" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No encounters yet</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Create your first encounter to start building battle maps for this campaign.
                  </p>
                  <button
                    onClick={() => openModal('new-encounter')}
                    className="min-h-[44px] px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 mx-auto"
                  >
                    <Icon name="plus" size={18} />
                    Create Encounter
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Library section */}
          <div className="w-[400px] flex-shrink-0 overflow-hidden">
            <LibraryManagementPanel />
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Encounter"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </main>
  )
}
