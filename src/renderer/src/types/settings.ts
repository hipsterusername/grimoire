/**
 * Settings types and constants for user preferences
 */

export type Theme = 'mystical' | 'forest' | 'ocean' | 'blood-moon'

export interface Settings {
  version: number
  theme: Theme
  autosaveEnabled: boolean
  autosaveDelayMs: number
}

export const SETTINGS_VERSION = 1

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  theme: 'mystical',
  autosaveEnabled: true,
  autosaveDelayMs: 2000
}

export interface ThemeDefinition {
  id: Theme
  name: string
  description: string
  preview: {
    primary: string
    accent: string
    background: string
  }
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'mystical',
    name: 'Dark Mystical',
    description: 'Purple and gold arcane theme',
    preview: { primary: '#8b5cf6', accent: '#c4a962', background: '#0f0d13' }
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Green and amber woodland theme',
    preview: { primary: '#22c55e', accent: '#d97706', background: '#0d1410' }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Blue and coral deep sea theme',
    preview: { primary: '#0ea5e9', accent: '#f97316', background: '#0c1219' }
  },
  {
    id: 'blood-moon',
    name: 'Blood Moon',
    description: 'Red and gold ominous theme',
    preview: { primary: '#dc2626', accent: '#fbbf24', background: '#130d0d' }
  }
]
