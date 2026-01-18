import { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'
import { DND_CONDITIONS } from '../../lib/constants'

interface ConditionPickerProps {
  onAddCondition: (condition: { name: string; color?: string; icon?: string; duration?: number }) => void
  existingConditions?: string[]
}

export function ConditionPicker({ onAddCondition, existingConditions = [] }: ConditionPickerProps) {
  const [selectedCondition, setSelectedCondition] = useState<typeof DND_CONDITIONS[number] | null>(null)
  const [duration, setDuration] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customColor, setCustomColor] = useState('#8b5cf6')
  const [searchQuery, setSearchQuery] = useState('')
  const durationRef = useRef<HTMLInputElement>(null)
  const customNameRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Focus search input on mount (with delay to avoid capturing the triggering keypress)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRef.current?.focus()
    }, 50)
    return () => clearTimeout(timeoutId)
  }, [])

  // Focus duration input when condition selected
  useEffect(() => {
    if (selectedCondition) {
      durationRef.current?.focus()
    }
  }, [selectedCondition])

  // Focus custom name input when showing custom form
  useEffect(() => {
    if (showCustom) {
      customNameRef.current?.focus()
    }
  }, [showCustom])

  // Filter conditions by search query and existing conditions
  const availableConditions = DND_CONDITIONS.filter(
    (c) => !existingConditions.includes(c.name)
  )

  const filteredConditions = searchQuery
    ? availableConditions.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableConditions

  const handleSelectCondition = (condition: typeof DND_CONDITIONS[number]) => {
    setSelectedCondition(condition)
    setDuration('')
    setShowCustom(false)
    setSearchQuery('')
  }

  const handleConfirmCondition = () => {
    if (!selectedCondition) return
    const parsedDuration = duration ? parseInt(duration, 10) : undefined
    onAddCondition({
      name: selectedCondition.name,
      color: selectedCondition.color,
      icon: selectedCondition.icon,
      duration: parsedDuration && parsedDuration > 0 ? parsedDuration : undefined
    })
    setSelectedCondition(null)
    setDuration('')
  }

  const handleAddCustom = () => {
    if (!customName.trim()) return
    const parsedDuration = duration ? parseInt(duration, 10) : undefined
    onAddCondition({
      name: customName.trim(),
      color: customColor,
      duration: parsedDuration && parsedDuration > 0 ? parsedDuration : undefined
    })
    setCustomName('')
    setDuration('')
    setShowCustom(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showCustom) {
        handleAddCustom()
      } else if (selectedCondition) {
        handleConfirmCondition()
      } else if (searchQuery && filteredConditions.length === 1) {
        // Auto-select if exactly one match
        handleSelectCondition(filteredConditions[0])
      } else if (searchQuery && filteredConditions.length === 0) {
        // Create custom condition with search query
        setCustomName(searchQuery)
        setSearchQuery('')
        setShowCustom(true)
      }
    } else if (e.key === 'Escape') {
      if (searchQuery) {
        setSearchQuery('')
      } else {
        setSelectedCondition(null)
        setShowCustom(false)
      }
    }
  }

  // Quick colors for custom conditions
  const quickColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-3">
      {/* Selected condition confirmation bar */}
      {selectedCondition && (
        <div
          className="flex items-center gap-2 p-2 rounded-lg border-2 transition-colors"
          style={{
            backgroundColor: `${selectedCondition.color}15`,
            borderColor: `${selectedCondition.color}40`
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: selectedCondition.color }}
          >
            <Icon name={selectedCondition.icon} size={14} className="text-white" />
          </div>
          <span className="font-medium text-sm">{selectedCondition.name}</span>

          <div className="flex items-center gap-1.5 ml-auto">
            <input
              ref={durationRef}
              type="number"
              min={1}
              max={99}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="∞"
              className="w-12 h-7 px-2 text-xs text-center bg-background/80 border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Duration in turns"
            />
            <span className="text-xs text-muted-foreground">turns</span>
          </div>

          <button
            onClick={handleConfirmCondition}
            className="h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => setSelectedCondition(null)}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded hover:bg-background/50 transition-colors"
            aria-label="Cancel"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      )}

      {/* Custom condition form */}
      {showCustom && !selectedCondition && (
        <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-3">
          <div className="flex gap-2">
            <input
              ref={customNameRef}
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Condition name..."
              maxLength={30}
              className="flex-1 h-8 px-2.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="number"
              min={1}
              max={99}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="∞"
              className="w-14 h-8 px-2 text-xs text-center bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Duration"
            />
          </div>

          {/* Quick color picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground mr-1">Color:</span>
            {quickColors.map((c) => (
              <button
                key={c}
                onClick={() => setCustomColor(c)}
                className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                  customColor === c ? 'ring-2 ring-offset-1 ring-offset-background ring-white/50' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCustom(false)}
              className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustom}
              disabled={!customName.trim()}
              className="h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Add Custom
            </button>
          </div>
        </div>
      )}

      {/* Condition grid - hidden when confirming */}
      {!selectedCondition && !showCustom && (
        <>
          {availableConditions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              All preset conditions are active
            </p>
          ) : (
            <div className="space-y-2">
              {/* Search input */}
              <div className="relative">
                <Icon
                  name="search"
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search conditions..."
                  className="w-full h-8 pl-8 pr-8 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      searchRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>

              {/* Condition buttons */}
              {filteredConditions.length === 0 && searchQuery ? (
                <button
                  onClick={() => {
                    setCustomName(searchQuery)
                    setSearchQuery('')
                    setShowCustom(true)
                  }}
                  className="w-full flex items-center justify-center gap-1.5 h-8 text-sm rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  <Icon name="plus" size={14} />
                  <span>Create "<strong className="text-foreground">{searchQuery}</strong>" condition</span>
                </button>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {filteredConditions.map((condition) => (
                    <button
                      key={condition.name}
                      onClick={() => handleSelectCondition(condition)}
                      className="inline-flex items-center gap-1.5 h-7 px-2 text-xs rounded-full border transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        backgroundColor: `${condition.color}15`,
                        borderColor: `${condition.color}30`,
                        color: condition.color
                      }}
                    >
                      <Icon name={condition.icon} size={12} />
                      <span className="font-medium">{condition.name}</span>
                    </button>
                  ))}

                  {/* Custom condition button - only show when not searching */}
                  {!searchQuery && (
                    <button
                      onClick={() => setShowCustom(true)}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
                    >
                      <Icon name="plus" size={12} />
                      <span>Custom</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
