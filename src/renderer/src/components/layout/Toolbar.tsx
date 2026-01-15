import { useState, useEffect, useRef } from 'react'
import { useEncounterStore, useCanvasStore, usePresentationStore, useCampaignStore, useUIStore } from '../../stores'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TOOLS } from '../../lib/constants'
import type { CanvasTool } from '../../types'

const FOG_TOOLS: CanvasTool[] = ['fog-reveal', 'fog-hide']

/** Toolbar group wrapper with subtle background and refined spacing */
function ToolGroup({
  children,
  label,
  variant = 'default'
}: {
  children: React.ReactNode
  label: string
  variant?: 'default' | 'compact'
}) {
  return (
    <div
      className={`flex items-center rounded-lg ${
        variant === 'compact' ? 'gap-0.5 p-0.5' : 'gap-1 p-1'
      } bg-background/40`}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}

/** Small icon button for tool palette */
function ToolButton({
  icon,
  label,
  shortcut,
  hint,
  isActive,
  isDisabled,
  onClick,
  size = 'default',
  activeColor = 'primary'
}: {
  icon: string
  label: string
  shortcut?: string
  hint?: string
  isActive?: boolean
  isDisabled?: boolean
  onClick: () => void
  size?: 'default' | 'small'
  activeColor?: 'primary' | 'accent' | 'cyan'
}) {
  const sizeClasses = size === 'small'
    ? 'w-7 h-7'
    : 'w-8 h-8'

  const activeClasses = {
    primary: 'bg-primary text-primary-foreground shadow-sm shadow-primary/30',
    accent: 'bg-accent text-accent-foreground shadow-sm shadow-accent/30',
    cyan: 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
  }

  // Build tooltip content with optional hint
  const tooltipContent = isDisabled
    ? `${label} (Fog disabled)`
    : hint
      ? <span>{label}<span className="block text-[10px] opacity-70 mt-0.5">{hint}</span></span>
      : label

  return (
    <Tooltip
      content={tooltipContent}
      shortcut={shortcut}
    >
      <button
        onClick={onClick}
        className={`${sizeClasses} flex items-center justify-center rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-secondary ${
          isActive
            ? activeClasses[activeColor]
            : isDisabled
              ? 'text-muted-foreground/30 hover:text-muted-foreground/50 hover:bg-muted/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
        }`}
        aria-label={`${label}${shortcut ? ` (${shortcut})` : ''}${hint ? ` - ${hint}` : ''}${isDisabled ? ' - Fog of War disabled' : ''}`}
        aria-pressed={isActive}
      >
        <Icon name={icon} size={size === 'small' ? 14 : 16} />
      </button>
    </Tooltip>
  )
}

export function Toolbar() {
  const encounter = useEncounterStore((s) => s.encounter)
  const isDirty = useEncounterStore((s) => s.isDirty)
  const saveEncounter = useEncounterStore((s) => s.saveEncounter)
  const closeEncounter = useEncounterStore((s) => s.closeEncounter)
  const toggleFog = useEncounterStore((s) => s.toggleFog)

  const activeCampaign = useCampaignStore((s) => s.activeCampaign)

  const activeTool = useCanvasStore((s) => s.activeTool)
  const setTool = useCanvasStore((s) => s.setTool)
  const zoomIn = useCanvasStore((s) => s.zoomIn)
  const zoomOut = useCanvasStore((s) => s.zoomOut)
  const resetZoom = useCanvasStore((s) => s.resetZoom)
  const view = useCanvasStore((s) => s.view)

  const isPresenting = usePresentationStore((s) => s.isPresenting)
  const startPresentation = usePresentationStore((s) => s.startPresentation)
  const stopPresentation = usePresentationStore((s) => s.stopPresentation)

  const openModal = useUIStore((s) => s.openModal)

  const [isSaving, setIsSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showFogEnableConfirm, setShowFogEnableConfirm] = useState(false)
  const [pendingFogTool, setPendingFogTool] = useState<CanvasTool | null>(null)
  const [isCompact, setIsCompact] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const isFogEnabled = encounter?.fogOfWar?.enabled ?? false

  // Responsive check
  useEffect(() => {
    const checkWidth = () => {
      if (toolbarRef.current) {
        setIsCompact(toolbarRef.current.offsetWidth < 700)
      }
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Save shortcut
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        saveEncounter()
        return
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, CanvasTool> = {
        v: 'select',
        h: 'pan',
        r: 'fog-reveal',
        f: 'fog-hide'
      }

      const tool = toolShortcuts[e.key.toLowerCase()]
      if (tool && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // If clicking a fog tool while fog is disabled, prompt to enable
        if (FOG_TOOLS.includes(tool) && !isFogEnabled) {
          setPendingFogTool(tool)
          setShowFogEnableConfirm(true)
          return
        }
        setTool(tool)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTool, isFogEnabled, saveEncounter])

  // Listen for presentation window being closed externally
  useEffect(() => {
    const unsubscribe = window.electronAPI.onPresentationClosed(() => {
      // Update local state when presentation window is closed
      usePresentationStore.setState({ isPresenting: false })
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await saveEncounter()
    } finally {
      setIsSaving(false)
    }
  }

  const handlePresentationToggle = async () => {
    if (isPresenting) {
      await stopPresentation()
    } else {
      await startPresentation()
    }
  }

  const handleClose = () => {
    if (isDirty) {
      setShowCloseConfirm(true)
    } else {
      closeEncounter()
    }
  }

  const confirmClose = () => {
    setShowCloseConfirm(false)
    closeEncounter()
  }

  const handleToolClick = (toolId: CanvasTool) => {
    // If clicking a fog tool while fog is disabled, prompt to enable
    if (FOG_TOOLS.includes(toolId) && !isFogEnabled) {
      setPendingFogTool(toolId)
      setShowFogEnableConfirm(true)
      return
    }
    setTool(toolId)
  }

  const confirmEnableFog = () => {
    toggleFog(true)
    if (pendingFogTool) {
      setTool(pendingFogTool)
    }
    setShowFogEnableConfirm(false)
    setPendingFogTool(null)
  }

  // Group tools into navigation vs fog
  const navigationTools = TOOLS.filter(t => !FOG_TOOLS.includes(t.id))
  const fogTools = TOOLS.filter(t => FOG_TOOLS.includes(t.id))

  return (
    <>
      <div
        ref={toolbarRef}
        className="flex items-center h-11 px-2 bg-secondary/80 backdrop-blur-sm border-b border-border/60 gap-3"
        role="toolbar"
        aria-label="Battle map controls"
      >
        {/* === Left section: Navigation & Document === */}
        <div className="flex items-center gap-2">
          {/* Back button */}
          <Tooltip content={activeCampaign ? `Back to ${activeCampaign.name}` : 'Close encounter'}>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={activeCampaign ? `Return to ${activeCampaign.name}` : 'Close encounter'}
            >
              <Icon name="arrow-left" size={16} />
            </button>
          </Tooltip>

          {/* Document info */}
          <div className="flex items-center gap-1.5 pl-1 pr-2 border-l border-border/40">
            <span
              className="text-sm font-medium text-foreground/90 truncate max-w-[140px]"
              title={encounter?.name}
            >
              {encounter?.name}
            </span>
            {isDirty && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                title="Unsaved changes"
                aria-live="polite"
              />
            )}
          </div>

          {/* Save button - subtle when clean, prominent when dirty */}
          <Tooltip content={isDirty ? 'Save changes' : 'Saved'} shortcut="Ctrl+S">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5 ${
                isDirty
                  ? 'bg-accent/90 text-accent-foreground hover:bg-accent shadow-sm shadow-accent/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              } disabled:opacity-50 disabled:cursor-wait`}
              aria-label={isDirty ? 'Save encounter (unsaved changes)' : 'Save encounter'}
            >
              {isSaving ? (
                <Icon name="spinner" size={12} className="animate-spin" />
              ) : (
                <Icon name="save" size={12} />
              )}
              {!isCompact && <span>{isDirty ? 'Save' : 'Saved'}</span>}
            </button>
          </Tooltip>
        </div>

        {/* === Center section: Tools === */}
        <div className="flex items-center gap-2 mx-auto">
          {/* Navigation tools */}
          <ToolGroup label="Navigation tools" variant="compact">
            {navigationTools.map((tool) => (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                hint={'hint' in tool ? tool.hint : undefined}
                isActive={activeTool === tool.id}
                onClick={() => handleToolClick(tool.id)}
              />
            ))}
          </ToolGroup>

          {/* Fog tools */}
          <ToolGroup label="Fog of war tools" variant="compact">
            {fogTools.map((tool) => (
              <ToolButton
                key={tool.id}
                icon={tool.icon}
                label={tool.label}
                shortcut={tool.shortcut}
                isActive={activeTool === tool.id}
                isDisabled={!isFogEnabled}
                onClick={() => handleToolClick(tool.id)}
              />
            ))}
          </ToolGroup>

        </div>

        {/* === Right section: View controls & Presentation === */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <ToolGroup label="Zoom controls" variant="compact">
            <ToolButton
              icon="zoom-out"
              label="Zoom out"
              onClick={zoomOut}
              size="small"
            />
            <Tooltip content="Reset zoom">
              <button
                onClick={resetZoom}
                className="h-7 px-1.5 min-w-[42px] text-[11px] tabular-nums font-medium text-muted-foreground hover:text-foreground rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Zoom: ${Math.round(view.zoom * 100)}%. Click to reset`}
              >
                {Math.round(view.zoom * 100)}%
              </button>
            </Tooltip>
            <ToolButton
              icon="zoom-in"
              label="Zoom in"
              onClick={zoomIn}
              size="small"
            />
          </ToolGroup>

          {/* Presentation controls */}
          <div className="flex items-center gap-1 pl-2 border-l border-border/40">
            <Tooltip content={isPresenting ? 'End presentation' : 'Present to players'}>
              <button
                onClick={handlePresentationToggle}
                className={`h-8 px-3 text-xs font-medium rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5 ${
                  isPresenting
                    ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30 hover:bg-cyan-500'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                aria-label={isPresenting ? 'Stop presenting' : 'Start presenting'}
                aria-pressed={isPresenting}
              >
                <Icon name={isPresenting ? 'monitor-off' : 'monitor'} size={14} />
                {!isCompact && <span>{isPresenting ? 'Live' : 'Present'}</span>}
              </button>
            </Tooltip>

            {isPresenting && (
              <ToolButton
                icon="frame"
                label="Edit frame"
                isActive={activeTool === 'presentation-bounds'}
                onClick={() => setTool(activeTool === 'presentation-bounds' ? 'select' : 'presentation-bounds')}
                activeColor="cyan"
              />
            )}
          </div>

          {/* Settings */}
          <Tooltip content="Settings">
            <button
              onClick={() => openModal('settings')}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open settings"
            >
              <Icon name="settings" size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Close confirmation dialog */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close this encounter? Your changes will be lost."
        confirmLabel="Close Without Saving"
        cancelLabel="Keep Editing"
        variant="warning"
        onConfirm={confirmClose}
        onCancel={() => setShowCloseConfirm(false)}
      />

      {/* Fog of War enable dialog */}
      <ConfirmDialog
        isOpen={showFogEnableConfirm}
        title="Enable Fog of War"
        message="Fog of War is currently disabled. Would you like to enable it to use the fog tools?"
        confirmLabel="Enable Fog of War"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={confirmEnableFog}
        onCancel={() => {
          setShowFogEnableConfirm(false)
          setPendingFogTool(null)
        }}
      />
    </>
  )
}
