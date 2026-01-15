import { useEffect, useMemo } from 'react'
import { useEncounterStore, useUIStore, useLibraryStore, useCampaignStore, useSettingsStore } from './stores'
import { AppLayout } from './components/layout/AppLayout'
import { CampaignSelectScreen } from './components/layout/CampaignSelectScreen'
import { CampaignHome } from './components/layout/CampaignHome'
import { NewEncounterModal } from './components/modals/NewEncounterModal'
import { NewCampaignModal } from './components/modals/NewCampaignModal'
import { CampaignSettingsModal } from './components/modals/CampaignSettingsModal'
import { MigrationModal } from './components/modals/MigrationModal'
import { TokenEditorModal } from './components/modals/TokenEditorModal'
import { MapUploadModal } from './components/modals/MapUploadModal'
import { GridGeneratorModal } from './components/modals/GridGeneratorModal'
import { TemplateEditorModal } from './components/modals/TemplateEditorModal'
import { SettingsModal } from './components/modals/SettingsModal'
import { AssetManagementModal } from './components/modals/AssetManagementModal'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingScreen } from './components/ui/LoadingSpinner'
import { PresentationView } from './components/presentation/PresentationView'
import { useAutosave } from './lib/useAutosave'

function useIsPresentationMode() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode') === 'presentation'
  }, [])
}

function AppContent() {
  const encounter = useEncounterStore((s) => s.encounter)
  const isLoading = useEncounterStore((s) => s.isLoading)
  const activeModal = useUIStore((s) => s.activeModal)
  const openModal = useUIStore((s) => s.openModal)
  const libraryLoading = useLibraryStore((s) => s.isLoading)
  const libraryError = useLibraryStore((s) => s.error)
  const loadLibrary = useLibraryStore((s) => s.loadLibrary)

  const activeCampaign = useCampaignStore((s) => s.activeCampaign)
  const campaignLoading = useCampaignStore((s) => s.isLoading)
  const needsMigration = useCampaignStore((s) => s.needsMigration)
  const fetchCampaigns = useCampaignStore((s) => s.fetchCampaigns)
  const checkMigration = useCampaignStore((s) => s.checkMigration)

  const loadSettings = useSettingsStore((s) => s.loadSettings)

  // Enable autosave based on settings
  useAutosave()

  // Initial setup: load settings, check migration, and fetch campaigns (run once on mount)
  useEffect(() => {
    loadSettings()
    checkMigration()
    fetchCampaigns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show migration modal if needed
  useEffect(() => {
    if (needsMigration && activeModal !== 'migration') {
      openModal('migration')
    }
  }, [needsMigration, activeModal, openModal])

  if (campaignLoading && !activeCampaign) {
    return <LoadingScreen message="Loading campaigns..." />
  }

  if (isLoading) {
    return <LoadingScreen message="Loading encounter..." />
  }

  // Show error banner if library failed but allow app to continue
  const showLibraryError = libraryError && !libraryLoading && activeCampaign

  // Three-level navigation:
  // Level 1: No campaign selected -> CampaignSelectScreen
  // Level 2: Campaign selected, no encounter -> CampaignHome
  // Level 3: Encounter open -> AppLayout
  const renderContent = () => {
    if (!activeCampaign) {
      return <CampaignSelectScreen />
    }
    if (!encounter) {
      return <CampaignHome />
    }
    return <AppLayout />
  }

  return (
    <div className="w-full h-full bg-background">
      {showLibraryError && (
        <div
          className="bg-warning/10 border-b border-warning px-4 py-2 text-sm text-warning-foreground flex items-center gap-2"
          role="alert"
        >
          <span>Library failed to load. Token templates may be unavailable.</span>
          <button onClick={() => loadLibrary()} className="underline hover:no-underline">
            Retry
          </button>
        </div>
      )}
      {renderContent()}

      {/* Campaign modals */}
      {activeModal === 'new-campaign' && <NewCampaignModal />}
      {activeModal === 'campaign-settings' && <CampaignSettingsModal />}
      {activeModal === 'migration' && <MigrationModal />}

      {/* Encounter modals */}
      {activeModal === 'new-encounter' && <NewEncounterModal />}
      {activeModal === 'token-editor' && <TokenEditorModal />}
      {activeModal === 'map-upload' && <MapUploadModal />}
      {activeModal === 'grid-generator' && <GridGeneratorModal />}
      {activeModal === 'template-editor' && <TemplateEditorModal />}

      {/* Global modals */}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'asset-management' && <AssetManagementModal />}
    </div>
  )
}

function App() {
  const isPresentationMode = useIsPresentationMode()

  if (isPresentationMode) {
    return (
      <ErrorBoundary>
        <PresentationView />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
