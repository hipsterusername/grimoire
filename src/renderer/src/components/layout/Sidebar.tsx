import { useEffect, useState } from 'react'
import { useUIStore } from '../../stores'
import { TokenPanel } from '../panels/TokenPanel'
import { InitiativePanel } from '../panels/InitiativePanel'
import { MapPanel } from '../panels/MapPanel'
import { LibraryPanel } from '../panels/LibraryPanel'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'

type PanelId = 'tokens' | 'initiative' | 'map' | 'library'

const panels: { id: PanelId; label: string; icon: string }[] = [
  { id: 'tokens', label: 'Tokens', icon: 'users' },
  { id: 'initiative', label: 'Initiative', icon: 'sort' },
  { id: 'map', label: 'Map', icon: 'grid' },
  { id: 'library', label: 'Library', icon: 'book' }
]

export function Sidebar() {
  const activePanels = useUIStore((s) => s.activePanels)
  const togglePanel = useUIStore((s) => s.togglePanel)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  // Auto-collapse on small screens
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  useEffect(() => {
    const checkWidth = () => {
      const small = window.innerWidth < 900
      setIsSmallScreen(small)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Collapsed state (either manually collapsed or small screen with no panels open)
  if (sidebarCollapsed) {
    return (
      <aside
        className="w-12 bg-secondary flex flex-col"
        aria-label="Sidebar (collapsed)"
      >
        <Tooltip content="Expand sidebar" position="left">
          <button
            onClick={toggleSidebar}
            className="min-h-[44px] p-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            aria-label="Expand sidebar"
            aria-expanded="false"
          >
            <Icon name="chevron-left" size={16} />
          </button>
        </Tooltip>

        {/* Quick access icons when collapsed */}
        <div className="flex flex-col gap-1 p-1 mt-2 border-t border-border">
          {panels.map((panel) => {
            const isActive = activePanels.includes(panel.id)
            return (
              <Tooltip key={panel.id} content={panel.label} position="left">
                <button
                  onClick={() => {
                    togglePanel(panel.id)
                    if (!isActive) {
                      toggleSidebar() // Expand when opening a panel
                    }
                  }}
                  className={`min-w-[40px] min-h-[40px] p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  aria-label={`${isActive ? 'Hide' : 'Show'} ${panel.label} panel`}
                  aria-pressed={isActive}
                >
                  <Icon name={panel.icon} size={18} />
                </button>
              </Tooltip>
            )
          })}
        </div>
      </aside>
    )
  }

  const sidebarWidth = isSmallScreen ? 'w-72' : 'w-80'

  return (
    <aside
      className={`${sidebarWidth} bg-secondary flex flex-col overflow-hidden`}
      aria-label="Sidebar panels"
    >
      {/* Panel toggle buttons - NOT tabs (these toggle visibility, not switch views) */}
      <div
        className="flex border-b border-border"
        role="group"
        aria-label="Toggle panel visibility"
      >
        {panels.map((panel) => {
          const isActive = activePanels.includes(panel.id)
          return (
            <Tooltip key={panel.id} content={`${isActive ? 'Hide' : 'Show'} ${panel.label}`}>
              <button
                onClick={() => togglePanel(panel.id)}
                className={`flex-1 min-h-[44px] px-2 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-muted border-b-2 border-primary'
                    : 'hover:bg-muted opacity-60 hover:opacity-100'
                }`}
                aria-pressed={isActive}
                aria-label={`${isActive ? 'Hide' : 'Show'} ${panel.label} panel`}
              >
                <Icon name={panel.icon} size={14} />
                <span className={isSmallScreen ? 'sr-only' : ''}>{panel.label}</span>
              </button>
            </Tooltip>
          )
        })}

        <Tooltip content="Collapse sidebar" position="left">
          <button
            onClick={toggleSidebar}
            className="min-w-[44px] px-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            aria-label="Collapse sidebar"
            aria-expanded="true"
          >
            <Icon name="chevron-right" size={16} />
          </button>
        </Tooltip>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {activePanels.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No panels visible.</p>
            <p className="text-xs mt-2">Click the buttons above to show panels.</p>
          </div>
        ) : (
          <>
            {activePanels.includes('tokens') && (
              <section aria-label="Tokens panel">
                <TokenPanel />
              </section>
            )}
            {activePanels.includes('initiative') && (
              <section aria-label="Initiative panel">
                <InitiativePanel />
              </section>
            )}
            {activePanels.includes('map') && (
              <section aria-label="Map panel">
                <MapPanel />
              </section>
            )}
            {activePanels.includes('library') && (
              <section aria-label="Library panel">
                <LibraryPanel />
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
