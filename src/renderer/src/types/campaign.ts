import type { Encounter } from './encounter'
import type { AssetLibrary } from './library'

// Campaign represents a collection of encounters with an isolated library
export interface Campaign {
  id: string
  name: string
  description?: string
  color: string // Accent color for visual identification
  icon?: string // Path to custom campaign icon image
  createdAt: string
  updatedAt: string
  lastOpenedAt?: string
}

// Lightweight campaign data for list display
export interface CampaignListItem {
  id: string
  name: string
  description?: string
  color: string
  icon?: string // Path to custom campaign icon image
  encounterCount: number
  updatedAt: string
}

// Bundled asset for import/export (base64 encoded)
export interface BundledAsset {
  id: string
  filename: string
  dataUrl: string
}

// Complete campaign bundle for .grimoire export files
export interface CampaignBundle {
  version: number
  exportedAt: string
  campaign: Omit<Campaign, 'id'> & { originalId: string }
  encounters: Array<Omit<Encounter, 'id' | 'campaignId'> & { originalId: string }>
  library: AssetLibrary
  assets: BundledAsset[]
}

export const CAMPAIGN_BUNDLE_VERSION = 1

// Default campaign colors palette
export const CAMPAIGN_COLORS = [
  '#8b5cf6', // Purple (primary)
  '#c4a962', // Gold (accent)
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#3b82f6', // Blue
  '#a855f7', // Violet
  '#ec4899', // Pink
  '#6b7280', // Gray
  '#78716c'  // Stone
] as const

export function createDefaultCampaign(name: string, color?: string): Campaign {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    color: color ?? CAMPAIGN_COLORS[0],
    createdAt: now,
    updatedAt: now
  }
}
