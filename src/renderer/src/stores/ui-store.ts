import { create } from 'zustand'

type ModalType =
  | 'new-encounter'
  | 'new-campaign'
  | 'campaign-settings'
  | 'migration'
  | 'token-editor'
  | 'map-upload'
  | 'grid-generator'
  | 'settings'
  | 'token-image-picker'
  | 'template-editor'
  | 'asset-management'
  | null

type PanelType = 'encounter' | 'tokens' | 'initiative' | 'map' | 'library'

interface UIState {
  // Modals
  activeModal: ModalType
  modalData: Record<string, unknown>

  // Panels
  activePanels: PanelType[]
  sidebarCollapsed: boolean

  // Token editor
  editingTokenId: string | null

  // Actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void

  togglePanel: (panel: PanelType) => void
  setActivePanels: (panels: PanelType[]) => void
  toggleSidebar: () => void

  setEditingToken: (tokenId: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: {},
  activePanels: ['encounter', 'tokens'],
  sidebarCollapsed: false,
  editingTokenId: null,

  openModal: (modal, data = {}) =>
    set({
      activeModal: modal,
      modalData: data
    }),

  closeModal: () =>
    set({
      activeModal: null,
      modalData: {}
    }),

  togglePanel: (panel) =>
    set((state) => {
      const isActive = state.activePanels.includes(panel)
      return {
        activePanels: isActive
          ? state.activePanels.filter((p) => p !== panel)
          : [...state.activePanels, panel]
      }
    }),

  setActivePanels: (panels) => set({ activePanels: panels }),

  toggleSidebar: () =>
    set((state) => ({
      sidebarCollapsed: !state.sidebarCollapsed
    })),

  setEditingToken: (tokenId) => set({ editingTokenId: tokenId })
}))
