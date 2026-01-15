import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Settings, Theme } from '../types'
import { DEFAULT_SETTINGS, SETTINGS_VERSION } from '../types'

interface SettingsState {
  settings: Settings
  isLoading: boolean
  error: string | null

  // Lifecycle
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>

  // Actions
  setTheme: (theme: Theme) => void
  setAutosaveEnabled: (enabled: boolean) => void
  setAutosaveDelay: (delayMs: number) => void
}

// Apply theme to document
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    settings: { ...DEFAULT_SETTINGS },
    isLoading: false,
    error: null,

    loadSettings: async () => {
      set({ isLoading: true, error: null })
      try {
        const settings = await window.electronAPI.loadSettings()
        if (settings && typeof settings === 'object') {
          const typedSettings = settings as Settings
          // Migrate if needed
          if (typedSettings.version < SETTINGS_VERSION) {
            // Future migration logic would go here
          }
          set({ settings: typedSettings, isLoading: false })
          applyTheme(typedSettings.theme)
        } else {
          // No saved settings, use defaults
          set({ settings: { ...DEFAULT_SETTINGS }, isLoading: false })
          applyTheme(DEFAULT_SETTINGS.theme)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          settings: { ...DEFAULT_SETTINGS },
          isLoading: false,
          error: `Failed to load settings: ${message}`
        })
        applyTheme(DEFAULT_SETTINGS.theme)
      }
    },

    saveSettings: async () => {
      const { settings } = get()
      try {
        await window.electronAPI.saveSettings(settings)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to save settings: ${message}` })
      }
    },

    setTheme: (theme) => {
      set((state) => ({
        settings: { ...state.settings, theme }
      }))
      applyTheme(theme)
      get().saveSettings()
    },

    setAutosaveEnabled: (enabled) => {
      set((state) => ({
        settings: { ...state.settings, autosaveEnabled: enabled }
      }))
      get().saveSettings()
    },

    setAutosaveDelay: (delayMs) => {
      set((state) => ({
        settings: { ...state.settings, autosaveDelayMs: delayMs }
      }))
      get().saveSettings()
    }
  }))
)
