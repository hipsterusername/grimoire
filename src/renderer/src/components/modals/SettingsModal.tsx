import { useSettingsStore, useUIStore, useLibraryStore, useCampaignStore } from '../../stores'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { THEMES } from '../../types'
import type { Theme } from '../../types'

export function SettingsModal() {
  const settings = useSettingsStore((s) => s.settings)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setAutosaveEnabled = useSettingsStore((s) => s.setAutosaveEnabled)
  const closeModal = useUIStore((s) => s.closeModal)
  const openModal = useUIStore((s) => s.openModal)
  const library = useLibraryStore((s) => s.library)
  const activeCampaign = useCampaignStore((s) => s.activeCampaign)

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme)
  }

  const handleAutosaveToggle = () => {
    setAutosaveEnabled(!settings.autosaveEnabled)
  }

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Settings"
      size="md"
      ariaDescribedBy="settings-desc"
    >
      <p id="settings-desc" className="sr-only">
        Configure application settings including theme and autosave
      </p>

      <div className="space-y-6">
        {/* Theme Section */}
        <section>
          <h3 className="text-sm font-medium mb-3">Theme</h3>
          <div
            className="grid grid-cols-2 gap-3"
            role="radiogroup"
            aria-label="Application theme"
          >
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeChange(theme.id)}
                role="radio"
                aria-checked={settings.theme === theme.id}
                className={`relative p-3 rounded-lg border transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  settings.theme === theme.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
              >
                {/* Color preview swatches */}
                <div className="flex gap-1.5 mb-2">
                  <div
                    className="w-5 h-5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: theme.preview.primary }}
                    aria-hidden="true"
                  />
                  <div
                    className="w-5 h-5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: theme.preview.accent }}
                    aria-hidden="true"
                  />
                  <div
                    className="w-5 h-5 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: theme.preview.background }}
                    aria-hidden="true"
                  />
                </div>

                {/* Theme name and description */}
                <p className="text-sm font-medium">{theme.name}</p>
                <p className="text-xs text-muted-foreground">{theme.description}</p>

                {/* Selected indicator */}
                {settings.theme === theme.id && (
                  <div
                    className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Autosave Section */}
        <section className="border-t border-border pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-medium">Autosave</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically save your encounter when you make changes. Changes are saved after a short delay.
              </p>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.autosaveEnabled}
              onClick={handleAutosaveToggle}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${
                settings.autosaveEnabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  settings.autosaveEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
                aria-hidden="true"
              />
              <span className="sr-only">
                {settings.autosaveEnabled ? 'Disable autosave' : 'Enable autosave'}
              </span>
            </button>
          </div>
        </section>

        {/* Token Images Section - Only show when a campaign is active */}
        {activeCampaign && (
          <section className="border-t border-border pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-medium">Token Images</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage token images stored in your campaign library.
                  {library.assets.length > 0 && (
                    <span className="ml-1">
                      ({library.assets.length} image{library.assets.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openModal('asset-management')}
                className="shrink-0 h-9 px-3 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex items-center gap-2"
              >
                <Icon name="image" size={16} />
                Manage
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-6 pt-4 border-t border-border/50">
        <button
          onClick={closeModal}
          className="h-10 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Done
        </button>
      </div>
    </Modal>
  )
}
