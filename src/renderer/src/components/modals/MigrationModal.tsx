import { useState } from 'react'
import { useCampaignStore, useUIStore } from '../../stores'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { LoadingSpinner } from '../ui/LoadingSpinner'

export function MigrationModal() {
  const [name, setName] = useState('My Adventures')
  const [error, setError] = useState('')
  const [isMigrating, setIsMigrating] = useState(false)

  const migrateData = useCampaignStore((s) => s.migrateData)
  const skipMigration = useCampaignStore((s) => s.skipMigration)
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

  const handleMigrate = async () => {
    const validationError = validateName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsMigrating(true)
    try {
      const campaign = await migrateData(name.trim())
      await loadCampaign(campaign.id)
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed')
      setIsMigrating(false)
    }
  }

  const handleSkip = () => {
    skipMigration()
    closeModal()
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    if (error) {
      setError('')
    }
  }

  const inputId = 'migration-campaign-name'
  const errorId = 'migration-error'

  return (
    <Modal
      isOpen={true}
      onClose={handleSkip}
      title="Migrate Your Data"
      size="md"
      ariaDescribedBy="migration-description"
    >
      <div className="mb-6">
        <div className="flex items-start gap-4 mb-4 p-4 bg-primary/10 rounded-lg">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon name="folder" size={20} className="text-primary" />
          </div>
          <div>
            <p id="migration-description" className="text-sm">
              We found existing encounters and library data from a previous version. To continue
              using this data, we need to migrate it to the new campaign system.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">What will happen:</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <Icon name="check" size={16} className="text-success flex-shrink-0 mt-0.5" />
                <span>Your existing encounters will be copied to the new campaign</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check" size={16} className="text-success flex-shrink-0 mt-0.5" />
                <span>Your monster templates and assets will be preserved</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check" size={16} className="text-success flex-shrink-0 mt-0.5" />
                <span>Original data will be kept as a backup</span>
              </li>
            </ul>
          </div>

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
              placeholder="e.g., My Campaign"
              maxLength={100}
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? errorId : undefined}
              className={`w-full px-3 py-2 min-h-[44px] bg-background border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                error ? 'border-destructive focus:ring-destructive' : 'border-border'
              }`}
              disabled={isMigrating}
            />
            {error && (
              <p id={errorId} className="mt-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={handleSkip}
          disabled={isMigrating}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Skip for now
        </button>
        <button
          onClick={handleMigrate}
          disabled={!name.trim() || isMigrating}
          className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
        >
          {isMigrating ? (
            <>
              <LoadingSpinner size="sm" />
              Migrating...
            </>
          ) : (
            'Migrate Data'
          )}
        </button>
      </div>
    </Modal>
  )
}
