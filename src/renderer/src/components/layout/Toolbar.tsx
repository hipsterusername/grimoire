import { useState, useEffect, useRef } from 'react'
import { useEncounterStore, useCanvasStore, useUIStore, usePresentationStore } from '../../stores'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TOOLS } from '../../lib/constants'
import type { CanvasTool } from '../../types'

const FOG_TOOLS: CanvasTool[] = ['fog-reveal', 'fog-hide']

export function Toolbar() {
  const encounter = useEncounterStore((s) => s.encounter)
  const isDirty = useEncounterStore((s) => s.isDirty)
  const saveEncounter = useEncounterStore((s) => s.saveEncounter)
  const closeEncounter = useEncounterStore((s) => s.closeEncounter)
  const toggleFog = useEncounterStore((s) => s.toggleFog)

  const activeTool = useCanvasStore((s) => s.activeTool)
  const setTool = useCanvasStore((s) => s.setTool)
  const zoomIn = useCanvasStore((s) => s.zoomIn)
  const zoomOut = useCanvasStore((s) => s.zoomOut)
  const resetZoom = useCanvasStore((s) => s.resetZoom)
  const view = useCanvasStore((s) => s.view)
  const brushSettings = useCanvasStore((s) => s.brushSettings)
  const setBrushSize = useCanvasStore((s) => s.setBrushSize)
  const setBrushShape = useCanvasStore((s) => s.setBrushShape)

  const openModal = useUIStore((s) => s.openModal)

  const isPresenting = usePresentationStore((s) => s.isPresenting)
  const startPresentation = usePresentationStore((s) => s.startPresentation)
  const stopPresentation = usePresentationStore((s) => s.stopPresentation)

  const [isSaving, setIsSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [showFogEnableConfirm, setShowFogEnableConfirm] = useState(false)
  const [pendingFogTool, setPendingFogTool] = useState<CanvasTool | null>(null)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const [isCompact, setIsCompact] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const overflowMenuRef = useRef<HTMLDivElement>(null)

  const isFogEnabled = encounter?.fogOfWar?.enabled ?? false
  const isFogToolActive = FOG_TOOLS.includes(activeTool)

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

  // Close overflow menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setShowOverflowMenu(false)
      }
    }
    if (showOverflowMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOverflowMenu])

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
        f: 'fog-hide',
        m: 'measure'
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

  const renderToolButton = (tool: (typeof TOOLS)[number]) => {
    const isActive = activeTool === tool.id
    const isFogTool = FOG_TOOLS.includes(tool.id)
    const isDisabled = isFogTool && !isFogEnabled

    return (
      <Tooltip
        key={tool.id}
        content={isDisabled ? `${tool.label} - Click to enable Fog of War` : tool.label}
        shortcut={tool.shortcut}
      >
        <button
          onClick={() => handleToolClick(tool.id)}
          className={`relative min-w-[40px] min-h-[40px] p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
            isActive
              ? 'bg-primary text-primary-foreground'
              : isDisabled
              ? 'text-muted-foreground/40 hover:bg-muted/50 hover:text-muted-foreground/60'
              : 'hover:bg-muted text-foreground'
          }`}
          aria-label={`${tool.label} tool (${tool.shortcut})${isDisabled ? ' - Fog of War disabled, click to enable' : ''}`}
          aria-pressed={isActive}
        >
          <Icon name={tool.icon} size={18} />
          {/* Disabled indicator for fog tools */}
          {isDisabled && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-muted-foreground/30 rounded-full flex items-center justify-center">
              <span className="w-1.5 h-0.5 bg-muted-foreground/60 rounded-full transform -rotate-45" />
            </span>
          )}
        </button>
      </Tooltip>
    )
  }

  return (
    <>
      <div
        ref={toolbarRef}
        className="flex items-center h-12 px-3 bg-secondary border-b border-border gap-2"
        role="toolbar"
        aria-label="Battle map controls"
      >
        {/* Back button */}
        <Tooltip content="Close encounter">
          <button
            onClick={handleClose}
            className="min-h-[40px] px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
            aria-label="Close encounter and return to home"
          >
            <Icon name="arrow-left" size={16} />
            {!isCompact && <span>Back</span>}
          </button>
        </Tooltip>

        {/* Encounter name */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <span
            className="font-medium truncate max-w-[150px] text-sm"
            title={encounter?.name}
          >
            {encounter?.name}
          </span>
          {isDirty && (
            <span
              className="text-xs text-warning font-medium"
              aria-live="polite"
            >
              {isCompact ? '*' : 'Unsaved'}
            </span>
          )}
        </div>

        {/* Save button */}
        <Tooltip content="Save encounter" shortcut="Ctrl+S">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-[40px] px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
            aria-label={isDirty ? 'Save encounter (unsaved changes)' : 'Save encounter'}
          >
            {isSaving ? (
              <Icon name="spinner" size={16} className="animate-spin" />
            ) : (
              <Icon name="save" size={16} />
            )}
            {!isCompact && <span>Save</span>}
          </button>
        </Tooltip>

        <div className="w-px h-6 bg-border" role="separator" aria-hidden="true" />

        {/* Tools */}
        <div className="flex items-center gap-1" role="group" aria-label="Drawing tools">
          {TOOLS.map(renderToolButton)}
        </div>

        {/* Fog Brush Controls - only visible when fog tool is active */}
        {isFogToolActive && isFogEnabled && (
          <>
            <div className="w-px h-6 bg-border" role="separator" aria-hidden="true" />

            <div className="flex items-center gap-1" role="group" aria-label="Brush settings">
              {/* Brush shape toggle */}
              <Tooltip content="Circle brush - click and drag to paint">
                <button
                  onClick={() => setBrushShape('circle')}
                  className={`min-w-[36px] min-h-[36px] p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    brushSettings.shape === 'circle'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  aria-label="Circle brush - click and drag to paint"
                  aria-pressed={brushSettings.shape === 'circle'}
                >
                  <Icon name="circle" size={16} />
                </button>
              </Tooltip>

              <Tooltip content="Rectangle - drag to draw area">
                <button
                  onClick={() => setBrushShape('square')}
                  className={`min-w-[36px] min-h-[36px] p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    brushSettings.shape === 'square'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                  aria-label="Rectangle - drag to draw area"
                  aria-pressed={brushSettings.shape === 'square'}
                >
                  <Icon name="square" size={16} />
                </button>
              </Tooltip>

              {/* Brush size slider - only for circle mode */}
              {brushSettings.shape === 'circle' && (
                <div className="flex items-center gap-2 px-2">
                  <Icon name="brush" size={14} className="text-muted-foreground" />
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={brushSettings.size}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20 h-1.5 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
                    aria-label={`Brush size: ${brushSettings.size}px`}
                  />
                  <span className="text-xs text-muted-foreground min-w-[32px]">{brushSettings.size}px</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="w-px h-6 bg-border" role="separator" aria-hidden="true" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1" role="group" aria-label="Zoom controls">
          <Tooltip content="Zoom out">
            <button
              onClick={zoomOut}
              className="min-w-[36px] min-h-[36px] p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Zoom out"
            >
              <Icon name="zoom-out" size={16} />
            </button>
          </Tooltip>

          <Tooltip content="Reset zoom to 100%">
            <button
              onClick={resetZoom}
              className="min-h-[36px] px-2 py-1 text-xs font-medium rounded-lg hover:bg-muted transition-colors min-w-[50px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Current zoom: ${Math.round(view.zoom * 100)}%. Click to reset to 100%`}
            >
              {Math.round(view.zoom * 100)}%
            </button>
          </Tooltip>

          <Tooltip content="Zoom in">
            <button
              onClick={zoomIn}
              className="min-w-[36px] min-h-[36px] p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Zoom in"
            >
              <Icon name="zoom-in" size={16} />
            </button>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-border" role="separator" aria-hidden="true" />

        {/* Presentation mode */}
        <Tooltip content={isPresenting ? 'Stop presenting' : 'Start presenting'}>
          <button
            onClick={handlePresentationToggle}
            className={`min-h-[40px] px-3 py-2 text-sm rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 ${
              isPresenting
                ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                : 'hover:bg-muted'
            }`}
            aria-label={isPresenting ? 'Stop presenting' : 'Start presenting'}
            aria-pressed={isPresenting}
          >
            <Icon name={isPresenting ? 'monitor-off' : 'monitor'} size={16} />
            {!isCompact && <span>{isPresenting ? 'Stop' : 'Present'}</span>}
          </button>
        </Tooltip>

        {/* Presentation bounds tool - only visible when presenting */}
        {isPresenting && (
          <Tooltip content="Edit presentation frame">
            <button
              onClick={() => setTool(activeTool === 'presentation-bounds' ? 'select' : 'presentation-bounds')}
              className={`min-w-[40px] min-h-[40px] p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                activeTool === 'presentation-bounds'
                  ? 'bg-cyan-600 text-white'
                  : 'hover:bg-muted text-foreground'
              }`}
              aria-label="Edit presentation frame"
              aria-pressed={activeTool === 'presentation-bounds'}
            >
              <Icon name="frame" size={18} />
            </button>
          </Tooltip>
        )}

        <div className="flex-1" />

        {/* Map actions - responsive */}
        {isCompact ? (
          <div className="relative" ref={overflowMenuRef}>
            <Tooltip content="More actions">
              <button
                onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                className="min-w-[40px] min-h-[40px] p-2 rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="More actions"
                aria-expanded={showOverflowMenu}
                aria-haspopup="menu"
              >
                <Icon name="menu" size={18} />
              </button>
            </Tooltip>

            {showOverflowMenu && (
              <div
                className="absolute right-0 top-full mt-1 py-1 bg-secondary border border-border rounded-lg shadow-lg z-50 min-w-[160px]"
                role="menu"
              >
                <button
                  onClick={() => {
                    openModal('map-upload')
                    setShowOverflowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-3"
                  role="menuitem"
                >
                  <Icon name="upload" size={16} />
                  Upload Map
                </button>
                <button
                  onClick={() => {
                    openModal('grid-generator')
                    setShowOverflowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-muted flex items-center gap-3"
                  role="menuitem"
                >
                  <Icon name="grid" size={16} />
                  Generate Grid
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2" role="group" aria-label="Map actions">
            <Tooltip content="Upload a battle map image">
              <button
                onClick={() => openModal('map-upload')}
                className="min-h-[40px] px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
              >
                <Icon name="upload" size={16} />
                Upload Map
              </button>
            </Tooltip>
            <Tooltip content="Generate a simple grid map">
              <button
                onClick={() => openModal('grid-generator')}
                className="min-h-[40px] px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
              >
                <Icon name="grid" size={16} />
                Generate Grid
              </button>
            </Tooltip>
          </div>
        )}
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
