/**
 * Shared constants used throughout the application
 */

// Token colors with semantic names for accessibility
export const TOKEN_COLORS = [
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#22c55e', name: 'Green' },
  { hex: '#14b8a6', name: 'Teal' },
  { hex: '#3b82f6', name: 'Blue' },
  { hex: '#8b5cf6', name: 'Purple' },
  { hex: '#ec4899', name: 'Pink' },
  { hex: '#6b7280', name: 'Gray' },
  { hex: '#1f2937', name: 'Dark Gray' }
] as const

// Just the hex values for simpler usage
export const TOKEN_COLOR_VALUES = TOKEN_COLORS.map((c) => c.hex)

// Creature sizes
export const CREATURE_SIZES = [
  { value: 'tiny', label: 'Tiny', space: '2.5 ft', cells: 0.5 },
  { value: 'small', label: 'Small', space: '5 ft', cells: 1 },
  { value: 'medium', label: 'Medium', space: '5 ft', cells: 1 },
  { value: 'large', label: 'Large', space: '10 ft', cells: 2 },
  { value: 'huge', label: 'Huge', space: '15 ft', cells: 3 },
  { value: 'gargantuan', label: 'Gargantuan', space: '20+ ft', cells: 4 }
] as const

// Token types
export const TOKEN_TYPES = [
  { value: 'pc', label: 'Player Character', shortLabel: 'PC' },
  { value: 'npc', label: 'NPC', shortLabel: 'NPC' },
  { value: 'monster', label: 'Monster', shortLabel: 'Monster' },
  { value: 'object', label: 'Object', shortLabel: 'Object' }
] as const

// Grid generation limits to prevent performance issues
export const GRID_LIMITS = {
  minWidth: 5,
  maxWidth: 40, // Reduced from 50
  minHeight: 5,
  maxHeight: 30, // Reduced from 50
  minCellSize: 30,
  maxCellSize: 200,
  maxTotalPixels: 2000 * 2000 // 4 megapixels max
} as const

// Canvas/view defaults
export const CANVAS_DEFAULTS = {
  minZoom: 0.1,
  maxZoom: 3,
  zoomStep: 1.1,
  defaultGridSize: 50
} as const

// UI timing constants
export const UI_TIMING = {
  debounceMs: 150,
  toastDurationMs: 4000,
  animationDurationMs: 200
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  select: { key: 'V', label: 'V' },
  pan: { key: 'H', label: 'H' },
  fogReveal: { key: 'R', label: 'R' },
  fogHide: { key: 'F', label: 'F' },
  conditions: { key: 'C', label: 'C' },
  save: { key: 'S', label: 'Ctrl+S', ctrl: true },
  undo: { key: 'Z', label: 'Ctrl+Z', ctrl: true },
  redo: { key: 'Y', label: 'Ctrl+Y', ctrl: true }
} as const

// Tool definitions with icons (SVG paths)
export const TOOLS = [
  {
    id: 'select' as const,
    label: 'Select',
    shortcut: 'V',
    icon: 'cursor',
    description: 'Select and move tokens'
  },
  {
    id: 'pan' as const,
    label: 'Pan',
    shortcut: 'H',
    icon: 'hand',
    description: 'Pan around the map',
    hint: 'Hold Space + drag as shortcut'
  },
  {
    id: 'fog-reveal' as const,
    label: 'Reveal',
    shortcut: 'R',
    icon: 'eye',
    description: 'Reveal areas hidden by fog'
  },
  {
    id: 'fog-hide' as const,
    label: 'Hide',
    shortcut: 'F',
    icon: 'eye-off',
    description: 'Hide areas with fog'
  }
] as const

// Grid themes
export const GRID_THEMES = [
  { value: 'dungeon' as const, label: 'Dungeon', description: 'Dark stone floors' },
  { value: 'forest' as const, label: 'Forest', description: 'Grass and dirt' },
  { value: 'cave' as const, label: 'Cave', description: 'Rocky cave floor' },
  { value: 'plain' as const, label: 'Plain', description: 'Simple white grid' }
] as const

// Validation limits
export const VALIDATION = {
  encounterNameMin: 2,
  encounterNameMax: 100,
  tokenNameMax: 100,
  notesMax: 1000,
  maxHp: 9999,
  maxAc: 99,
  maxInitiative: 99
} as const

// D&D 5e conditions and common buffs
export const DND_CONDITIONS = [
  // Standard D&D 5e conditions
  { name: 'Blinded', color: '#6b7280', icon: 'eye-off' },
  { name: 'Charmed', color: '#ec4899', icon: 'user' },
  { name: 'Deafened', color: '#6b7280', icon: 'minus' },
  { name: 'Frightened', color: '#a855f7', icon: 'alert-triangle' },
  { name: 'Grappled', color: '#f97316', icon: 'hand' },
  { name: 'Incapacitated', color: '#6b7280', icon: 'stop' },
  { name: 'Invisible', color: '#06b6d4', icon: 'eye-off' },
  { name: 'Paralyzed', color: '#eab308', icon: 'stop' },
  { name: 'Petrified', color: '#78716c', icon: 'box' },
  { name: 'Poisoned', color: '#22c55e', icon: 'skull' },
  { name: 'Prone', color: '#f97316', icon: 'arrow-left' },
  { name: 'Restrained', color: '#f97316', icon: 'x' },
  { name: 'Stunned', color: '#eab308', icon: 'warning' },
  { name: 'Unconscious', color: '#1f2937', icon: 'minus' },
  // Common buffs
  { name: 'Blessed', color: '#fbbf24', icon: 'plus' },
  { name: 'Concentrating', color: '#3b82f6', icon: 'eye' },
  { name: 'Hasted', color: '#22d3ee', icon: 'arrow-right' },
  { name: 'Raging', color: '#ef4444', icon: 'warning' },
  { name: 'Hunter\'s Mark', color: '#22c55e', icon: 'crosshair' },
  { name: 'Hex', color: '#8b5cf6', icon: 'skull' },
  { name: 'Shield of Faith', color: '#fbbf24', icon: 'circle' },
  { name: 'Bless', color: '#fbbf24', icon: 'plus' },
  { name: 'Guidance', color: '#14b8a6', icon: 'hand' },
  { name: 'Bardic Inspiration', color: '#ec4899', icon: 'dice' }
] as const
