import { useState, useMemo } from 'react'
import { useCampaignStore, useUIStore } from '../../stores'
import { Icon } from '../ui/Icon'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import type { CampaignListItem } from '../../types'

type SortField = 'name' | 'updatedAt'
type SortDirection = 'asc' | 'desc'

function GrimoireLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 115"
      fill="currentColor"
      width={size}
      height={size * 1.15}
      className={className}
      aria-hidden="true"
    >
      {/* Shield outline */}
      <path d="M50 15 Q15 15 8 20 Q5 22 5 27 L5 58 Q5 92 50 112 Q95 92 95 58 L95 27 Q95 22 92 20 Q85 15 50 15 Z M50 23 Q80 23 88 27 L88 58 Q88 86 50 104 Q12 86 12 58 L12 27 Q20 23 50 23 Z" />
      {/* Banner */}
      <path d="M63 4 L63 42 L72 33 L81 42 L81 4 Q72 7 63 4 Z" />
      {/* Star */}
      <path d="M50 34 Q52 48 54 52 Q58 53 74 56 Q58 59 54 60 Q52 64 50 80 Q48 64 46 60 Q42 59 26 56 Q42 53 46 52 Q48 48 50 34 Z" />
    </svg>
  )
}

export function CampaignSelectScreen() {
  const campaigns = useCampaignStore((s) => s.campaigns)
  const isLoading = useCampaignStore((s) => s.isLoading)
  const error = useCampaignStore((s) => s.error)
  const loadCampaign = useCampaignStore((s) => s.loadCampaign)
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign)
  const importCampaign = useCampaignStore((s) => s.importCampaign)
  const openModal = useUIStore((s) => s.openModal)

  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CampaignListItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      )
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
  }, [campaigns, searchQuery, sortField, sortDirection])

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
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
  }

  const handleLoad = async (id: string) => {
    setLoadingId(id)
    await loadCampaign(id)
    setLoadingId(null)
  }

  const handleDelete = (campaign: CampaignListItem) => {
    setDeleteConfirm(campaign)
  }

  const confirmDelete = async () => {
    if (deleteConfirm) {
      await deleteCampaign(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  const handleImport = async () => {
    const campaign = await importCampaign()
    if (campaign) {
      await loadCampaign(campaign.id)
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

  if (isLoading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <main className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 py-6 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GrimoireLogo size={40} className="text-white" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Grimoire</h1>
              <p className="text-sm text-muted-foreground">Battle Map Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openModal('settings')}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Settings"
            >
              <Icon name="settings" size={18} />
            </button>
            <button
              onClick={handleImport}
              className="min-h-[44px] px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
              aria-label="Import campaign"
            >
              <Icon name="upload" size={18} />
              Import
            </button>
            <button
              onClick={() => openModal('new-campaign')}
              className="min-h-[44px] px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
            >
              <Icon name="plus" size={18} />
              New Campaign
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {error && (
            <div
              className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive flex-shrink-0"
              role="alert"
            >
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs mt-1 opacity-80">{error}</p>
            </div>
          )}

          {campaigns.length > 0 ? (
            <section className="flex flex-col h-full" aria-labelledby="campaigns-heading">
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
                    placeholder="Search campaigns..."
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

              {/* Campaign count */}
              <div className="flex-shrink-0 mb-4">
                <h2 id="campaigns-heading" className="text-sm text-muted-foreground">
                  {filteredCampaigns.length === campaigns.length
                    ? `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`
                    : `${filteredCampaigns.length} of ${campaigns.length} campaigns`}
                </h2>
              </div>

              {/* Campaign grid */}
              {filteredCampaigns.length > 0 ? (
                <div
                  className="flex-1 overflow-y-auto min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min"
                  role="list"
                  aria-label="List of campaigns"
                >
                  {filteredCampaigns.map((campaign) => {
                    const isLoadingThis = loadingId === campaign.id
                    return (
                      <div
                        key={campaign.id}
                        className="group relative bg-secondary rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
                        role="listitem"
                      >
                        {/* Color accent bar */}
                        <div
                          className="absolute top-0 left-0 w-1.5 h-full"
                          style={{ backgroundColor: campaign.color }}
                        />

                        <button
                          onClick={() => handleLoad(campaign.id)}
                          disabled={isLoadingThis}
                          className="w-full p-4 pl-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset disabled:opacity-50"
                          aria-label={`Open campaign: ${campaign.name}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg overflow-hidden"
                              style={{ backgroundColor: campaign.color }}
                            >
                              {isLoadingThis ? (
                                <LoadingSpinner size="sm" />
                              ) : campaign.icon ? (
                                <img
                                  src={window.electronAPI.getLocalFileUrl(campaign.icon)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                campaign.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {campaign.name}
                              </h3>
                              {campaign.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                  {campaign.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Icon name="map" size={14} />
                                  {campaign.encounterCount} encounter
                                  {campaign.encounterCount !== 1 ? 's' : ''}
                                </span>
                                <span>{formatRelativeDate(campaign.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Action buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(campaign)
                            }}
                            className="p-2 rounded-lg bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Delete ${campaign.name}`}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
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
              <div className="text-center py-12 px-8 bg-secondary rounded-xl max-w-md">
                <div className="mx-auto mb-4">
                  <GrimoireLogo size={64} className="text-white mx-auto" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Grimoire</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first campaign to start organizing encounters, maps, and monster
                  templates for your tabletop adventures.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleImport}
                    className="min-h-[44px] px-4 py-2 border border-border rounded-lg font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
                  >
                    <Icon name="upload" size={18} />
                    Import Campaign
                  </button>
                  <button
                    onClick={() => openModal('new-campaign')}
                    className="min-h-[44px] px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
                  >
                    <Icon name="plus" size={18} />
                    Create Campaign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will permanently remove all ${deleteConfirm?.encounterCount ?? 0} encounters and the campaign library. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </main>
  )
}
