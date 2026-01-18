import { useEffect, useRef, useCallback } from 'react'
import { Icon } from '../ui/Icon'
import { useUIStore, useEncounterStore } from '../../stores'

interface MenuItem {
  id: string
  label: string
  icon: string
  shortcut?: string
  danger?: boolean
  dividerAfter?: boolean
  action: () => void
}

export function TokenContextMenu() {
  const menuRef = useRef<HTMLDivElement>(null)
  const contextMenu = useUIStore((s) => s.contextMenu)
  const closeContextMenu = useUIStore((s) => s.closeContextMenu)
  const openModal = useUIStore((s) => s.openModal)
  const setEditingToken = useUIStore((s) => s.setEditingToken)
  const openQuickCondition = useUIStore((s) => s.openQuickCondition)

  const encounter = useEncounterStore((s) => s.encounter)
  const updateToken = useEncounterStore((s) => s.updateToken)
  const removeToken = useEncounterStore((s) => s.removeToken)
  const duplicateToken = useEncounterStore((s) => s.duplicateToken)

  const token = encounter?.tokens.find((t) => t.id === contextMenu?.tokenId)

  // Close on click outside
  useEffect(() => {
    if (!contextMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu()
      }
    }

    const handleScroll = () => closeContextMenu()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeContextMenu()
      }
    }

    // Small delay to prevent immediate close from the right-click event
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', handleScroll, true)
      document.addEventListener('keydown', handleKeyDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu, closeContextMenu])

  // Focus menu when opened
  useEffect(() => {
    if (contextMenu && menuRef.current) {
      menuRef.current.focus()
    }
  }, [contextMenu])

  const handleAction = useCallback((action: () => void) => {
    action()
    closeContextMenu()
  }, [closeContextMenu])

  if (!contextMenu || !token) return null

  const menuItems: MenuItem[] = [
    {
      id: 'edit',
      label: 'Edit Token',
      icon: 'edit',
      action: () => {
        setEditingToken(token.id)
        openModal('token-editor', { tokenId: token.id })
      }
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      action: () => duplicateToken(token.id)
    },
    {
      id: 'conditions',
      label: 'Add Condition',
      icon: 'plus',
      shortcut: 'C',
      dividerAfter: true,
      action: () => {
        openQuickCondition(token.id, contextMenu.screenX, contextMenu.screenY)
      }
    },
    {
      id: 'visibility',
      label: token.hidden ? 'Show Token' : 'Hide Token',
      icon: token.hidden ? 'eye' : 'eye-off',
      dividerAfter: true,
      action: () => updateToken(token.id, { hidden: !token.hidden })
    },
    {
      id: 'remove',
      label: 'Remove',
      icon: 'trash',
      shortcut: 'Del',
      danger: true,
      action: () => removeToken(token.id)
    }
  ]

  // Calculate position to keep menu on screen
  const menuWidth = 180
  const menuHeight = menuItems.length * 36 + 16 // rough estimate
  let x = contextMenu.screenX
  let y = contextMenu.screenY

  // Adjust if menu would go off screen (with some padding)
  if (typeof window !== 'undefined') {
    if (x + menuWidth > window.innerWidth - 16) {
      x = window.innerWidth - menuWidth - 16
    }
    if (y + menuHeight > window.innerHeight - 16) {
      y = window.innerHeight - menuHeight - 16
    }
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      className="fixed z-[100] min-w-[180px] py-1.5 bg-secondary rounded-lg shadow-xl border border-border/60 outline-none"
      style={{
        left: x,
        top: y,
        animation: 'context-menu-in 0.12s ease-out',
      }}
    >
      {/* Token name header */}
      <div className="px-3 py-1.5 mb-1 border-b border-border/40">
        <span className="text-xs font-medium text-muted-foreground truncate block max-w-[160px]">
          {token.name}
        </span>
      </div>

      {menuItems.map((item) => (
        <div key={item.id}>
          <button
            role="menuitem"
            onClick={() => handleAction(item.action)}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm
              transition-colors duration-75
              focus-visible:outline-none focus-visible:bg-muted/60
              ${item.danger
                ? 'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10'
                : 'text-foreground/90 hover:bg-muted/60'
              }
            `}
          >
            <Icon
              name={item.icon}
              size={15}
              className={item.danger ? 'text-destructive' : 'text-muted-foreground'}
            />
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <kbd className="text-[10px] font-mono text-muted-foreground/60 bg-muted/40 px-1.5 py-0.5 rounded">
                {item.shortcut}
              </kbd>
            )}
          </button>
          {item.dividerAfter && (
            <div className="my-1 mx-2 h-px bg-border/40" />
          )}
        </div>
      ))}

      <style>{`
        @keyframes context-menu-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
}
