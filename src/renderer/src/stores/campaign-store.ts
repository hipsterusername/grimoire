import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Campaign, CampaignListItem } from '../types'

interface CampaignState {
  // State
  campaigns: CampaignListItem[]
  activeCampaign: Campaign | null
  isLoading: boolean
  error: string | null
  needsMigration: boolean

  // Lifecycle
  fetchCampaigns: () => Promise<void>
  loadCampaign: (id: string) => Promise<void>
  closeCampaign: () => void

  // CRUD
  createCampaign: (name: string, color?: string) => Promise<Campaign>
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>

  // Import/Export
  exportCampaign: (id: string) => Promise<void>
  importCampaign: () => Promise<Campaign | null>

  // Migration
  checkMigration: () => Promise<void>
  migrateData: (campaignName: string) => Promise<Campaign>
  skipMigration: () => void
}

export const useCampaignStore = create<CampaignState>()(
  subscribeWithSelector((set, get) => ({
    campaigns: [],
    activeCampaign: null,
    isLoading: false,
    error: null,
    needsMigration: false,

    fetchCampaigns: async () => {
      set({ isLoading: true, error: null })
      try {
        const campaigns = await window.electronAPI.listCampaigns()
        set({ campaigns, isLoading: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          error: `Failed to load campaigns: ${message}`,
          isLoading: false
        })
      }
    },

    loadCampaign: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const campaign = await window.electronAPI.loadCampaign(id)
        set({ activeCampaign: campaign, isLoading: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          error: `Failed to load campaign: ${message}`,
          isLoading: false
        })
      }
    },

    closeCampaign: () => {
      set({ activeCampaign: null })
    },

    createCampaign: async (name, color) => {
      set({ isLoading: true, error: null })
      try {
        const campaign = await window.electronAPI.createCampaign(name, color)
        await get().fetchCampaigns()
        set({ isLoading: false })
        return campaign
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          error: `Failed to create campaign: ${message}`,
          isLoading: false
        })
        throw error
      }
    },

    updateCampaign: async (id, updates) => {
      try {
        const updated = await window.electronAPI.updateCampaign(id, updates)
        const { activeCampaign } = get()
        if (activeCampaign?.id === id) {
          set({ activeCampaign: updated })
        }
        await get().fetchCampaigns()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to update campaign: ${message}` })
        throw error
      }
    },

    deleteCampaign: async (id) => {
      try {
        await window.electronAPI.deleteCampaign(id)
        const { activeCampaign } = get()
        if (activeCampaign?.id === id) {
          set({ activeCampaign: null })
        }
        await get().fetchCampaigns()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to delete campaign: ${message}` })
        throw error
      }
    },

    exportCampaign: async (id) => {
      try {
        await window.electronAPI.exportCampaign(id)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to export campaign: ${message}` })
        throw error
      }
    },

    importCampaign: async () => {
      set({ isLoading: true, error: null })
      try {
        const campaign = await window.electronAPI.importCampaign()
        if (campaign) {
          await get().fetchCampaigns()
        }
        set({ isLoading: false })
        return campaign
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          error: `Failed to import campaign: ${message}`,
          isLoading: false
        })
        return null
      }
    },

    checkMigration: async () => {
      try {
        const result = await window.electronAPI.checkMigration()
        set({ needsMigration: result.needsMigration })
      } catch (error) {
        console.error('Failed to check migration status:', error)
      }
    },

    migrateData: async (campaignName) => {
      set({ isLoading: true, error: null })
      try {
        const campaign = await window.electronAPI.migrateData(campaignName)
        set({ needsMigration: false, isLoading: false })
        await get().fetchCampaigns()
        return campaign
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          error: `Failed to migrate data: ${message}`,
          isLoading: false
        })
        throw error
      }
    },

    skipMigration: () => {
      set({ needsMigration: false })
    }
  }))
)
