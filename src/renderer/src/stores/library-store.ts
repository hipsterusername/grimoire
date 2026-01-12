import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Asset, AssetLibrary, MonsterTemplate } from '../types'
import { DEFAULT_ASSET_LIBRARY, LIBRARY_VERSION } from '../types'

interface LibraryState {
  library: AssetLibrary
  isLoading: boolean
  error: string | null

  // Lifecycle
  loadLibrary: () => Promise<void>
  saveLibrary: () => Promise<void>

  // Asset actions
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'usageCount'>) => string
  removeAsset: (id: string) => void
  getAssetById: (id: string) => Asset | undefined
  findAssetByHash: (hash: string) => Asset | undefined
  incrementAssetUsage: (id: string) => void
  decrementAssetUsage: (id: string) => void

  // Template actions
  addTemplate: (template: Omit<MonsterTemplate, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateTemplate: (id: string, updates: Partial<MonsterTemplate>) => void
  removeTemplate: (id: string) => void
  duplicateTemplate: (id: string) => string | null

  // Queries
  getTemplatesByTag: (tag: string) => MonsterTemplate[]
  searchTemplates: (query: string) => MonsterTemplate[]
}

export const useLibraryStore = create<LibraryState>()(
  subscribeWithSelector((set, get) => ({
    library: { ...DEFAULT_ASSET_LIBRARY },
    isLoading: false,
    error: null,

    loadLibrary: async () => {
      set({ isLoading: true, error: null })
      try {
        const library = await window.electronAPI.loadLibrary()
        if (library && typeof library === 'object') {
          // Migrate if needed
          const typedLibrary = library as AssetLibrary
          if (typedLibrary.version < LIBRARY_VERSION) {
            // Future migration logic would go here
          }
          set({ library: typedLibrary, isLoading: false })
        } else {
          set({ library: { ...DEFAULT_ASSET_LIBRARY }, isLoading: false })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          library: { ...DEFAULT_ASSET_LIBRARY },
          isLoading: false,
          error: `Failed to load library: ${message}`
        })
      }
    },

    saveLibrary: async () => {
      const { library } = get()
      try {
        await window.electronAPI.saveLibrary(library)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to save library: ${message}` })
      }
    },

    // Asset actions
    addAsset: (assetData) => {
      const id = crypto.randomUUID()
      const asset: Asset = {
        ...assetData,
        id,
        usageCount: 0,
        createdAt: new Date().toISOString()
      }
      set((state) => ({
        library: {
          ...state.library,
          assets: [...state.library.assets, asset]
        }
      }))
      get().saveLibrary()
      return id
    },

    removeAsset: (id) => {
      set((state) => ({
        library: {
          ...state.library,
          assets: state.library.assets.filter((a) => a.id !== id)
        }
      }))
      get().saveLibrary()
    },

    getAssetById: (id) => {
      return get().library.assets.find((a) => a.id === id)
    },

    findAssetByHash: (hash) => {
      return get().library.assets.find((a) => a.hash === hash)
    },

    incrementAssetUsage: (id) => {
      set((state) => ({
        library: {
          ...state.library,
          assets: state.library.assets.map((a) =>
            a.id === id ? { ...a, usageCount: a.usageCount + 1 } : a
          )
        }
      }))
      get().saveLibrary()
    },

    decrementAssetUsage: (id) => {
      set((state) => ({
        library: {
          ...state.library,
          assets: state.library.assets.map((a) =>
            a.id === id ? { ...a, usageCount: Math.max(0, a.usageCount - 1) } : a
          )
        }
      }))
      get().saveLibrary()
    },

    // Template actions
    addTemplate: (templateData) => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const template: MonsterTemplate = {
        ...templateData,
        id,
        createdAt: now,
        updatedAt: now
      }
      set((state) => ({
        library: {
          ...state.library,
          templates: [...state.library.templates, template]
        }
      }))
      get().saveLibrary()
      return id
    },

    updateTemplate: (id, updates) => {
      set((state) => ({
        library: {
          ...state.library,
          templates: state.library.templates.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          )
        }
      }))
      get().saveLibrary()
    },

    removeTemplate: (id) => {
      set((state) => ({
        library: {
          ...state.library,
          templates: state.library.templates.filter((t) => t.id !== id)
        }
      }))
      get().saveLibrary()
    },

    duplicateTemplate: (id) => {
      const { library } = get()
      const original = library.templates.find((t) => t.id === id)
      if (!original) return null

      const newId = crypto.randomUUID()
      const now = new Date().toISOString()
      const duplicate: MonsterTemplate = {
        ...original,
        id: newId,
        name: `${original.name} (Copy)`,
        createdAt: now,
        updatedAt: now
      }

      set((state) => ({
        library: {
          ...state.library,
          templates: [...state.library.templates, duplicate]
        }
      }))
      get().saveLibrary()
      return newId
    },

    // Queries
    getTemplatesByTag: (tag) => {
      return get().library.templates.filter((t) =>
        t.tags.some((tTag) => tTag.toLowerCase() === tag.toLowerCase())
      )
    },

    searchTemplates: (query) => {
      const lowerQuery = query.toLowerCase()
      return get().library.templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
    }
  }))
)
