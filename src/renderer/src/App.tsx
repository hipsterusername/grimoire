import { useEffect, useMemo } from 'react'
import { useEncounterStore, useUIStore, useLibraryStore } from './stores'
import { AppLayout } from './components/layout/AppLayout'
import { WelcomeScreen } from './components/layout/WelcomeScreen'
import { NewEncounterModal } from './components/modals/NewEncounterModal'
import { TokenEditorModal } from './components/modals/TokenEditorModal'
import { MapUploadModal } from './components/modals/MapUploadModal'
import { GridGeneratorModal } from './components/modals/GridGeneratorModal'
import { TemplateEditorModal } from './components/modals/TemplateEditorModal'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingScreen } from './components/ui/LoadingSpinner'
import { PresentationView } from './components/presentation/PresentationView'

function useIsPresentationMode() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('mode') === 'presentation'
  }, [])
}

function AppContent() {
  const encounter = useEncounterStore((s) => s.encounter)
  const isLoading = useEncounterStore((s) => s.isLoading)
  const fetchRecentEncounters = useEncounterStore((s) => s.fetchRecentEncounters)
  const activeModal = useUIStore((s) => s.activeModal)
  const loadLibrary = useLibraryStore((s) => s.loadLibrary)
  const libraryLoading = useLibraryStore((s) => s.isLoading)
  const libraryError = useLibraryStore((s) => s.error)

  useEffect(() => {
    fetchRecentEncounters()
    loadLibrary()
  }, [fetchRecentEncounters, loadLibrary])

  if (isLoading || libraryLoading) {
    return <LoadingScreen message={isLoading ? 'Loading encounter...' : 'Loading library...'} />
  }

  // Show error banner if library failed but allow app to continue
  const showLibraryError = libraryError && !libraryLoading

  return (
    <div className="w-full h-full bg-background">
      {showLibraryError && (
        <div className="bg-warning/10 border-b border-warning px-4 py-2 text-sm text-warning-foreground flex items-center gap-2" role="alert">
          <span>Library failed to load. Token templates may be unavailable.</span>
          <button
            onClick={() => loadLibrary()}
            className="underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      {encounter ? <AppLayout /> : <WelcomeScreen />}

      {activeModal === 'new-encounter' && <NewEncounterModal />}
      {activeModal === 'token-editor' && <TokenEditorModal />}
      {activeModal === 'map-upload' && <MapUploadModal />}
      {activeModal === 'grid-generator' && <GridGeneratorModal />}
      {activeModal === 'template-editor' && <TemplateEditorModal />}
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
