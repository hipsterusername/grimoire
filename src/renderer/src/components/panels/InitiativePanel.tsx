import { useState, useMemo, useId } from 'react'
import { useEncounterStore } from '../../stores'
import { TokenType } from '../../types'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'

// Roll a d20 (1-20)
function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

export function InitiativePanel() {
  const encounter = useEncounterStore((s) => s.encounter)
  const startCombat = useEncounterStore((s) => s.startCombat)
  const endCombat = useEncounterStore((s) => s.endCombat)
  const nextTurn = useEncounterStore((s) => s.nextTurn)
  const previousTurn = useEncounterStore((s) => s.previousTurn)
  const setInitiative = useEncounterStore((s) => s.setInitiative)
  const sortInitiative = useEncounterStore((s) => s.sortInitiative)

  const [showEndCombatConfirm, setShowEndCombatConfirm] = useState(false)
  const [editingInitiative, setEditingInitiative] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const headingId = useId()

  // Get tokens in initiative order, filtering out any missing tokens
  const tokensInOrder = useMemo(() => {
    if (!encounter) return []

    const tokenMap = new Map(encounter.tokens.map((t) => [t.id, t]))

    // If in combat, use the initiative order
    if (encounter.inCombat && encounter.initiativeOrder.length > 0) {
      return encounter.initiativeOrder
        .map((id) => tokenMap.get(id))
        .filter((t): t is NonNullable<typeof t> => t !== undefined)
    }

    // Otherwise, show all tokens sorted by initiative (if set) or alphabetically
    return [...encounter.tokens].sort((a, b) => {
      // Tokens with initiative come first
      const aInit = a.stats.initiative ?? -999
      const bInit = b.stats.initiative ?? -999
      if (aInit !== bInit) return bInit - aInit
      // Then sort alphabetically
      return a.name.localeCompare(b.name)
    })
  }, [encounter])

  // Roll initiative for all tokens (d20 + modifier)
  const handleRollAll = () => {
    if (!encounter) return

    encounter.tokens.forEach((token) => {
      const roll = rollD20()
      const modifier = token.stats.initiativeModifier ?? 0
      setInitiative(token.id, roll + modifier)
    })

    // Auto-sort after rolling
    setTimeout(() => sortInitiative(), 50)
  }

  // Roll initiative for a single token (d20 + modifier)
  const handleRollOne = (tokenId: string) => {
    const token = encounter?.tokens.find((t) => t.id === tokenId)
    const roll = rollD20()
    const modifier = token?.stats.initiativeModifier ?? 0
    setInitiative(tokenId, roll + modifier)
  }

  // Start editing initiative manually
  const handleStartEdit = (tokenId: string, currentValue?: number) => {
    setEditingInitiative(tokenId)
    setEditValue(currentValue?.toString() ?? '')
  }

  // Save edited initiative
  const handleSaveEdit = () => {
    if (editingInitiative) {
      const value = parseInt(editValue, 10)
      if (!isNaN(value)) {
        setInitiative(editingInitiative, Math.max(0, Math.min(99, value)))
      }
      setEditingInitiative(null)
      setEditValue('')
    }
  }

  // Handle key press in edit input
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setEditingInitiative(null)
      setEditValue('')
    }
  }

  // Start combat - auto-sort first
  const handleStartCombat = () => {
    sortInitiative()
    startCombat()
  }

  // End combat with confirmation
  const handleEndCombat = () => {
    setShowEndCombatConfirm(true)
  }

  const confirmEndCombat = () => {
    endCombat()
    setShowEndCombatConfirm(false)
  }

  if (!encounter) return null

  const currentTurnToken = encounter.inCombat && encounter.initiativeOrder.length > 0
    ? encounter.tokens.find((t) => t.id === encounter.initiativeOrder[encounter.currentTurnIndex])
    : null

  const hasAnyInitiative = encounter.tokens.some((t) => t.stats.initiative !== undefined)

  return (
    <>
      <section className="p-4 border-b border-border" aria-labelledby={headingId}>
        <div className="flex items-center justify-between mb-3">
          <h3 id={headingId} className="font-semibold">Initiative</h3>

          {encounter.inCombat && (
            <div className="text-sm text-muted-foreground">
              Round {encounter.roundNumber}
            </div>
          )}
        </div>

        {/* Combat controls */}
        <div className="space-y-3 mb-4">
          {!encounter.inCombat ? (
            <div className="flex gap-2">
              <Tooltip content="Roll d20 for all tokens">
                <button
                  onClick={handleRollAll}
                  disabled={encounter.tokens.length === 0}
                  className="flex-1 min-h-[40px] px-3 py-2 text-sm font-medium bg-secondary rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
                  aria-label="Roll initiative for all tokens"
                >
                  <Icon name="dice" size={16} />
                  Roll All
                </button>
              </Tooltip>
              <Tooltip content={hasAnyInitiative ? 'Start combat with current initiative order' : 'Roll initiative first'}>
                <button
                  onClick={handleStartCombat}
                  disabled={!hasAnyInitiative}
                  className="flex-1 min-h-[40px] px-3 py-2 text-sm font-medium bg-success text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
                  aria-label="Start combat"
                >
                  <Icon name="play" size={16} />
                  Start Combat
                </button>
              </Tooltip>
            </div>
          ) : (
            <>
              {/* Turn controls */}
              <div className="flex gap-2">
                <Tooltip content="Previous turn">
                  <button
                    onClick={previousTurn}
                    className="min-h-[40px] min-w-[44px] px-3 py-2 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Go to previous turn"
                  >
                    <Icon name="chevron-left" size={16} />
                  </button>
                </Tooltip>
                <Tooltip content="Next turn">
                  <button
                    onClick={nextTurn}
                    className="flex-1 min-h-[40px] px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
                    aria-label="Go to next turn"
                  >
                    Next Turn
                    <Icon name="chevron-right" size={16} />
                  </button>
                </Tooltip>
              </div>

              {/* Current turn indicator */}
              {currentTurnToken && (
                <div
                  className="p-3 bg-primary/20 border border-primary rounded-lg"
                  role="status"
                  aria-live="polite"
                >
                  <div className="text-xs text-muted-foreground mb-1">Current Turn</div>
                  <div className="text-lg font-bold flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: currentTurnToken.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate" title={currentTurnToken.name}>
                      {currentTurnToken.name}
                    </span>
                  </div>
                </div>
              )}

              <Tooltip content="End combat and reset turn order">
                <button
                  onClick={handleEndCombat}
                  className="w-full min-h-[36px] px-3 py-1.5 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="End combat"
                >
                  End Combat
                </button>
              </Tooltip>
            </>
          )}
        </div>

        {/* Token list */}
        {tokensInOrder.length === 0 ? (
          <div className="text-center py-6">
            <Icon name="sort" size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No tokens in encounter. Add some tokens first.
            </p>
          </div>
        ) : (
          <ul
            className="space-y-1 max-h-[300px] overflow-y-auto"
            role="list"
            aria-label="Initiative order"
          >
            {tokensInOrder.map((token, index) => {
              const isCurrentTurn = encounter.inCombat && encounter.initiativeOrder[encounter.currentTurnIndex] === token.id
              const isEditing = editingInitiative === token.id

              return (
                <li key={token.id} role="listitem">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                      isCurrentTurn
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    aria-current={isCurrentTurn ? 'true' : undefined}
                  >
                    {/* Turn indicator / index */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isCurrentTurn
                          ? 'bg-white/20'
                          : 'bg-secondary'
                      }`}
                      aria-hidden="true"
                    >
                      {isCurrentTurn ? '▶' : index + 1}
                    </div>

                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: token.color }}
                      aria-hidden="true"
                    />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={token.name}>
                        {token.name}
                      </div>
                      <div className={`text-xs ${isCurrentTurn ? 'text-white/70' : 'text-muted-foreground'}`}>
                        {token.type === TokenType.PlayerCharacter ? 'PC' : token.type === TokenType.Monster ? 'Monster' : token.type}
                      </div>
                    </div>

                    {/* Initiative value / editor */}
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={handleEditKeyDown}
                          min={-10}
                          max={99}
                          autoFocus
                          className="w-12 h-8 px-2 text-center text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                          aria-label={`Initiative value for ${token.name}`}
                        />
                      ) : (
                        <>
                          {!encounter.inCombat && (
                            <Tooltip content={`Roll d20${token.stats.initiativeModifier ? (token.stats.initiativeModifier >= 0 ? '+' : '') + token.stats.initiativeModifier : ''} for this token`}>
                              <button
                                onClick={() => handleRollOne(token.id)}
                                className={`min-w-[28px] min-h-[28px] p-1 rounded hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                  isCurrentTurn ? 'hover:bg-white/20' : ''
                                }`}
                                aria-label={`Roll initiative for ${token.name}`}
                              >
                                <Icon name="dice" size={14} />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip content="Click to edit initiative total">
                            <button
                              onClick={() => handleStartEdit(token.id, token.stats.initiative)}
                              className={`min-w-[36px] min-h-[28px] px-2 py-1 text-sm font-mono font-bold rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                isCurrentTurn
                                  ? 'bg-white/20 hover:bg-white/30'
                                  : 'bg-secondary hover:bg-muted'
                              }`}
                              aria-label={`Initiative: ${token.stats.initiative ?? '—'}. Click to edit.`}
                            >
                              {token.stats.initiative ?? '—'}
                            </button>
                          </Tooltip>
                          {/* Show modifier badge */}
                          {(token.stats.initiativeModifier ?? 0) !== 0 && (
                            <span className={`text-xs px-1 rounded ${isCurrentTurn ? 'text-white/60' : 'text-muted-foreground'}`}>
                              {token.stats.initiativeModifier >= 0 ? '+' : ''}{token.stats.initiativeModifier}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Sort button when not in combat */}
        {!encounter.inCombat && hasAnyInitiative && (
          <div className="mt-3">
            <Tooltip content="Sort tokens by initiative value (highest first)">
              <button
                onClick={sortInitiative}
                className="w-full min-h-[36px] px-3 py-1.5 text-xs font-medium bg-secondary rounded hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center justify-center gap-2"
                aria-label="Sort by initiative"
              >
                <Icon name="sort" size={14} />
                Sort by Initiative
              </button>
            </Tooltip>
          </div>
        )}
      </section>

      {/* End combat confirmation */}
      <ConfirmDialog
        isOpen={showEndCombatConfirm}
        title="End Combat"
        message="Are you sure you want to end combat? Initiative order will be preserved but the round counter will reset."
        confirmLabel="End Combat"
        cancelLabel="Continue Fighting"
        variant="warning"
        onConfirm={confirmEndCombat}
        onCancel={() => setShowEndCombatConfirm(false)}
      />
    </>
  )
}
