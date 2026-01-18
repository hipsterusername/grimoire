import { useState, useEffect, useId } from 'react'
import { useEncounterStore, useUIStore, useLibraryStore } from '../../stores'
import { CreatureSize, TokenType } from '../../types'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { ColorPicker } from '../ui/ColorPicker'
import { NumberInput } from '../ui/NumberInput'
import { ConditionBadge } from '../ui/ConditionBadge'
import { ConditionPicker } from '../ui/ConditionPicker'
import { CREATURE_SIZES, TOKEN_TYPES } from '../../lib/constants'
import { TokenImagePickerModal } from './TokenImagePickerModal'

const SIZE_OPTIONS = CREATURE_SIZES.map((s) => ({
  value: s.value as CreatureSize,
  label: `${s.label} (${s.space})`
}))

const TYPE_OPTIONS = TOKEN_TYPES.map((t) => ({
  value: t.value as TokenType,
  label: t.label
}))

export function TokenEditorModal() {
  const encounter = useEncounterStore((s) => s.encounter)
  const updateToken = useEncounterStore((s) => s.updateToken)
  const addCondition = useEncounterStore((s) => s.addCondition)
  const removeCondition = useEncounterStore((s) => s.removeCondition)

  const modalData = useUIStore((s) => s.modalData)
  const closeModal = useUIStore((s) => s.closeModal)
  const setEditingToken = useUIStore((s) => s.setEditingToken)

  const library = useLibraryStore((s) => s.library)
  const incrementAssetUsage = useLibraryStore((s) => s.incrementAssetUsage)
  const decrementAssetUsage = useLibraryStore((s) => s.decrementAssetUsage)
  const addTemplate = useLibraryStore((s) => s.addTemplate)

  const tokenId = modalData.tokenId as string
  const token = encounter?.tokens.find((t) => t.id === tokenId)

  const [name, setName] = useState('')
  const [type, setType] = useState<TokenType>(TokenType.Monster)
  const [size, setSize] = useState<CreatureSize>(CreatureSize.Medium)
  const [color, setColor] = useState('#ef4444')
  const [maxHp, setMaxHp] = useState(10)
  const [currentHp, setCurrentHp] = useState(10)
  const [armorClass, setArmorClass] = useState(10)
  const [initiativeModifier, setInitiativeModifier] = useState(0)
  const [notes, setNotes] = useState('')
  const [hidden, setHidden] = useState(false)
  const [assetId, setAssetId] = useState<string | undefined>(undefined)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showConditions, setShowConditions] = useState(false)
  const [savedToLibrary, setSavedToLibrary] = useState(false)

  // Generate unique IDs for form fields
  const nameId = useId()
  const typeId = useId()
  const sizeId = useId()
  const maxHpId = useId()
  const currentHpId = useId()
  const acId = useId()
  const initModId = useId()
  const notesId = useId()

  useEffect(() => {
    if (token) {
      setName(token.name)
      setType(token.type)
      setSize(token.size)
      setColor(token.color)
      setMaxHp(token.stats.maxHp)
      setCurrentHp(token.stats.currentHp)
      setArmorClass(token.stats.armorClass)
      setInitiativeModifier(token.stats.initiativeModifier ?? 0)
      setNotes(token.notes ?? '')
      setHidden(token.hidden ?? false)
      setAssetId(token.assetId)
    }
  }, [token])

  // Get the current asset's image preview
  const currentAsset = assetId ? library.assets.find((a) => a.id === assetId) : null
  const imagePreview = currentAsset?.processedDataUrl

  const handleSave = () => {
    if (!tokenId) return

    // Handle asset usage count changes
    const oldAssetId = token?.assetId
    if (oldAssetId !== assetId) {
      if (oldAssetId) {
        decrementAssetUsage(oldAssetId)
      }
      if (assetId) {
        incrementAssetUsage(assetId)
      }
    }

    updateToken(tokenId, {
      name,
      type,
      size,
      color,
      assetId,
      hidden,
      stats: {
        maxHp,
        currentHp: Math.min(currentHp, maxHp),
        tempHp: token?.stats.tempHp ?? 0,
        armorClass,
        initiative: token?.stats.initiative,
        initiativeModifier
      },
      notes: notes || undefined
    })

    handleClose()
  }

  const handleSelectAsset = (newAssetId: string) => {
    setAssetId(newAssetId)
    setShowImagePicker(false)
  }

  const handleRemoveImage = () => {
    setAssetId(undefined)
  }

  const handleSaveToLibrary = () => {
    addTemplate({
      name,
      type,
      size,
      color,
      assetId,
      stats: {
        maxHp,
        armorClass
      },
      notes: notes || undefined,
      tags: [] // User can add tags later via template editor
    })
    setSavedToLibrary(true)
    // Reset after a short delay
    setTimeout(() => setSavedToLibrary(false), 2000)
  }

  const handleClose = () => {
    setEditingToken(null)
    closeModal()
  }

  if (!token) {
    return null
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Edit Token"
      size="lg"
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium mb-1.5">
            Name
            <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            aria-required="true"
            aria-invalid={!name.trim()}
            aria-describedby={!name.trim() ? `${nameId}-error` : undefined}
            className={`w-full min-h-[44px] px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${
              !name.trim() ? 'border-destructive' : 'border-border'
            }`}
          />
          {!name.trim() && (
            <p id={`${nameId}-error`} className="mt-1.5 text-xs text-destructive" role="alert">
              Name is required
            </p>
          )}
        </div>

        {/* Type and Size */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={typeId} className="block text-sm font-medium mb-1.5">Type</label>
            <select
              id={typeId}
              value={type}
              onChange={(e) => setType(e.target.value as TokenType)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={sizeId} className="block text-sm font-medium mb-1.5">Size</label>
            <select
              id={sizeId}
              value={size}
              onChange={(e) => setSize(e.target.value as CreatureSize)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition-colors cursor-pointer"
            >
              {SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Color */}
        <ColorPicker value={color} onChange={setColor} label="Token Color" />

        {/* Token Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Token Image</label>
          <div className="flex items-center gap-3">
            {/* Image preview */}
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-2 border-border/50 flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Token preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white/90">
                  {name.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Upload/Change button */}
            <button
              onClick={() => setShowImagePicker(true)}
              className="h-9 px-3 text-sm bg-muted/70 hover:bg-muted border border-border/60 rounded-lg transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <Icon name="image" size={15} />
              {imagePreview ? 'Change' : 'Add Image'}
            </button>

            {/* Remove button */}
            {imagePreview && (
              <button
                onClick={handleRemoveImage}
                className="h-9 px-3 text-sm text-destructive/80 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Images are automatically cropped to a circle with a gold border
          </p>
        </div>

        {/* Stats - 2x2 grid on mobile-friendly widths */}
        <div>
          <label className="block text-sm font-medium mb-2">Combat Stats</label>
          <div className="grid grid-cols-4 gap-2">
            <NumberInput
              id={maxHpId}
              label="Max HP"
              value={maxHp}
              onChange={setMaxHp}
              min={0}
              max={9999}
            />
            <NumberInput
              id={currentHpId}
              label="Current"
              value={currentHp}
              onChange={setCurrentHp}
              min={0}
              max={maxHp}
            />
            <NumberInput
              id={acId}
              label="AC"
              value={armorClass}
              onChange={setArmorClass}
              min={0}
              max={99}
            />
            <NumberInput
              id={initModId}
              label="Init Mod"
              value={initiativeModifier}
              onChange={setInitiativeModifier}
              min={-10}
              max={20}
            />
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              Conditions
              {token && token.conditions.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({token.conditions.length})
                </span>
              )}
            </label>
            <button
              onClick={() => setShowConditions(!showConditions)}
              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              {showConditions ? 'Hide' : 'Manage'}
              <Icon name={showConditions ? 'chevron-up' : 'chevron-down'} size={14} />
            </button>
          </div>

          {/* Active conditions */}
          {token && token.conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {token.conditions.map((condition) => (
                <ConditionBadge
                  key={condition.id}
                  condition={condition}
                  onRemove={() => removeCondition(tokenId, condition.id)}
                />
              ))}
            </div>
          )}

          {/* Condition picker - inline, expandable */}
          {showConditions && (
            <div className="pt-2 border-t border-border/50">
              <ConditionPicker
                onAddCondition={(condition) => {
                  if (tokenId) {
                    addCondition(tokenId, condition)
                  }
                }}
                existingConditions={token?.conditions.map((c) => c.name) ?? []}
              />
            </div>
          )}

          {/* Empty state hint */}
          {token && token.conditions.length === 0 && !showConditions && (
            <p className="text-xs text-muted-foreground">
              Click "Manage" to add conditions like Poisoned, Frightened, or Hasted.
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor={notesId} className="text-sm font-medium">
              Notes
            </label>
            <span className="text-[11px] text-muted-foreground">DM only</span>
          </div>
          <textarea
            id={notesId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-sm"
            placeholder="Private notes about this token..."
          />
          <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
            {notes.length}/1000
          </p>
        </div>

        {/* Hidden Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Icon name={hidden ? 'eye-off' : 'eye'} size={18} className={hidden ? 'text-warning' : 'text-muted-foreground'} />
            <div>
              <label htmlFor="hidden-toggle" className="text-sm font-medium cursor-pointer">
                Hidden from Players
              </label>
              <p className="text-[11px] text-muted-foreground">
                Token won't appear in initiative tracker or presentation view
              </p>
            </div>
          </div>
          <button
            id="hidden-toggle"
            role="switch"
            aria-checked={hidden}
            onClick={() => setHidden(!hidden)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              hidden ? 'bg-warning' : 'bg-secondary'
            }`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                hidden ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        {/* Save to Library button */}
        <Tooltip content="Save this token as a reusable template in your library">
          <button
            onClick={handleSaveToLibrary}
            disabled={!name.trim() || savedToLibrary}
            className={`h-10 px-3.5 text-sm rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2 ${
              savedToLibrary
                ? 'bg-success/90 text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 disabled:opacity-50'
            }`}
          >
            <Icon name={savedToLibrary ? 'check' : 'book'} size={15} />
            <span className="font-medium">{savedToLibrary ? 'Saved!' : 'Save to Library'}</span>
          </button>
        </Tooltip>

        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="h-10 px-4 text-sm rounded-lg hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="h-10 px-5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Image picker modal */}
      {showImagePicker && (
        <TokenImagePickerModal
          onSelectAsset={handleSelectAsset}
          onClose={() => setShowImagePicker(false)}
          currentAssetId={assetId}
        />
      )}
    </Modal>
  )
}
