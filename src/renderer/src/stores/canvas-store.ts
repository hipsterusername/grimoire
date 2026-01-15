import { create } from 'zustand'
import type { CanvasTool, CanvasViewState, CanvasSelection, CreatureSize } from '../types'
import { CREATURE_SIZES } from '../lib/constants'

export interface MovementMeasure {
  startGridX: number
  startGridY: number
  currentGridX: number
  currentGridY: number
  tokenId: string
}

interface CanvasState {
  // View
  view: CanvasViewState
  viewportSize: { width: number; height: number }

  // Tool
  activeTool: CanvasTool

  // Selection
  selection: CanvasSelection | null
  hoveredTokenId: string | null

  // Last clicked cell for token placement
  lastClickedCell: { gridX: number; gridY: number } | null

  // Interaction state
  isDragging: boolean
  isPanning: boolean

  // Movement measurement during token drag
  movementMeasure: MovementMeasure | null

  // Actions
  setViewportSize: (width: number, height: number) => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  zoomToFit: (containerWidth: number, containerHeight: number, contentWidth: number, contentHeight: number) => void

  setPan: (x: number, y: number) => void

  setTool: (tool: CanvasTool) => void

  setSelection: (selection: CanvasSelection | null) => void
  selectToken: (tokenId: string) => void
  addToSelection: (tokenId: string) => void
  clearSelection: () => void

  setHoveredToken: (tokenId: string | null) => void

  setDragging: (dragging: boolean) => void
  setPanning: (panning: boolean) => void

  setLastClickedCell: (gridX: number, gridY: number) => void

  // Movement measurement
  startMovementMeasure: (tokenId: string, gridX: number, gridY: number) => void
  updateMovementMeasure: (gridX: number, gridY: number) => void
  clearMovementMeasure: () => void

  // Center view on token
  centerOnToken: (gridX: number, gridY: number, gridSize: number, tokenSize: CreatureSize) => void
}

const ZOOM_MIN = 0.1
const ZOOM_MAX = 3.0
const ZOOM_STEP = 0.15

export const useCanvasStore = create<CanvasState>((set) => ({
  view: { zoom: 1, panX: 0, panY: 0 },
  viewportSize: { width: 800, height: 600 },
  activeTool: 'select',
  selection: null,
  hoveredTokenId: null,
  lastClickedCell: null,
  isDragging: false,
  isPanning: false,
  movementMeasure: null,

  setViewportSize: (width, height) =>
    set({ viewportSize: { width, height } }),

  setZoom: (zoom) =>
    set((state) => ({
      view: {
        ...state.view,
        zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom))
      }
    })),

  zoomIn: () =>
    set((state) => ({
      view: {
        ...state.view,
        zoom: Math.min(ZOOM_MAX, state.view.zoom + ZOOM_STEP)
      }
    })),

  zoomOut: () =>
    set((state) => ({
      view: {
        ...state.view,
        zoom: Math.max(ZOOM_MIN, state.view.zoom - ZOOM_STEP)
      }
    })),

  resetZoom: () =>
    set((state) => ({
      view: { ...state.view, zoom: 1, panX: 0, panY: 0 }
    })),

  zoomToFit: (containerWidth, containerHeight, contentWidth, contentHeight) => {
    const scaleX = containerWidth / contentWidth
    const scaleY = containerHeight / contentHeight
    const scale = Math.min(scaleX, scaleY, 1) * 0.9 // 90% to add some padding

    const panX = (containerWidth - contentWidth * scale) / 2
    const panY = (containerHeight - contentHeight * scale) / 2

    set({
      view: {
        zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale)),
        panX,
        panY
      }
    })
  },

  setPan: (panX, panY) =>
    set((state) => ({
      view: { ...state.view, panX, panY }
    })),

  setTool: (activeTool) => set({ activeTool, selection: null }),

  setSelection: (selection) => set({ selection }),

  selectToken: (tokenId) =>
    set({
      selection: {
        type: 'token',
        tokenIds: [tokenId]
      }
    }),

  addToSelection: (tokenId) =>
    set((state) => {
      const currentIds = state.selection?.tokenIds ?? []
      if (currentIds.includes(tokenId)) {
        return state
      }
      return {
        selection: {
          type: 'token',
          tokenIds: [...currentIds, tokenId]
        }
      }
    }),

  clearSelection: () => set({ selection: null }),

  setHoveredToken: (hoveredTokenId) => set({ hoveredTokenId }),

  setDragging: (isDragging) => set({ isDragging }),
  setPanning: (isPanning) => set({ isPanning }),

  setLastClickedCell: (gridX, gridY) => set({ lastClickedCell: { gridX, gridY } }),

  startMovementMeasure: (tokenId, gridX, gridY) =>
    set({
      movementMeasure: {
        tokenId,
        startGridX: gridX,
        startGridY: gridY,
        currentGridX: gridX,
        currentGridY: gridY
      }
    }),

  updateMovementMeasure: (gridX, gridY) =>
    set((state) => {
      if (!state.movementMeasure) return state
      return {
        movementMeasure: {
          ...state.movementMeasure,
          currentGridX: gridX,
          currentGridY: gridY
        }
      }
    }),

  clearMovementMeasure: () => set({ movementMeasure: null }),

  centerOnToken: (gridX, gridY, gridSize, tokenSize) =>
    set((state) => {
      // Get the token's size in grid units
      const sizeInfo = CREATURE_SIZES.find((s) => s.value === tokenSize)
      const tokenGridUnits = sizeInfo?.cells ?? 1

      // Calculate token center in canvas coordinates
      const tokenCenterX = (gridX + tokenGridUnits / 2) * gridSize
      const tokenCenterY = (gridY + tokenGridUnits / 2) * gridSize

      // Calculate pan to center the token in the viewport
      const { width, height } = state.viewportSize
      const { zoom } = state.view

      const panX = width / 2 - tokenCenterX * zoom
      const panY = height / 2 - tokenCenterY * zoom

      return {
        view: {
          ...state.view,
          panX,
          panY
        }
      }
    })
}))
