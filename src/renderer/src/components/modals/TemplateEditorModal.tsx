import { useState, useEffect, useId } from 'react'
import { useUIStore, useLibraryStore } from '../../stores'
import { CreatureSize, TokenType } from '../../types'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { ColorPicker } from '../ui/ColorPicker'
import { NumberInput } from '../ui/NumberInput'
import { CREATURE_SIZES, TOKEN_TYPES } from '../../lib/constants'
import { TokenImagePickerModal } from './TokenImagePickerModal'

const SIZE_OPTIONS = CREATURE_SIZES.map((s) => ({
  value: s.value as CreatureSize,
  label: `${s.label} (${s.space})`
}))

const TYPE_OPTIONS = TOKEN_TYPES.filter((t) => t.value !== 'object').map((t) => ({
  value: t.value as TokenType,
  label: t.label
}))

export function TemplateEditorModal() {
  const modalData = useUIStore((s) => s.modalData)
  const closeModal = useUIStore((s) => s.closeModal)

  const library = useLibraryStore((s) => s.library)
  const addTemplate = useLibraryStore((s) => s.addTemplate)
  const updateTemplate = useLibraryStore((s) => s.updateTemplate)

  const templateId = modalData.templateId as string | null
  const defaultType = (modalData.defaultType as TokenType) ?? TokenType.Monster
  const existingTemplate = templateId
    ? library.templates.find((t) => t.id === templateId)
    : null
  const isEditing = !!existingTemplate

  const [name, setName] = useState('')
  const [type, setType] = useState<TokenType>(defaultType)
  const [size, setSize] = useState<CreatureSize>(CreatureSize.Medium)
  const [color, setColor] = useState('#ef4444')
  const [maxHp, setMaxHp] = useState(10)
  const [armorClass, setArmorClass] = useState(10)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState('')
  const [assetId, setAssetId] = useState<string | undefined>(undefined)
  const [showImagePicker, setShowImagePicker] = useState(false)

  // Generate unique IDs for form fields
  const nameId = useId()
  const typeId = useId()
  const sizeId = useId()
  const maxHpId = useId()
  const acId = useId()
  const notesId = useId()
  const tagsId = useId()

  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name)
      setType(existingTemplate.type)
      setSize(existingTemplate.size)
      setColor(existingTemplate.color)
      setMaxHp(existingTemplate.stats.maxHp)
      setArmorClass(existingTemplate.stats.armorClass)
      setNotes(existingTemplate.notes ?? '')
      setTags(existingTemplate.tags.join(', '))
      setAssetId(existingTemplate.assetId)
    }
  }, [existingTemplate])

  // Get the current asset's image preview
  const currentAsset = assetId ? library.assets.find((a) => a.id === assetId) : null
  const imagePreview = currentAsset?.processedDataUrl

  const handleSave = () => {
    const tagArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (isEditing && templateId) {
      updateTemplate(templateId, {
        name,
        type,
        size,
        color,
        assetId,
        stats: { maxHp, armorClass },
        notes: notes || undefined,
        tags: tagArray
      })
    } else {
      addTemplate({
        name,
        type,
        size,
        color,
        assetId,
        stats: { maxHp, armorClass },
        notes: notes || undefined,
        tags: tagArray
      })
    }

    closeModal()
  }

  const handleSelectAsset = (newAssetId: string) => {
    setAssetId(newAssetId)
    setShowImagePicker(false)
  }

  const handleRemoveImage = () => {
    setAssetId(undefined)
  }

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title={isEditing ? 'Edit Template' : 'Create Template'}
      size="lg"
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium mb-1">
            Name
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g., Goblin, Orc, Dragon"
            aria-required="true"
            aria-invalid={!name.trim()}
            aria-describedby={!name.trim() ? `${nameId}-error` : undefined}
            className={`w-full min-h-[44px] px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
              !name.trim() ? 'border-destructive' : 'border-border'
            }`}
          />
          {!name.trim() && (
            <p id={`${nameId}-error`} className="mt-1 text-xs text-destructive" role="alert">
              Name is required
            </p>
          )}
        </div>

        {/* Type and Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={typeId} className="block text-sm font-medium mb-1">
              Type
            </label>
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
            <label htmlFor={sizeId} className="block text-sm font-medium mb-1">
              Size
            </label>
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
                <img
                  src={imagePreview}
                  alt="Token preview"
                  className="w-full h-full object-cover"
                />
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <NumberInput
            id={maxHpId}
            label="Max HP"
            value={maxHp}
            onChange={setMaxHp}
            min={0}
            max={9999}
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
        </div>

        {/* Tags */}
        <div>
          <label htmlFor={tagsId} className="block text-sm font-medium mb-1">
            Tags
            <span className="text-muted-foreground ml-1 font-normal">(comma separated)</span>
          </label>
          <input
            id={tagsId}
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., undead, beast, humanoid"
            className="w-full min-h-[44px] px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor={notesId} className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id={notesId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Additional notes about this creature..."
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button
          onClick={closeModal}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          {isEditing ? 'Save Changes' : 'Create Template'}
        </button>
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
