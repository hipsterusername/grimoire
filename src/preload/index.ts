import { contextBridge, ipcRenderer } from 'electron'

export interface EncounterListItem {
  id: string
  name: string
  updatedAt: string
}

export interface UploadResult {
  path: string
  filename: string
}

export interface SaveAssetResult {
  path: string
  filename: string
}

export interface CampaignListItem {
  id: string
  name: string
  description?: string
  color: string
  encounterCount: number
  updatedAt: string
}

export interface Campaign {
  id: string
  name: string
  description?: string
  color: string
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
}

const electronAPI = {
  // Encounters
  listEncounters: (): Promise<EncounterListItem[]> =>
    ipcRenderer.invoke('encounters:list'),

  loadEncounter: (id: string) =>
    ipcRenderer.invoke('encounters:load', id),

  saveEncounter: (encounter: unknown) =>
    ipcRenderer.invoke('encounters:save', encounter),

  deleteEncounter: (id: string) =>
    ipcRenderer.invoke('encounters:delete', id),

  // Images
  uploadImage: (type: 'map' | 'token'): Promise<UploadResult | null> =>
    ipcRenderer.invoke('images:upload', type),

  getImageDataUrl: (imagePath: string): Promise<string | null> =>
    ipcRenderer.invoke('images:getDataUrl', imagePath),

  // Get local file URL for secure image loading (uses custom protocol)
  getLocalFileUrl: (filePath: string): string =>
    `local-file://${encodeURIComponent(filePath)}`,

  // Library
  loadLibrary: (): Promise<unknown> => ipcRenderer.invoke('library:load'),

  saveLibrary: (library: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('library:save', library),

  saveAsset: (data: { filename: string; dataUrl: string }): Promise<SaveAssetResult> =>
    ipcRenderer.invoke('library:saveAsset', data),

  deleteAsset: (assetPath: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('library:deleteAsset', assetPath),

  // Campaigns
  listCampaigns: (): Promise<CampaignListItem[]> =>
    ipcRenderer.invoke('campaigns:list'),

  loadCampaign: (id: string): Promise<Campaign> =>
    ipcRenderer.invoke('campaigns:load', id),

  createCampaign: (name: string, color?: string): Promise<Campaign> =>
    ipcRenderer.invoke('campaigns:create', name, color),

  updateCampaign: (id: string, updates: Partial<Campaign>): Promise<Campaign> =>
    ipcRenderer.invoke('campaigns:update', id, updates),

  deleteCampaign: (id: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('campaigns:delete', id),

  // Campaign encounters
  listCampaignEncounters: (campaignId: string): Promise<EncounterListItem[]> =>
    ipcRenderer.invoke('campaigns:listEncounters', campaignId),

  loadCampaignEncounter: (campaignId: string, encounterId: string): Promise<unknown> =>
    ipcRenderer.invoke('campaigns:loadEncounter', campaignId, encounterId),

  saveCampaignEncounter: (campaignId: string, encounter: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('campaigns:saveEncounter', campaignId, encounter),

  deleteCampaignEncounter: (campaignId: string, encounterId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('campaigns:deleteEncounter', campaignId, encounterId),

  // Campaign library
  loadCampaignLibrary: (campaignId: string): Promise<unknown> =>
    ipcRenderer.invoke('campaigns:loadLibrary', campaignId),

  saveCampaignLibrary: (campaignId: string, library: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('campaigns:saveLibrary', campaignId, library),

  saveCampaignAsset: (
    campaignId: string,
    data: { filename: string; dataUrl: string }
  ): Promise<SaveAssetResult> =>
    ipcRenderer.invoke('campaigns:saveAsset', campaignId, data),

  uploadCampaignImage: (campaignId: string, type: 'map' | 'token'): Promise<UploadResult | null> =>
    ipcRenderer.invoke('campaigns:uploadImage', campaignId, type),

  uploadCampaignIcon: (campaignId: string): Promise<UploadResult | null> =>
    ipcRenderer.invoke('campaigns:uploadIcon', campaignId),

  removeCampaignIcon: (campaignId: string): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('campaigns:removeIcon', campaignId),

  // Campaign import/export
  exportCampaign: (id: string): Promise<{ success: boolean; path: string } | null> =>
    ipcRenderer.invoke('campaigns:export', id),

  importCampaign: (): Promise<Campaign | null> =>
    ipcRenderer.invoke('campaigns:import'),

  // Migration
  checkMigration: (): Promise<{ needsMigration: boolean }> =>
    ipcRenderer.invoke('migration:check'),

  migrateData: (campaignName: string): Promise<Campaign> =>
    ipcRenderer.invoke('migration:migrate', campaignName),

  // Settings
  loadSettings: (): Promise<unknown> =>
    ipcRenderer.invoke('settings:load'),

  saveSettings: (settings: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('settings:save', settings),

  // Presentation
  openPresentation: (): Promise<{ success: boolean; alreadyOpen: boolean }> =>
    ipcRenderer.invoke('presentation:open'),

  closePresentation: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('presentation:close'),

  isPresentationOpen: (): Promise<{ isOpen: boolean }> =>
    ipcRenderer.invoke('presentation:isOpen'),

  updatePresentationState: (state: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('presentation:updateState', state),

  updatePresentationBounds: (bounds: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('presentation:updateBounds', bounds),

  // Presentation event listeners (for the presentation window)
  onPresentationStateUpdate: (callback: (state: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: unknown) => callback(state)
    ipcRenderer.on('presentation:stateUpdate', listener)
    return () => ipcRenderer.removeListener('presentation:stateUpdate', listener)
  },

  onPresentationBoundsUpdate: (callback: (bounds: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, bounds: unknown) => callback(bounds)
    ipcRenderer.on('presentation:boundsUpdate', listener)
    return () => ipcRenderer.removeListener('presentation:boundsUpdate', listener)
  },

  onPresentationClosed: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('presentation:closed', listener)
    return () => ipcRenderer.removeListener('presentation:closed', listener)
  },

  // Presentation window requests state
  requestPresentationState: (): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('presentation:requestState'),

  // Main window listens for state requests
  onPresentationStateRequest: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('presentation:requestState', listener)
    return () => ipcRenderer.removeListener('presentation:requestState', listener)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration
declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
