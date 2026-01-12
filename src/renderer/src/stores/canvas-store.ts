import { create } from 'zustand'
import type { CanvasTool, CanvasViewState, CanvasSelection, BrushSettings } from '../types'

interface CanvasState {
  // View
  view: CanvasViewState
  viewportSize: { width: number; height: number }

  // Tool
  activeTool: CanvasTool
  brushSettings: BrushSettings

  // Selection
  selection: CanvasSelection | null
  hoveredTokenId: string | null

  // Last clicked cell for token placement
  lastClickedCell: { gridX: number; gridY: number } | null

  // Interaction state
  isDragging: boolean
  isPanning: boolean

  // Actions
  setViewportSize: (width: number, height: number) => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  zoomToFit: (containerWidth: number, containerHeight: number, contentWidth: number, contentHeight: number) => void

  setPan: (x: number, y: number) => void

  setTool: (tool: CanvasTool) => void
  setBrushSize: (size: number) => void
  setBrushShape: (shape: 'circle' | 'square') => void

  setSelection: (selection: CanvasSelection | null) => void
  selectToken: (tokenId: string) => void
  addToSelection: (tokenId: string) => void
  clearSelection: () => void

  setHoveredToken: (tokenId: string | null) => void

  setDragging: (dragging: boolean) => void
  setPanning: (panning: boolean) => void

  setLastClickedCell: (gridX: number, gridY: number) => void
}

const ZOOM_MIN = 0.1
const ZOOM_MAX = 3.0
const ZOOM_STEP = 0.15

export const useCanvasStore = create<CanvasState>((set) => ({
  view: { zoom: 1, panX: 0, panY: 0 },
  viewportSize: { width: 800, height: 600 },
  activeTool: 'select',
  brushSettings: { size: 50, shape: 'circle' },
  selection: null,
  hoveredTokenId: null,
  lastClickedCell: null,
  isDragging: false,
  isPanning: false,

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

  setBrushSize: (size) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, size: Math.max(10, Math.min(200, size)) }
    })),

  setBrushShape: (shape) =>
    set((state) => ({
      brushSettings: { ...state.brushSettings, shape }
    })),

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

  setLastClickedCell: (gridX, gridY) => set({ lastClickedCell: { gridX, gridY } })
}))
