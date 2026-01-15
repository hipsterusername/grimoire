import { useState } from 'react'
import { useCampaignStore, useUIStore } from '../../stores'
import { Modal } from '../ui/Modal'
import { CAMPAIGN_COLORS } from '../../types'

export function NewCampaignModal() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(CAMPAIGN_COLORS[0])
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createCampaign = useCampaignStore((s) => s.createCampaign)
  const loadCampaign = useCampaignStore((s) => s.loadCampaign)
  const closeModal = useUIStore((s) => s.closeModal)

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

  const handleCreate = async () => {
    const validationError = validateName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsCreating(true)
    try {
      const campaign = await createCampaign(name.trim(), color)
      if (description.trim()) {
        await useCampaignStore.getState().updateCampaign(campaign.id, {
          description: description.trim()
        })
      }
      await loadCampaign(campaign.id)
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setIsCreating(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleCreate()
    }
  }

  const inputId = 'campaign-name-input'
  const descriptionId = 'campaign-description-input'
  const errorId = 'campaign-name-error'

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="New Campaign"
      size="md"
      ariaDescribedBy="new-campaign-description"
    >
      <p id="new-campaign-description" className="sr-only">
        Create a new campaign to organize your encounters and monster library
      </p>

      <div className="space-y-4 mb-6">
        {/* Name field */}
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium mb-2">
            Campaign Name
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id={inputId}
            type="text"
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Curse of Strahd"
            maxLength={100}
            aria-required="true"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : undefined}
            className={`w-full px-3 py-2 min-h-[44px] bg-background border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              error ? 'border-destructive focus:ring-destructive' : 'border-border'
            }`}
            autoFocus
            disabled={isCreating}
          />
          {error && (
            <p id={errorId} className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{name.length}/100 characters</p>
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
            disabled={isCreating}
          />
          <p className="mt-1 text-xs text-muted-foreground">{description.length}/500 characters</p>
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
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-secondary scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                aria-checked={color === c}
                role="radio"
                disabled={isCreating}
              />
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground mb-2">Preview</p>
          <div className="relative bg-secondary rounded-lg overflow-hidden p-4">
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: color }} />
            <div className="flex items-center gap-3 pl-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: color }}
              >
                {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <p className="font-semibold">{name.trim() || 'Campaign Name'}</p>
                {description.trim() && (
                  <p className="text-sm text-muted-foreground line-clamp-1">{description.trim()}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={closeModal}
          disabled={isCreating}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || isCreating}
          className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          {isCreating ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </Modal>
  )
}
