import { useState, useEffect, useId } from 'react'
import { useEncounterStore, useUIStore, useLibraryStore } from '../../stores'
import { CreatureSize, TokenType } from '../../types'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Tooltip } from '../ui/Tooltip'
import { ColorPicker } from '../ui/ColorPicker'
import { NumberInput } from '../ui/NumberInput'
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
  const [assetId, setAssetId] = useState<string | undefined>(undefined)
  const [showImagePicker, setShowImagePicker] = useState(false)
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
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium mb-1">
            Name
            <span className="text-destructive ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            aria-required="true"
            className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Type and Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={typeId} className="block text-sm font-medium mb-1">Type</label>
            <select
              id={typeId}
              value={type}
              onChange={(e) => setType(e.target.value as TokenType)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={sizeId} className="block text-sm font-medium mb-1">Size</label>
            <select
              id={sizeId}
              value={size}
              onChange={(e) => setSize(e.target.value as CreatureSize)}
              className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
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
          <div className="flex items-center gap-4">
            {/* Image preview */}
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center border-2 border-border"
              style={{ backgroundColor: color }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Token preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>

            {/* Upload/Change button */}
            <button
              onClick={() => setShowImagePicker(true)}
              className="min-h-[44px] px-4 py-2 text-sm bg-muted hover:bg-secondary border border-border rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon name="image" size={16} />
              {imagePreview ? 'Change Image' : 'Add Image'}
            </button>

            {/* Remove button */}
            {imagePreview && (
              <button
                onClick={handleRemoveImage}
                className="min-h-[44px] px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Images are automatically cropped to a circle with a gold border
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
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
            label="Current HP"
            value={currentHp}
            onChange={setCurrentHp}
            min={0}
            max={maxHp}
          />
          <div>
            <label htmlFor={acId} className="block text-sm font-medium mb-1">
              AC
              <span className="sr-only"> (Armor Class)</span>
            </label>
            <NumberInput
              id={acId}
              value={armorClass}
              onChange={setArmorClass}
              min={0}
              max={99}
            />
          </div>
          <div>
            <label htmlFor={initModId} className="block text-sm font-medium mb-1">
              Init
              <span className="sr-only">iative Modifier</span>
            </label>
            <NumberInput
              id={initModId}
              value={initiativeModifier}
              onChange={setInitiativeModifier}
              min={-10}
              max={20}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor={notesId} className="block text-sm font-medium mb-1">
            Notes
            <span className="text-muted-foreground ml-1 font-normal">(DM only)</span>
          </label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Private notes about this token..."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {notes.length}/1000 characters
          </p>
        </div>
      </div>

      <div className="flex gap-3 justify-between mt-6">
        {/* Save to Library button */}
        <Tooltip content="Save this token as a reusable template in your library">
          <button
            onClick={handleSaveToLibrary}
            disabled={!name.trim() || savedToLibrary}
            className={`min-h-[44px] px-4 py-2 text-sm rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary flex items-center gap-2 ${
              savedToLibrary
                ? 'bg-success text-white'
                : 'bg-muted hover:bg-secondary border border-border'
            }`}
          >
            <Icon name={savedToLibrary ? 'check' : 'book'} size={16} />
            {savedToLibrary ? 'Saved!' : 'Save to Library'}
          </button>
        </Tooltip>

        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
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
