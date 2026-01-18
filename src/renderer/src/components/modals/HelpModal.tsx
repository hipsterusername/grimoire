import { useEffect, useRef, useCallback, useState } from 'react'
import { Icon } from '../ui/Icon'

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  label: string
  description: string
  category: 'tools' | 'navigation' | 'actions' | 'modifiers'
}

const SHORTCUTS: ShortcutItem[] = [
  // Tools
  { keys: ['V'], label: 'Select', description: 'Select and move tokens on the map', category: 'tools' },
  { keys: ['H'], label: 'Pan', description: 'Click and drag to pan around the map', category: 'tools' },
  { keys: ['R'], label: 'Reveal', description: 'Reveal areas hidden by fog of war', category: 'tools' },
  { keys: ['F'], label: 'Hide', description: 'Hide areas with fog of war', category: 'tools' },
  { keys: ['C'], label: 'Conditions', description: 'Quick-add conditions to selected token', category: 'tools' },

  // Navigation
  { keys: ['Space'], label: 'Quick Pan', description: 'Hold to temporarily pan while using other tools', category: 'navigation' },
  { keys: ['Scroll'], label: 'Zoom', description: 'Mouse wheel to zoom in and out', category: 'navigation' },
  { keys: ['Middle'], label: 'Pan', description: 'Middle mouse button to pan', category: 'navigation' },

  // Actions
  { keys: ['Ctrl', 'S'], label: 'Save', description: 'Save the current encounter', category: 'actions' },
  { keys: ['Ctrl', 'R'], label: 'Recenter', description: 'Fit the map to the viewport', category: 'actions' },
  { keys: ['Delete'], label: 'Remove', description: 'Remove selected token from the map', category: 'actions' },
  { keys: ['Esc'], label: 'Close', description: 'Close dialogs and deselect', category: 'actions' },
]

const TIPS = [
  { icon: 'sparkles', text: 'Double-click a token to open its editor' },
  { icon: 'eye', text: 'Fog of war processes chronologically—newest actions take priority' },
  { icon: 'frame', text: 'Use presentation bounds to show players only part of the map' },
  { icon: 'dice', text: 'Initiative panel tracks turn order during combat' },
  { icon: 'users', text: 'Right-click tokens for quick actions like duplicate or remove' },
]

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  tools: { label: 'Tools', icon: 'cursor' },
  navigation: { label: 'Navigation', icon: 'hand' },
  actions: { label: 'Actions', icon: 'keyboard' },
}

/** Animated keyboard key component */
function KeyCap({ children, isModifier = false }: { children: string; isModifier?: boolean }) {
  const isSpecial = ['Space', 'Scroll', 'Middle', 'Delete', 'Esc'].includes(children)

  return (
    <kbd
      className={`
        inline-flex items-center justify-center
        font-mono text-[11px] font-semibold tracking-wide uppercase
        rounded-[5px] border border-border/80
        bg-gradient-to-b from-muted/90 to-muted/50
        text-foreground/90
        shadow-[0_2px_0_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.08)]
        transition-all duration-100
        ${isSpecial || isModifier ? 'px-2 py-1 min-w-[28px]' : 'w-7 h-7'}
      `}
    >
      {children}
    </kbd>
  )
}

/** Shortcut row with animated key preview */
function ShortcutRow({ shortcut, index }: { shortcut: ShortcutItem; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group flex items-center gap-4 py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/30 transition-colors duration-150"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Key combo */}
      <div className="flex items-center gap-1 shrink-0 w-24">
        {shortcut.keys.map((key, i) => (
          <span key={key} className="flex items-center">
            <KeyCap isModifier={['Ctrl', 'Alt', 'Shift', 'Meta'].includes(key)}>
              {key}
            </KeyCap>
            {i < shortcut.keys.length - 1 && (
              <span className="mx-0.5 text-muted-foreground/40 text-xs">+</span>
            )}
          </span>
        ))}
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground/90">
            {shortcut.label}
          </span>
          <span
            className={`
              text-xs text-muted-foreground/70
              transition-all duration-200
              ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
            `}
          >
            {shortcut.description}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Category section */
function ShortcutCategory({
  category,
  shortcuts,
  startIndex
}: {
  category: string
  shortcuts: ShortcutItem[]
  startIndex: number
}) {
  const meta = CATEGORY_LABELS[category]

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon name={meta.icon} size={14} className="text-primary" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
          {meta.label}
        </h3>
      </div>
      <div className="space-y-0.5">
        {shortcuts.map((shortcut, i) => (
          <ShortcutRow
            key={shortcut.label}
            shortcut={shortcut}
            index={startIndex + i}
          />
        ))}
      </div>
    </div>
  )
}

/** Quick tip card */
function TipCard({ icon, text, index }: { icon: string; text: string; index: number }) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10"
      style={{
        animationDelay: `${index * 50 + 200}ms`,
      }}
    >
      <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon} size={12} className="text-accent" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  )
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'tips'>('shortcuts')

  // Store the previously focused element and manage focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      requestAnimationFrame(() => {
        dialogRef.current?.focus()
      })
    } else {
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Tab switching with arrow keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setActiveTab((prev) => (prev === 'shortcuts' ? 'tips' : 'shortcuts'))
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [isOpen, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  // Group shortcuts by category
  const toolShortcuts = SHORTCUTS.filter((s) => s.category === 'tools')
  const navShortcuts = SHORTCUTS.filter((s) => s.category === 'navigation')
  const actionShortcuts = SHORTCUTS.filter((s) => s.category === 'actions')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      {/* Backdrop with subtle pattern */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        tabIndex={-1}
        className="relative bg-secondary rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-border/50"
        style={{
          animation: 'help-modal-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header with decorative accent line */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Accent line at top */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon name="help-circle" size={22} className="text-primary" />
              </div>
              <div>
                <h2 id="help-title" className="text-lg font-semibold text-foreground">
                  Quick Reference
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keyboard shortcuts and tips
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 -mr-1 -mt-1 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close help"
            >
              <Icon name="x" size={18} />
            </button>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-1 mt-5 p-1 bg-muted/30 rounded-lg">
            <button
              onClick={() => setActiveTab('shortcuts')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-150
                ${activeTab === 'shortcuts'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon name="keyboard" size={16} />
              Shortcuts
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-150
                ${activeTab === 'tips'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Icon name="sparkles" size={16} />
              Tips
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {activeTab === 'shortcuts' ? (
            <div className="space-y-6">
              <ShortcutCategory
                category="tools"
                shortcuts={toolShortcuts}
                startIndex={0}
              />
              <ShortcutCategory
                category="navigation"
                shortcuts={navShortcuts}
                startIndex={toolShortcuts.length}
              />
              <ShortcutCategory
                category="actions"
                shortcuts={actionShortcuts}
                startIndex={toolShortcuts.length + navShortcuts.length}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Pro tips to help you get the most out of Grimoire
              </p>
              {TIPS.map((tip, i) => (
                <TipCard key={i} icon={tip.icon} text={tip.text} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Footer with keyboard hint */}
        <div className="px-6 py-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <KeyCap>Esc</KeyCap>
                <span>to close</span>
              </span>
              <span className="flex items-center gap-1.5">
                <KeyCap>←</KeyCap>
                <KeyCap>→</KeyCap>
                <span>to switch tabs</span>
              </span>
            </div>
            <span className="text-accent/70">Press <KeyCap>?</KeyCap> anytime for help</span>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes help-modal-in {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
