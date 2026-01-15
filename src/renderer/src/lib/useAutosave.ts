import { useEffect, useRef } from 'react'
import { useEncounterStore, useSettingsStore } from '../stores'

/**
 * Hook that handles autosaving encounters when changes are made.
 * Respects the autosave settings from the settings store.
 */
export function useAutosave(): void {
  const encounter = useEncounterStore((s) => s.encounter)
  const isDirty = useEncounterStore((s) => s.isDirty)
  const saveEncounter = useEncounterStore((s) => s.saveEncounter)

  const autosaveEnabled = useSettingsStore((s) => s.settings.autosaveEnabled)
  const autosaveDelayMs = useSettingsStore((s) => s.settings.autosaveDelayMs)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Autosave effect - triggers when encounter becomes dirty
  useEffect(() => {
    // Clear any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    // Don't autosave if disabled or nothing to save
    if (!autosaveEnabled || !isDirty || !encounter) {
      return
    }

    // Schedule a save after the delay
    timeoutRef.current = setTimeout(() => {
      saveEncounter()
      timeoutRef.current = null
    }, autosaveDelayMs)

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isDirty, encounter?.id, autosaveEnabled, autosaveDelayMs, saveEncounter])

  // Force save on window close/unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && encounter) {
        // Cancel any pending autosave
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }

        // Perform synchronous save (will be handled by Electron)
        saveEncounter()

        // Show browser warning about unsaved changes
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty, encounter, saveEncounter])
}
