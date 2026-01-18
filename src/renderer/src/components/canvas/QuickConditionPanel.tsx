import { useEffect, useRef } from 'react'
import { useEncounterStore, useUIStore } from '../../stores'
import { ConditionPicker } from '../ui/ConditionPicker'
import { ConditionBadge } from '../ui/ConditionBadge'
import { Icon } from '../ui/Icon'

interface QuickConditionPanelProps {
  tokenId: string
  screenX: number
  screenY: number
  containerWidth: number
  containerHeight: number
}

export function QuickConditionPanel({
  tokenId,
  screenX,
  screenY,
  containerWidth,
  containerHeight
}: QuickConditionPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  const token = useEncounterStore((s) => s.encounter?.tokens.find((t) => t.id === tokenId))
  const addCondition = useEncounterStore((s) => s.addCondition)
  const removeCondition = useEncounterStore((s) => s.removeCondition)
  const closeQuickCondition = useUIStore((s) => s.closeQuickCondition)

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeQuickCondition()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeQuickCondition])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeQuickCondition()
      }
    }
    // Delay to prevent immediate close from the right-click event
    const timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside)
    }, 100)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [closeQuickCondition])

  if (!token) return null

  // Calculate panel position - try to keep it on screen
  const panelWidth = 320
  const panelHeight = 300 // Approximate max height

  let left = screenX + 20
  let top = screenY - 20

  // Adjust if would go off right edge
  if (left + panelWidth > containerWidth - 20) {
    left = screenX - panelWidth - 20
  }

  // Adjust if would go off bottom
  if (top + panelHeight > containerHeight - 20) {
    top = containerHeight - panelHeight - 20
  }

  // Adjust if would go off top
  if (top < 20) {
    top = 20
  }

  // Adjust if would go off left
  if (left < 20) {
    left = 20
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-background border border-border rounded-lg shadow-2xl overflow-hidden"
      style={{
        left,
        top,
        width: panelWidth,
        maxHeight: panelHeight
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: token.color }}
          />
          <span className="font-medium text-sm truncate">{token.name}</span>
        </div>
        <button
          onClick={closeQuickCondition}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 max-h-[250px] overflow-y-auto">
        {/* Active conditions */}
        {token.conditions.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Active</div>
            <div className="flex flex-wrap gap-1.5">
              {token.conditions.map((condition) => (
                <ConditionBadge
                  key={condition.id}
                  condition={condition}
                  onRemove={() => removeCondition(tokenId, condition.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Add conditions */}
        <div>
          {token.conditions.length > 0 && (
            <div className="text-xs text-muted-foreground mb-2">Add</div>
          )}
          <ConditionPicker
            onAddCondition={(condition) => addCondition(tokenId, condition)}
            existingConditions={token.conditions.map((c) => c.name)}
          />
        </div>
      </div>
    </div>
  )
}
