import { useState, useEffect } from 'react'
import { useCampaignStore, useUIStore } from '../../stores'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Icon } from '../ui/Icon'
import { CAMPAIGN_COLORS } from '../../types'

export function CampaignSettingsModal() {
  const activeCampaign = useCampaignStore((s) => s.activeCampaign)
  const updateCampaign = useCampaignStore((s) => s.updateCampaign)
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign)
  const fetchCampaigns = useCampaignStore((s) => s.fetchCampaigns)
  const loadCampaign = useCampaignStore((s) => s.loadCampaign)
  const closeModal = useUIStore((s) => s.closeModal)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(CAMPAIGN_COLORS[0])
  const [iconPath, setIconPath] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingIcon, setIsUploadingIcon] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (activeCampaign) {
      setName(activeCampaign.name)
      setDescription(activeCampaign.description || '')
      setColor(activeCampaign.color)
      setIconPath(activeCampaign.icon)
    }
  }, [activeCampaign])

  const validateName = (value: string): string => {
    if (!value.trim()) {
      return 'Campaign name is required'
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters'
    }
    if (value.trim().length > 100) {
      return 'Name must be less than 100 characters'
    }
    return ''
  }

  const handleSave = async () => {
    const validationError = validateName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!activeCampaign) return

    setIsSaving(true)
    try {
      await updateCampaign(activeCampaign.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        color
      })
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update campaign')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeCampaign) return

    try {
      await deleteCampaign(activeCampaign.id)
      setShowDeleteConfirm(false)
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign')
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (error) {
      setError('')
    }
  }

  const handleIconUpload = async () => {
    if (!activeCampaign) return

    setIsUploadingIcon(true)
    try {
      const result = await window.electronAPI.uploadCampaignIcon(activeCampaign.id)
      if (result) {
        setIconPath(result.path)
        // Refresh campaign data to get the updated icon
        await loadCampaign(activeCampaign.id)
        await fetchCampaigns()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload icon')
    } finally {
      setIsUploadingIcon(false)
    }
  }

  const handleIconRemove = async () => {
    if (!activeCampaign) return

    setIsUploadingIcon(true)
    try {
      await window.electronAPI.removeCampaignIcon(activeCampaign.id)
      setIconPath(undefined)
      // Refresh campaign data
      await loadCampaign(activeCampaign.id)
      await fetchCampaigns()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove icon')
    } finally {
      setIsUploadingIcon(false)
    }
  }

  if (!activeCampaign) {
    return null
  }

  const inputId = 'campaign-settings-name'
  const descriptionId = 'campaign-settings-description'
  const errorId = 'campaign-settings-error'

  return (
    <>
      <Modal
        isOpen={true}
        onClose={closeModal}
        title="Campaign Settings"
        size="md"
        ariaDescribedBy="campaign-settings-desc"
      >
        <p id="campaign-settings-desc" className="sr-only">
          Edit campaign settings or delete the campaign
        </p>

        <div className="space-y-4 mb-6">
          {/* Name field */}
          <div>
            <label htmlFor={inputId} className="block text-sm font-medium mb-2">
              Campaign Name
              <span className="text-destructive ml-1" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id={inputId}
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., Curse of Strahd"
              maxLength={100}
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
              className={`w-full px-3 py-2 min-h-[44px] bg-background border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                error ? 'border-destructive focus:ring-destructive' : 'border-border'
              }`}
              disabled={isSaving}
            />
            {error && (
              <p id={errorId} className="mt-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          {/* Description field */}
          <div>
            <label htmlFor={descriptionId} className="block text-sm font-medium mb-2">
              Description
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </label>
            <textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your campaign..."
              maxLength={500}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Color</label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Campaign color">
              {CAMPAIGN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-secondary scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                  aria-checked={color === c}
                  role="radio"
                  disabled={isSaving}
                />
              ))}
            </div>
          </div>

          {/* Campaign Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Icon
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              {/* Icon preview */}
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-border"
                style={{ backgroundColor: iconPath ? 'transparent' : color }}
              >
                {iconPath ? (
                  <img
                    src={window.electronAPI.getLocalFileUrl(iconPath)}
                    alt="Campaign icon"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-display text-white/90">
                    {name.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Upload/Remove buttons */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleIconUpload}
                  disabled={isSaving || isUploadingIcon}
                  className="min-h-[36px] px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 flex items-center gap-2"
                >
                  <Icon name="upload" size={16} />
                  {isUploadingIcon ? 'Uploading...' : iconPath ? 'Change Icon' : 'Upload Icon'}
                </button>
                {iconPath && (
                  <button
                    type="button"
                    onClick={handleIconRemove}
                    disabled={isSaving || isUploadingIcon}
                    className="min-h-[36px] px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 flex items-center gap-2"
                  >
                    <Icon name="x" size={16} />
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Square images work best. Recommended size: 128×128 pixels or larger.
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border-t border-border pt-4 mb-6">
          <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Deleting this campaign will permanently remove all encounters and the campaign library.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
            className="min-h-[40px] px-4 py-2 text-sm border border-destructive text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            Delete Campaign
          </button>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={closeModal}
            disabled={isSaving}
            className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${activeCampaign.name}"? This will permanently remove all encounters and the campaign library. This action cannot be undone.`}
        confirmLabel="Delete Campaign"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  )
}
