import '@testing-library/jest-dom/vitest'
import { vi, beforeEach } from 'vitest'

// Mock the Electron API for testing
const mockElectronAPI = {
  // Encounters (legacy - kept for backward compatibility)
  listEncounters: vi.fn().mockResolvedValue([]),
  loadEncounter: vi.fn().mockResolvedValue(null),
  saveEncounter: vi.fn().mockResolvedValue({ success: true }),
  deleteEncounter: vi.fn().mockResolvedValue({ success: true }),

  // Campaigns
  listCampaigns: vi.fn().mockResolvedValue([]),
  loadCampaign: vi.fn().mockResolvedValue(null),
  createCampaign: vi.fn().mockImplementation((name: string, color: string) =>
    Promise.resolve({ id: 'test-campaign-id', name, color, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  ),
  updateCampaign: vi.fn().mockResolvedValue({ success: true }),
  deleteCampaign: vi.fn().mockResolvedValue({ success: true }),
  listCampaignEncounters: vi.fn().mockResolvedValue([]),
  loadCampaignEncounter: vi.fn().mockResolvedValue(null),
  saveCampaignEncounter: vi.fn().mockResolvedValue({ success: true }),
  deleteCampaignEncounter: vi.fn().mockResolvedValue({ success: true }),
  loadCampaignLibrary: vi.fn().mockResolvedValue({ tokenTemplates: [], mapTemplates: [] }),
  saveCampaignLibrary: vi.fn().mockResolvedValue({ success: true }),
  saveCampaignAsset: vi.fn().mockResolvedValue({ path: '/test/path', filename: 'test.png' }),
  exportCampaign: vi.fn().mockResolvedValue({ success: true }),
  importCampaign: vi.fn().mockResolvedValue(null),
  checkMigration: vi.fn().mockResolvedValue({ needsMigration: false }),
  migrateData: vi.fn().mockResolvedValue({ id: 'migrated-campaign', name: 'Migrated', color: '#8b5cf6', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),

  // Images
  uploadImage: vi.fn().mockResolvedValue(null),
  uploadCampaignImage: vi.fn().mockResolvedValue(null),
  getImageDataUrl: vi.fn().mockResolvedValue(null),
  getLocalFileUrl: vi.fn((path: string) => `local-file://${encodeURIComponent(path)}`),

  // Library (legacy - kept for backward compatibility)
  loadLibrary: vi.fn().mockResolvedValue({ tokenTemplates: [], mapTemplates: [] }),
  saveLibrary: vi.fn().mockResolvedValue({ success: true }),
  saveAsset: vi.fn().mockResolvedValue({ path: '/test/path', filename: 'test.png' }),
  deleteAsset: vi.fn().mockResolvedValue({ success: true }),

  // Presentation
  openPresentation: vi.fn().mockResolvedValue({ success: true, alreadyOpen: false }),
  closePresentation: vi.fn().mockResolvedValue({ success: true }),
  isPresentationOpen: vi.fn().mockResolvedValue({ isOpen: false }),
  updatePresentationState: vi.fn().mockResolvedValue({ success: true }),
  updatePresentationBounds: vi.fn().mockResolvedValue({ success: true }),
  onPresentationStateUpdate: vi.fn().mockReturnValue(() => {}),
  onPresentationBoundsUpdate: vi.fn().mockReturnValue(() => {}),
  onPresentationClosed: vi.fn().mockReturnValue(() => {}),
  requestPresentationState: vi.fn().mockResolvedValue({ success: true }),
  onPresentationStateRequest: vi.fn().mockReturnValue(() => {}),

  // Settings
  loadSettings: vi.fn().mockResolvedValue(null),
  saveSettings: vi.fn().mockResolvedValue({ success: true })
}

// Attach to window
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})

// Export for use in tests
export { mockElectronAPI }

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
