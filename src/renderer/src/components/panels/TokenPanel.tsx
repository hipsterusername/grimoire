import { useState, useRef, useEffect } from 'react'
import { useEncounterStore, useCanvasStore, useUIStore, usePresentationStore } from '../../stores'
import { CreatureSize, TokenType } from '../../types'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { TOKEN_COLORS } from '../../lib/constants'
import { calculateTokenPlacement } from '../../lib/token-placement'

// HP adjustment modal for damage/healing
function HpAdjustModal({
  isOpen,
  tokenName,
  currentHp,
  maxHp,
  onClose,
  onApply
}: {
  isOpen: boolean
  tokenName: string
  currentHp: number
  maxHp: number
  onClose: () => void
  onApply: (newHp: number) => void
}) {
  const [mode, setMode] = useState<'damage' | 'heal'>('damage')
  const [amount, setAmount] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setMode('damage')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleApply = () => {
    const value = parseInt(amount, 10)
    if (isNaN(value) || value <= 0) return

    const newHp = mode === 'damage'
      ? Math.max(0, currentHp - value)
      : Math.min(maxHp, currentHp + value)

    onApply(newHp)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust HP: ${tokenName}`} size="sm">
      <div className="space-y-4">
        <div className="text-center text-2xl font-bold">
          {currentHp} / {maxHp} HP
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('damage')}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'damage'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-muted hover:bg-secondary'
            }`}
          >
            Damage
          </button>
          <button
            onClick={() => setMode('heal')}
            className={`flex-1 min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'heal'
                ? 'bg-success text-white'
                : 'bg-muted hover:bg-secondary'
            }`}
          >
            Heal
          </button>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium mb-1">
            {mode === 'damage' ? 'Damage Amount' : 'Heal Amount'}
          </label>
          <input
            ref={inputRef}
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter amount..."
            className="w-full min-h-[48px] px-4 py-2 text-lg text-center bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Preview */}
        {amount && parseInt(amount, 10) > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {mode === 'damage' ? (
              <>New HP: {Math.max(0, currentHp - parseInt(amount, 10))}</>
            ) : (
              <>New HP: {Math.min(maxHp, currentHp + parseInt(amount, 10))}</>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!amount || parseInt(amount, 10) <= 0}
            className={`min-h-[44px] px-4 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'damage'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-success text-white'
            }`}
          >
            Apply {mode === 'damage' ? 'Damage' : 'Healing'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function TokenPanel() {
  const encounter = useEncounterStore((s) => s.encounter)
  const addToken = useEncounterStore((s) => s.addToken)
  const removeToken = useEncounterStore((s) => s.removeToken)
  const updateTokenHp = useEncounterStore((s) => s.updateTokenHp)

  const selection = useCanvasStore((s) => s.selection)
  const selectToken = useCanvasStore((s) => s.selectToken)
  const viewportSize = useCanvasStore((s) => s.viewportSize)
  const view = useCanvasStore((s) => s.view)
  const lastClickedCell = useCanvasStore((s) => s.lastClickedCell)

  const isPresenting = usePresentationStore((s) => s.isPresenting)
  const presentationBounds = usePresentationStore((s) => s.bounds)

  const openModal = useUIStore((s) => s.openModal)
  const setEditingToken = useUIStore((s) => s.setEditingToken)

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [hpAdjust, setHpAdjust] = useState<{ id: string; name: string; currentHp: number; maxHp: number } | null>(null)

  const handleAddToken = (type: TokenType) => {
    if (!encounter) return

    const colorIndex = (encounter.tokens.length ?? 0) % TOKEN_COLORS.length
    const count = (encounter.tokens.filter((t) => t.type === type).length ?? 0) + 1

    const gridSize = encounter.map?.gridSettings.gridSize ?? 50
    const mapWidth = encounter.map?.imageWidth ?? 1000
    const mapHeight = encounter.map?.imageHeight ?? 800

    // Calculate placement using utility - prioritizes presentation bounds when presenting
    const placement = calculateTokenPlacement({
      gridSize,
      tokens: encounter.tokens,
      mapWidth,
      mapHeight,
      isPresenting,
      presentationBounds: isPresenting ? presentationBounds : null,
      lastClickedCell,
      viewport: {
        width: viewportSize.width,
        height: viewportSize.height,
        panX: view.panX,
        panY: view.panY,
        zoom: view.zoom
      }
    })

    const defaultNames: Record<TokenType, string> = {
      [TokenType.PlayerCharacter]: `Player ${count}`,
      [TokenType.NonPlayerCharacter]: `NPC ${count}`,
      [TokenType.Monster]: `Monster ${count}`,
      [TokenType.Object]: `Object ${count}`
    }

    addToken({
      name: defaultNames[type],
      type,
      size: CreatureSize.Medium,
      gridX: placement.gridX,
      gridY: placement.gridY,
      color: TOKEN_COLORS[colorIndex].hex,
      stats: {
        maxHp: type === TokenType.Object ? 0 : 10,
        currentHp: type === TokenType.Object ? 0 : 10,
        tempHp: 0,
        armorClass: 10,
        initiativeModifier: 0
      },
      conditions: [],
      visible: true
    })
  }

  const handleEditToken = (tokenId: string) => {
    setEditingToken(tokenId)
    openModal('token-editor', { tokenId })
  }

  const handleQuickHpChange = (tokenId: string, delta: number) => {
    const token = encounter?.tokens.find((t) => t.id === tokenId)
    if (!token) return

    const newHp = Math.max(0, Math.min(token.stats.maxHp, token.stats.currentHp + delta))
    updateTokenHp(tokenId, newHp)
  }

  const handleOpenHpModal = (token: { id: string; name: string; stats: { currentHp: number; maxHp: number } }) => {
    setHpAdjust({
      id: token.id,
      name: token.name,
      currentHp: token.stats.currentHp,
      maxHp: token.stats.maxHp
    })
  }

  const handleDeleteToken = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      removeToken(deleteConfirm.id)
      setDeleteConfirm(null)
    }
  }

  if (!encounter) return null

  return (
    <>
      <section className="p-4 border-b border-border" aria-labelledby="tokens-heading">
        <div className="flex items-center justify-between mb-3">
          <h3 id="tokens-heading" className="font-semibold">Tokens</h3>
          <div className="flex gap-2" role="group" aria-label="Add token">
            <Tooltip content="Add player character">
              <button
                onClick={() => handleAddToken(TokenType.PlayerCharacter)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-muted hover:bg-accent/20 border border-border hover:border-accent rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5"
                aria-label="Add player character token"
              >
                <Icon name="user" size={14} />
                <span>Player</span>
              </button>
            </Tooltip>
            <Tooltip content="Add monster">
              <button
                onClick={() => handleAddToken(TokenType.Monster)}
                className="min-h-[36px] px-3 py-1.5 text-xs font-medium bg-muted hover:bg-destructive/20 border border-border hover:border-destructive/50 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5"
                aria-label="Add monster token"
              >
                <Icon name="skull" size={14} />
                <span>Monster</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {encounter.tokens.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Icon name="users" size={28} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-foreground font-medium mb-1">No tokens yet</p>
            <p className="text-xs text-muted-foreground">
              Add a player or monster to get started
            </p>
          </div>
        ) : (
          <ul
            className="space-y-2 max-h-[400px] overflow-y-auto"
            role="list"
            aria-label="Token list"
          >
            {encounter.tokens.map((token) => {
              const isSelected = selection?.tokenIds?.includes(token.id)
              const hpPercent = token.stats.maxHp > 0
                ? token.stats.currentHp / token.stats.maxHp
                : 1
              const hpStatus =
                hpPercent > 0.5 ? 'healthy' : hpPercent > 0.25 ? 'injured' : 'critical'

              return (
                <li key={token.id} role="listitem">
                  <div
                    onClick={() => selectToken(token.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectToken(token.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${token.name}, ${token.type}, ${token.stats.currentHp} of ${token.stats.maxHp} HP, ${isSelected ? 'selected' : 'not selected'}`}
                    className={`p-3 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? 'bg-primary/20 ring-1 ring-primary'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color indicator */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: token.color }}
                        aria-hidden="true"
                      />

                      {/* Name and type */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" title={token.name}>
                          {token.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {token.type === TokenType.PlayerCharacter ? 'PC' : token.type === TokenType.NonPlayerCharacter ? 'NPC' : token.type} · {token.size}
                        </div>
                      </div>

                      {/* HP controls */}
                      {token.stats.maxHp > 0 && (
                        <div className="flex items-center gap-1" role="group" aria-label={`HP controls for ${token.name}`}>
                          <Tooltip content="Reduce HP by 1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickHpChange(token.id, -1)
                              }}
                              className="min-w-[28px] min-h-[28px] text-sm font-bold bg-secondary rounded hover:bg-destructive hover:text-destructive-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Decrease HP for ${token.name}`}
                            >
                              -
                            </button>
                          </Tooltip>
                          <Tooltip content="Click to enter damage/healing amount">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenHpModal(token)
                              }}
                              className={`min-w-[50px] min-h-[28px] px-2 py-1 text-xs font-medium bg-secondary rounded hover:bg-background text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                hpStatus === 'critical' ? 'text-destructive' : ''
                              }`}
                              aria-label={`${token.name} HP: ${token.stats.currentHp} of ${token.stats.maxHp}. Click to adjust.`}
                            >
                              {token.stats.currentHp}/{token.stats.maxHp}
                            </button>
                          </Tooltip>
                          <Tooltip content="Increase HP by 1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickHpChange(token.id, 1)
                              }}
                              className="min-w-[28px] min-h-[28px] text-sm font-bold bg-secondary rounded hover:bg-success hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Increase HP for ${token.name}`}
                            >
                              +
                            </button>
                          </Tooltip>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1" role="group" aria-label={`Actions for ${token.name}`}>
                        <Tooltip content="Edit token">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditToken(token.id)
                            }}
                            className="min-w-[28px] min-h-[28px] p-1 hover:bg-secondary rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Edit ${token.name}`}
                          >
                            <Icon name="edit" size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete token">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteToken(token.id, token.name)
                            }}
                            className="min-w-[28px] min-h-[28px] p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Delete ${token.name}`}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* HP bar */}
                    {token.stats.maxHp > 0 && (
                      <div
                        className="mt-2 h-1.5 bg-secondary rounded overflow-hidden"
                        role="progressbar"
                        aria-valuenow={token.stats.currentHp}
                        aria-valuemin={0}
                        aria-valuemax={token.stats.maxHp}
                        aria-label={`${token.name} health: ${token.stats.currentHp} of ${token.stats.maxHp}`}
                      >
                        <div
                          className={`h-full transition-all ${
                            hpStatus === 'healthy'
                              ? 'bg-success'
                              : hpStatus === 'injured'
                                ? 'bg-warning'
                                : 'bg-destructive'
                          }`}
                          style={{ width: `${hpPercent * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Token"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      {/* HP adjustment modal */}
      {hpAdjust && (
        <HpAdjustModal
          isOpen={true}
          tokenName={hpAdjust.name}
          currentHp={hpAdjust.currentHp}
          maxHp={hpAdjust.maxHp}
          onClose={() => setHpAdjust(null)}
          onApply={(newHp) => updateTokenHp(hpAdjust.id, newHp)}
        />
      )}
    </>
  )
}
