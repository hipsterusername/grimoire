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
  | 'help'
  | null

type PanelType = 'encounter' | 'tokens' | 'initiative' | 'map' | 'library'

interface QuickConditionState {
  tokenId: string
  screenX: number
  screenY: number
}

interface ContextMenuState {
  tokenId: string
  screenX: number
  screenY: number
}

interface UIState {
  // Modals
  activeModal: ModalType
  modalData: Record<string, unknown>

  // Panels
  activePanels: PanelType[]
  sidebarCollapsed: boolean

  // Token editor
  editingTokenId: string | null

  // Quick condition panel
  quickCondition: QuickConditionState | null

  // Token context menu
  contextMenu: ContextMenuState | null

  // Actions
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void
  closeModal: () => void

  togglePanel: (panel: PanelType) => void
  setActivePanels: (panels: PanelType[]) => void
  toggleSidebar: () => void

  setEditingToken: (tokenId: string | null) => void

  openQuickCondition: (tokenId: string, screenX: number, screenY: number) => void
  closeQuickCondition: () => void

  openContextMenu: (tokenId: string, screenX: number, screenY: number) => void
  closeContextMenu: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  modalData: {},
  activePanels: ['encounter', 'tokens'],
  sidebarCollapsed: false,
  editingTokenId: null,
  quickCondition: null,
  contextMenu: null,

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

  setEditingToken: (tokenId) => set({ editingTokenId: tokenId }),

  openQuickCondition: (tokenId, screenX, screenY) =>
    set({ quickCondition: { tokenId, screenX, screenY } }),

  closeQuickCondition: () => set({ quickCondition: null }),

  openContextMenu: (tokenId, screenX, screenY) =>
    set({ contextMenu: { tokenId, screenX, screenY } }),

  closeContextMenu: () => set({ contextMenu: null })
}))
