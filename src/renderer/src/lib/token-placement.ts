import type { Token } from '../types'
import type { PresentationBounds } from '../stores/presentation-store'

interface PlacementBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface PlacementContext {
  // Grid settings
  gridSize: number

  // Current tokens to check for collisions
  tokens: Token[]

  // Map bounds (in pixels)
  mapWidth: number
  mapHeight: number

  // Presentation state
  isPresenting: boolean
  presentationBounds: PresentationBounds | null

  // Optional: last clicked cell (preferred placement)
  lastClickedCell?: { gridX: number; gridY: number } | null

  // Optional: viewport for fallback placement
  viewport?: {
    width: number
    height: number
    panX: number
    panY: number
    zoom: number
  }
}

/**
 * Check if a grid cell is occupied by any token
 */
function isCellOccupied(gridX: number, gridY: number, tokens: Token[]): boolean {
  return tokens.some((t) => t.gridX === gridX && t.gridY === gridY)
}

/**
 * Check if a grid cell is within the specified bounds
 */
function isCellInBounds(gridX: number, gridY: number, bounds: PlacementBounds): boolean {
  return (
    gridX >= bounds.minX &&
    gridX <= bounds.maxX &&
    gridY >= bounds.minY &&
    gridY <= bounds.maxY
  )
}

/**
 * Find an empty cell using spiral search, constrained to bounds
 */
function findEmptyCellInBounds(
  startX: number,
  startY: number,
  tokens: Token[],
  bounds: PlacementBounds
): { gridX: number; gridY: number } {
  // Clamp starting position to bounds
  const clampedStartX = Math.max(bounds.minX, Math.min(bounds.maxX, startX))
  const clampedStartY = Math.max(bounds.minY, Math.min(bounds.maxY, startY))

  // If clamped starting cell is empty, use it
  if (!isCellOccupied(clampedStartX, clampedStartY, tokens)) {
    return { gridX: clampedStartX, gridY: clampedStartY }
  }

  // Spiral outward to find empty cell within bounds
  const directions = [
    { dx: 1, dy: 0 },  // right
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 0, dy: -1 }  // up
  ]

  let x = clampedStartX
  let y = clampedStartY
  let steps = 1
  let dirIndex = 0
  let stepsInDir = 0
  let turnCount = 0

  // Calculate max search area based on bounds size
  const boundsWidth = bounds.maxX - bounds.minX + 1
  const boundsHeight = bounds.maxY - bounds.minY + 1
  const maxSearchCells = boundsWidth * boundsHeight

  for (let i = 0; i < maxSearchCells; i++) {
    // Move in current direction
    x += directions[dirIndex].dx
    y += directions[dirIndex].dy
    stepsInDir++

    // Check if this cell is valid (in bounds and empty)
    if (isCellInBounds(x, y, bounds) && !isCellOccupied(x, y, tokens)) {
      return { gridX: x, gridY: y }
    }

    // Change direction when we've taken enough steps
    if (stepsInDir >= steps) {
      stepsInDir = 0
      dirIndex = (dirIndex + 1) % 4
      turnCount++
      if (turnCount % 2 === 0) {
        steps++
      }
    }
  }

  // Fallback: return clamped start even if occupied (better than invalid position)
  return { gridX: clampedStartX, gridY: clampedStartY }
}

/**
 * Calculate the center of bounds in grid coordinates
 */
function getBoundsCenter(
  bounds: PresentationBounds,
  gridSize: number
): { gridX: number; gridY: number } {
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  return {
    gridX: Math.floor(centerX / gridSize),
    gridY: Math.floor(centerY / gridSize)
  }
}

/**
 * Calculate viewport center in grid coordinates
 */
function getViewportCenter(
  viewport: { width: number; height: number; panX: number; panY: number; zoom: number },
  gridSize: number
): { gridX: number; gridY: number } {
  const canvasCenterX = (viewport.width / 2 - viewport.panX) / viewport.zoom
  const canvasCenterY = (viewport.height / 2 - viewport.panY) / viewport.zoom
  return {
    gridX: Math.max(0, Math.floor(canvasCenterX / gridSize)),
    gridY: Math.max(0, Math.floor(canvasCenterY / gridSize))
  }
}

/**
 * Convert presentation bounds to grid placement bounds
 */
function presentationBoundsToPlacementBounds(
  bounds: PresentationBounds,
  gridSize: number
): PlacementBounds {
  return {
    minX: Math.floor(bounds.x / gridSize),
    minY: Math.floor(bounds.y / gridSize),
    maxX: Math.floor((bounds.x + bounds.width) / gridSize) - 1,
    maxY: Math.floor((bounds.y + bounds.height) / gridSize) - 1
  }
}

/**
 * Convert map dimensions to grid placement bounds
 */
function mapToPlacementBounds(mapWidth: number, mapHeight: number, gridSize: number): PlacementBounds {
  return {
    minX: 0,
    minY: 0,
    maxX: Math.floor(mapWidth / gridSize) - 1,
    maxY: Math.floor(mapHeight / gridSize) - 1
  }
}

/**
 * Calculate the optimal placement position for a new token
 *
 * Priority:
 * 1. If presenting: place within presentation bounding box
 * 2. If not presenting: place within map bounds
 *
 * Starting position priority:
 * 1. Last clicked cell (if provided and within bounds)
 * 2. Center of active bounds (presentation or map)
 */
export function calculateTokenPlacement(ctx: PlacementContext): { gridX: number; gridY: number } {
  const { gridSize, tokens, mapWidth, mapHeight, isPresenting, presentationBounds, lastClickedCell, viewport } = ctx

  // Determine placement bounds
  let placementBounds: PlacementBounds
  let targetCell: { gridX: number; gridY: number }

  if (isPresenting && presentationBounds && presentationBounds.width > 0 && presentationBounds.height > 0) {
    // Presenting: constrain to presentation bounding box
    placementBounds = presentationBoundsToPlacementBounds(presentationBounds, gridSize)

    // Check if last clicked cell is within presentation bounds
    if (lastClickedCell && isCellInBounds(lastClickedCell.gridX, lastClickedCell.gridY, placementBounds)) {
      targetCell = lastClickedCell
    } else {
      // Use center of presentation bounds
      targetCell = getBoundsCenter(presentationBounds, gridSize)
    }
  } else {
    // Not presenting: constrain to map bounds
    placementBounds = mapToPlacementBounds(mapWidth, mapHeight, gridSize)

    // Use last clicked cell, or viewport center, or map center
    if (lastClickedCell && isCellInBounds(lastClickedCell.gridX, lastClickedCell.gridY, placementBounds)) {
      targetCell = lastClickedCell
    } else if (viewport) {
      targetCell = getViewportCenter(viewport, gridSize)
    } else {
      // Fallback to map center
      targetCell = {
        gridX: Math.floor(placementBounds.maxX / 2),
        gridY: Math.floor(placementBounds.maxY / 2)
      }
    }
  }

  // Find empty cell within bounds
  return findEmptyCellInBounds(targetCell.gridX, targetCell.gridY, tokens, placementBounds)
}
