import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface PresentationBounds {
  x: number
  y: number
  width: number
  height: number
}

// Minimum dimensions to prevent divide-by-zero and rendering issues
const MIN_BOUNDS_WIDTH = 100
const MIN_BOUNDS_HEIGHT = 100

// Validate and clamp bounds to safe values - single source of truth
function validateBounds(bounds: Partial<PresentationBounds>): PresentationBounds {
  return {
    x: Math.max(0, bounds.x ?? 0),
    y: Math.max(0, bounds.y ?? 0),
    width: Math.max(MIN_BOUNDS_WIDTH, bounds.width ?? MIN_BOUNDS_WIDTH),
    height: Math.max(MIN_BOUNDS_HEIGHT, bounds.height ?? MIN_BOUNDS_HEIGHT)
  }
}

export interface PresentationState {
  encounterId: string | null
  encounter: unknown
  viewBounds: PresentationBounds
  showFogOfWar: boolean
  showInitiative: boolean
  selectedTokenId: string | null
}

interface PresentationStore {
  // State
  isPresenting: boolean
  bounds: PresentationBounds
  showFogOfWar: boolean
  showInitiative: boolean

  // For presentation window only
  receivedState: PresentationState | null

  // Actions
  startPresentation: () => Promise<void>
  stopPresentation: () => Promise<void>
  setBounds: (bounds: PresentationBounds) => void
  setShowFogOfWar: (show: boolean) => void
  setShowInitiative: (show: boolean) => void
  syncState: (state: PresentationState) => Promise<void>

  // For presentation window
  setReceivedState: (state: PresentationState) => void
}

const DEFAULT_BOUNDS: PresentationBounds = {
  x: 0,
  y: 0,
  width: 800,
  height: 600
}

export const usePresentationStore = create<PresentationStore>()(
  subscribeWithSelector((set, get) => ({
    isPresenting: false,
    bounds: DEFAULT_BOUNDS,
    showFogOfWar: true,
    showInitiative: true,
    receivedState: null,

    startPresentation: async () => {
      const result = await window.electronAPI.openPresentation()
      if (result.success) {
        set({ isPresenting: true })
      }
    },

    stopPresentation: async () => {
      await window.electronAPI.closePresentation()
      set({ isPresenting: false })
    },

    setBounds: (bounds) => {
      // Validate bounds before storing - prevents invalid state
      const validBounds = validateBounds(bounds)
      set({ bounds: validBounds })
      // Also send validated bounds to presentation window
      window.electronAPI.updatePresentationBounds(validBounds)
    },

    setShowFogOfWar: (show) => set({ showFogOfWar: show }),
    setShowInitiative: (show) => set({ showInitiative: show }),

    syncState: async (state) => {
      const { isPresenting, bounds, showFogOfWar, showInitiative } = get()
      if (!isPresenting) return

      // Ensure bounds are validated before syncing
      const validBounds = validateBounds(bounds)

      await window.electronAPI.updatePresentationState({
        ...state,
        viewBounds: validBounds,
        showFogOfWar,
        showInitiative
      })
    },

    setReceivedState: (state) => set({ receivedState: state })
  }))
)
