import { CreatureSize, TokenType } from './encounter'

// Asset represents a processed image stored in the library
export interface Asset {
  id: string
  filename: string
  originalPath: string
  processedDataUrl: string // Cropped + bordered image as data URL
  hash: string // SHA-256 hash of original for deduplication
  width: number
  height: number
  usageCount: number
  createdAt: string
}

// MonsterTemplate is a reusable token preset
export interface MonsterTemplate {
  id: string
  name: string
  type: TokenType
  size: CreatureSize
  color: string
  assetId?: string // Reference to Asset (not duplicated)
  stats: {
    maxHp: number
    armorClass: number
    initiativeModifier?: number
  }
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// The full library persisted to disk
export interface AssetLibrary {
  version: number
  assets: Asset[]
  templates: MonsterTemplate[]
}

export const LIBRARY_VERSION = 1

export const DEFAULT_ASSET_LIBRARY: AssetLibrary = {
  version: LIBRARY_VERSION,
  assets: [],
  templates: []
}
