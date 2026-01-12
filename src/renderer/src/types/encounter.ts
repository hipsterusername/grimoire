// Core Enums

export enum CreatureSize {
  Tiny = 'tiny',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Huge = 'huge',
  Gargantuan = 'gargantuan'
}

export enum TokenType {
  PlayerCharacter = 'pc',
  NonPlayerCharacter = 'npc',
  Monster = 'monster',
  Object = 'object'
}

export enum GridType {
  Square = 'square',
  Hex = 'hex'
}

// Token Model

export interface TokenStats {
  maxHp: number
  currentHp: number
  tempHp: number
  armorClass: number
  initiative?: number
  initiativeModifier: number // DEX modifier or other bonus added to d20 roll
}

export interface TokenCondition {
  id: string
  name: string
  icon?: string
  color?: string
}

export interface Token {
  id: string
  name: string
  type: TokenType
  size: CreatureSize
  gridX: number
  gridY: number
  imageUrl?: string
  assetId?: string // Reference to asset in library (preferred over imageUrl)
  color: string
  borderColor?: string
  stats: TokenStats
  conditions: TokenCondition[]
  notes?: string
  visible: boolean
  createdAt: string
  updatedAt: string
}

// Map Model

export interface MapSettings {
  gridType: GridType
  gridSize: number
  gridColor: string
  gridOpacity: number
  showGrid: boolean
}

export interface MapData {
  id: string
  name: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  gridSettings: MapSettings
  gridOffsetX: number
  gridOffsetY: number
  createdAt: string
  updatedAt: string
}

// Fog of War Model

export interface FogRevealArea {
  id: string
  type: 'rectangle' | 'circle' | 'polygon'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  points?: number[]
}

export interface FogOfWar {
  enabled: boolean
  color: string
  opacity: number
  revealedAreas: FogRevealArea[]
}

// Encounter Model (Root Document)

export interface Encounter {
  id: string
  name: string
  description?: string
  map: MapData | null
  tokens: Token[]
  fogOfWar: FogOfWar
  initiativeOrder: string[]
  currentTurnIndex: number
  roundNumber: number
  inCombat: boolean
  viewState: {
    zoom: number
    panX: number
    panY: number
  }
  createdAt: string
  updatedAt: string
  lastPlayedAt?: string
}

// Size to Grid Units Mapping

export const SIZE_TO_GRID_UNITS: Record<CreatureSize, number> = {
  [CreatureSize.Tiny]: 0.5,
  [CreatureSize.Small]: 1,
  [CreatureSize.Medium]: 1,
  [CreatureSize.Large]: 2,
  [CreatureSize.Huge]: 3,
  [CreatureSize.Gargantuan]: 4
}

// Default values

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  gridType: GridType.Square,
  gridSize: 50,
  gridColor: 'rgba(255, 255, 255, 0.3)',
  gridOpacity: 1,
  showGrid: true
}

export const DEFAULT_FOG_OF_WAR: FogOfWar = {
  enabled: false,
  color: '#000000',
  opacity: 0.95,
  revealedAreas: []
}

export function createDefaultEncounter(name: string): Encounter {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    map: null,
    tokens: [],
    fogOfWar: { ...DEFAULT_FOG_OF_WAR },
    initiativeOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    inCombat: false,
    viewState: {
      zoom: 1,
      panX: 0,
      panY: 0
    },
    createdAt: now,
    updatedAt: now
  }
}
