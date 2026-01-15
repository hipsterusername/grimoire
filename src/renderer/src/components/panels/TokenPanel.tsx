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

  const parsedAmount = parseInt(amount, 10)
  const hasValidAmount = amount && parsedAmount > 0
  const previewHp = hasValidAmount
    ? mode === 'damage'
      ? Math.max(0, currentHp - parsedAmount)
      : Math.min(maxHp, currentHp + parsedAmount)
    : currentHp

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust HP: ${tokenName}`} size="sm">
      <div className="space-y-4">
        {/* Current HP display */}
        <div className="text-center">
          <div className="text-3xl font-bold tabular-nums">
            {currentHp} <span className="text-muted-foreground font-normal">/</span> {maxHp}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Current HP</div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setMode('damage')}
            className={`flex-1 min-h-[40px] px-4 py-2 rounded-md font-medium transition-all ${
              mode === 'damage'
                ? 'bg-destructive text-destructive-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Damage
          </button>
          <button
            onClick={() => setMode('heal')}
            className={`flex-1 min-h-[40px] px-4 py-2 rounded-md font-medium transition-all ${
              mode === 'heal'
                ? 'bg-success text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Heal
          </button>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
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
            className="w-full min-h-[48px] px-4 py-2 text-lg text-center font-medium bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring tabular-nums"
          />
        </div>

        {/* Preview - always visible for context */}
        <div
          className={`text-center py-2 px-3 rounded-lg transition-all ${
            hasValidAmount
              ? mode === 'damage'
                ? 'bg-destructive/10 text-destructive'
                : 'bg-success/10 text-success'
              : 'bg-muted/50 text-muted-foreground'
          }`}
        >
          <span className="text-sm font-medium">
            {hasValidAmount ? (
              <>
                Result: <span className="text-lg tabular-nums">{previewHp}</span> HP
                {mode === 'damage' && previewHp === 0 && (
                  <span className="ml-2 text-xs opacity-75">(Unconscious)</span>
                )}
              </>
            ) : (
              'Enter an amount to preview'
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!hasValidAmount}
            className={`min-h-[44px] px-6 py-2 text-sm rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === 'damage'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-success text-white hover:bg-success/90'
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
  const centerOnToken = useCanvasStore((s) => s.centerOnToken)
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

  const handleLocateToken = (tokenId: string) => {
    const token = encounter?.tokens.find((t) => t.id === tokenId)
    if (!token || !encounter?.map) return

    const gridSize = encounter.map.gridSettings.gridSize
    centerOnToken(token.gridX, token.gridY, gridSize, token.size)
    selectToken(tokenId)
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
          <h3 id="tokens-heading" className="text-sm font-semibold text-foreground/90">Tokens</h3>
          <div className="flex gap-1.5" role="group" aria-label="Add token">
            <Tooltip content="Add player character">
              <button
                onClick={() => handleAddToken(TokenType.PlayerCharacter)}
                className="h-8 px-2.5 text-xs font-medium bg-muted/70 hover:bg-accent/20 border border-border/60 hover:border-accent/50 rounded-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5"
                aria-label="Add player character token"
              >
                <Icon name="user" size={13} />
                <span>Player</span>
              </button>
            </Tooltip>
            <Tooltip content="Add monster">
              <button
                onClick={() => handleAddToken(TokenType.Monster)}
                className="h-8 px-2.5 text-xs font-medium bg-muted/70 hover:bg-destructive/15 border border-border/60 hover:border-destructive/40 rounded-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-1.5"
                aria-label="Add monster token"
              >
                <Icon name="skull" size={13} />
                <span>Monster</span>
              </button>
            </Tooltip>
          </div>
        </div>

        {encounter.tokens.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Icon name="users" size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-0.5">No tokens yet</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add a player or monster to begin
            </p>
          </div>
        ) : (
          <ul
            className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-stable"
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
                    className={`p-2.5 rounded-lg cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? 'bg-primary/15 ring-1 ring-primary/60'
                        : 'bg-muted/60 hover:bg-muted'
                    }`}
                  >
                    {/* Title row with type icon and AC on right */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                        style={{ backgroundColor: token.color }}
                        aria-hidden="true"
                      />
                      <div className="text-sm font-medium truncate leading-tight flex-1" title={token.name}>
                        {token.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Tooltip content={token.type === TokenType.PlayerCharacter ? 'Player Character' : token.type === TokenType.NonPlayerCharacter ? 'NPC' : token.type}>
                          <Icon
                            name={
                              token.type === TokenType.PlayerCharacter ? 'user' :
                              token.type === TokenType.NonPlayerCharacter ? 'users' :
                              token.type === TokenType.Monster ? 'skull' : 'box'
                            }
                            size={14}
                            aria-label={token.type}
                          />
                        </Tooltip>
                        <span className="text-xs tabular-nums">AC {token.stats.armorClass}</span>
                      </div>
                    </div>

                    {/* Controls row: HP on left, action buttons on right */}
                    <div className="flex items-center justify-between gap-2">
                      {/* HP controls */}
                      {token.stats.maxHp > 0 ? (
                        <div className="flex items-center" role="group" aria-label={`HP controls for ${token.name}`}>
                          <Tooltip content="Reduce HP by 1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickHpChange(token.id, -1)
                              }}
                              className="w-7 h-7 text-sm font-bold bg-secondary/80 rounded-l-md hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10"
                              aria-label={`Decrease HP for ${token.name}`}
                            >
                              −
                            </button>
                          </Tooltip>
                          <Tooltip content="Click to enter damage/healing amount">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenHpModal(token)
                              }}
                              className={`min-w-[52px] h-7 px-2 text-xs font-medium bg-secondary/80 hover:bg-secondary text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10 tabular-nums ${
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
                              className="w-7 h-7 text-sm font-bold bg-secondary/80 rounded-r-md hover:bg-success hover:text-white active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10"
                              aria-label={`Increase HP for ${token.name}`}
                            >
                              +
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">No HP</span>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-1" role="group" aria-label={`Actions for ${token.name}`}>
                        <Tooltip content="Locate on map">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLocateToken(token.id)
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Locate ${token.name} on map`}
                          >
                            <Icon name="crosshair" size={14} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Edit token">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditToken(token.id)
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive hover:text-destructive-foreground active:scale-95 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                        className="mt-2 h-1 bg-secondary/40 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={token.stats.currentHp}
                        aria-valuemin={0}
                        aria-valuemax={token.stats.maxHp}
                        aria-label={`${token.name} health: ${token.stats.currentHp} of ${token.stats.maxHp}`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            hpStatus === 'healthy'
                              ? 'bg-success'
                              : hpStatus === 'injured'
                                ? 'bg-warning'
                                : 'bg-destructive'
                          }`}
                          style={{
                            width: `${hpPercent * 100}%`,
                            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' /* ease-out-expo */
                          }}
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
