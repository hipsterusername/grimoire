import { useState } from 'react'
import { useEncounterStore, useUIStore } from '../../stores'
import { Modal } from '../ui/Modal'

export function NewEncounterModal() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const createEncounter = useEncounterStore((s) => s.createEncounter)
  const saveEncounter = useEncounterStore((s) => s.saveEncounter)
  const closeModal = useUIStore((s) => s.closeModal)

  const validateName = (value: string): string => {
    if (!value.trim()) {
      return 'Encounter name is required'
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

    createEncounter(name.trim())
    await saveEncounter()
    closeModal()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setName(value)
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate()
    }
  }

  const inputId = 'encounter-name-input'
  const errorId = 'encounter-name-error'

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="New Encounter"
      size="md"
      ariaDescribedBy="new-encounter-description"
    >
      <p id="new-encounter-description" className="sr-only">
        Create a new battle encounter by entering a name
      </p>

      <div className="mb-6">
        <label htmlFor={inputId} className="block text-sm font-medium mb-2">
          Encounter Name
          <span className="text-destructive ml-1" aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Goblin Ambush"
          maxLength={100}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          className={`w-full px-3 py-2 min-h-[44px] bg-background border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            error
              ? 'border-destructive focus:ring-destructive'
              : 'border-border'
          }`}
          autoFocus
        />
        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {name.length}/100 characters
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={closeModal}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="min-h-[44px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          Create Encounter
        </button>
      </div>
    </Modal>
  )
}
