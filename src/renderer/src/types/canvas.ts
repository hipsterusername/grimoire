export type CanvasTool =
  | 'select'
  | 'pan'
  | 'fog-reveal'
  | 'fog-hide'
  | 'measure'
  | 'add-token'
  | 'presentation-bounds'

export interface CanvasViewState {
  zoom: number
  panX: number
  panY: number
}

export interface CanvasSelection {
  type: 'token' | 'area'
  tokenIds?: string[]
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface BrushSettings {
  size: number
  shape: 'circle' | 'square'
}
