import { useRef } from 'react'
import { Group, Circle, Text, Image } from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type { Token as TokenType } from '../../../types'
import { SIZE_TO_GRID_UNITS, CreatureSize } from '../../../types'
import { TokenHealthBar } from './TokenHealthBar'
import { useEncounterStore, useCanvasStore, useUIStore, useLibraryStore } from '../../../stores'

interface TokenProps {
  token: TokenType
  gridSize: number
  isSelected: boolean
  onSelect: (id: string) => void
}

export function Token({ token, gridSize, isSelected, onSelect }: TokenProps) {
  const groupRef = useRef<Konva.Group>(null)

  const moveToken = useEncounterStore((s) => s.moveToken)
  const tokens = useEncounterStore((s) => s.encounter?.tokens ?? [])
  const activeTool = useCanvasStore((s) => s.activeTool)
  const isPanning = useCanvasStore((s) => s.isPanning)
  const setDragging = useCanvasStore((s) => s.setDragging)
  const setEditingToken = useUIStore((s) => s.setEditingToken)
  const openModal = useUIStore((s) => s.openModal)
  const library = useLibraryStore((s) => s.library)

  // Check if a cell is occupied by another token (not this one)
  const isCellOccupied = (gridX: number, gridY: number) => {
    return tokens.some((t) => t.id !== token.id && t.gridX === gridX && t.gridY === gridY)
  }

  // Find the nearest empty cell using spiral search
  const findEmptyCell = (startX: number, startY: number): { gridX: number; gridY: number } => {
    if (!isCellOccupied(startX, startY)) {
      return { gridX: startX, gridY: startY }
    }

    const directions = [
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: -1 }
    ]

    let x = startX
    let y = startY
    let steps = 1
    let dirIndex = 0
    let stepsInDir = 0
    let turnCount = 0

    for (let i = 0; i < 100; i++) {
      x += directions[dirIndex].dx
      y += directions[dirIndex].dy
      stepsInDir++

      if (x >= 0 && y >= 0 && !isCellOccupied(x, y)) {
        return { gridX: x, gridY: y }
      }

      if (stepsInDir >= steps) {
        stepsInDir = 0
        dirIndex = (dirIndex + 1) % 4
        turnCount++
        if (turnCount % 2 === 0) {
          steps++
        }
      }
    }

    return { gridX: startX + 1, gridY: startY }
  }

  // Get image URL from asset library if assetId is present, otherwise use legacy imageUrl
  const getImageUrl = () => {
    if (token.assetId) {
      const asset = library.assets.find((a) => a.id === token.assetId)
      return asset?.processedDataUrl
    }
    return token.imageUrl
  }

  const imageUrl = getImageUrl()
  const [image] = useImage(imageUrl ?? '', 'anonymous')

  // Check if this token has an image (from asset library or legacy)
  const hasImage = !!imageUrl && !!image

  // Border width for token ring
  const borderWidth = 4

  // Calculate token size in pixels
  const gridUnits = SIZE_TO_GRID_UNITS[token.size]
  const tokenSize = gridUnits * gridSize

  // Position in pixels
  const x = token.gridX * gridSize
  const y = token.gridY * gridSize

  // Center offset for non-1x1 tokens
  const offset = token.size === CreatureSize.Tiny ? gridSize * 0.25 : 0

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true
    setDragging(true)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true
    setDragging(false)
    const node = e.target

    // Snap to grid
    const targetGridX = Math.round(node.x() / gridSize)
    const targetGridY = Math.round(node.y() / gridSize)

    // Find empty cell (handles collision with other tokens)
    const { gridX: newGridX, gridY: newGridY } = findEmptyCell(targetGridX, targetGridY)

    // Update position in store
    moveToken(token.id, newGridX, newGridY)

    // Snap the visual position
    node.position({
      x: newGridX * gridSize,
      y: newGridY * gridSize
    })
  }

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    onSelect(token.id)
  }

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    e.cancelBubble = true
    setEditingToken(token.id)
    openModal('token-editor', { tokenId: token.id })
  }

  // Token is draggable only when select tool is active and not in panning mode
  const isDraggable = activeTool === 'select' && !isPanning
  const radius = tokenSize / 2
  const healthBarWidth = Math.max(tokenSize, 40)

  // HP percentage for coloring
  const hpPercent = token.stats.maxHp > 0
    ? token.stats.currentHp / token.stats.maxHp
    : 1

  // Border color based on HP
  const healthBorderColor = hpPercent > 0.5
    ? token.borderColor ?? '#4ade80'
    : hpPercent > 0.25
      ? '#facc15'
      : '#ef4444'

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
      opacity={token.visible ? 1 : 0.5}
    >
      {/* Token base */}
      {hasImage ? (
        // Token with image - render with dynamic colored border
        <Group>
          {/* Outer border ring (token color) */}
          <Circle
            x={radius + offset}
            y={radius + offset}
            radius={radius - borderWidth / 2}
            stroke={token.color}
            strokeWidth={borderWidth}
          />
          {/* Inner highlight for metallic effect */}
          <Circle
            x={radius + offset}
            y={radius + offset}
            radius={radius - borderWidth + 0.5}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth={1}
          />
          {/* Outer shadow for depth */}
          <Circle
            x={radius + offset}
            y={radius + offset}
            radius={radius - 0.5}
            stroke="rgba(0, 0, 0, 0.4)"
            strokeWidth={1}
          />
          {/* Clipped image inside the border */}
          <Group
            clipFunc={(ctx) => {
              ctx.arc(radius + offset, radius + offset, radius - borderWidth, 0, Math.PI * 2)
            }}
          >
            <Image
              image={image}
              x={offset + borderWidth}
              y={offset + borderWidth}
              width={tokenSize - borderWidth * 2}
              height={tokenSize - borderWidth * 2}
            />
          </Group>
        </Group>
      ) : (
        // No image - colored circle with letter
        <Circle
          x={radius + offset}
          y={radius + offset}
          radius={radius}
          fill={token.color}
          stroke={isSelected ? '#FFD700' : healthBorderColor}
          strokeWidth={isSelected ? 3 : 2}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <Circle
          x={radius + offset}
          y={radius + offset}
          radius={radius + 4}
          stroke="#FFD700"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* Token initial/letter (only when no image) */}
      {!imageUrl && (
        <Text
          x={offset}
          y={offset}
          width={tokenSize}
          height={tokenSize}
          text={token.name.charAt(0).toUpperCase()}
          fontSize={tokenSize * 0.5}
          fill="#FFFFFF"
          align="center"
          verticalAlign="middle"
          fontStyle="bold"
        />
      )}

      {/* Health bar */}
      <TokenHealthBar
        currentHp={token.stats.currentHp}
        maxHp={token.stats.maxHp}
        tempHp={token.stats.tempHp}
        width={healthBarWidth}
        x={(tokenSize - healthBarWidth) / 2 + offset}
        y={tokenSize + 4 + offset}
      />

      {/* Name label */}
      <Text
        text={token.name}
        fontSize={11}
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth={0.5}
        x={offset}
        y={tokenSize + 18 + offset}
        width={tokenSize}
        align="center"
      />

      {/* Condition indicators */}
      {token.conditions.length > 0 && (
        <Group x={tokenSize - 8 + offset} y={-4 + offset}>
          {token.conditions.slice(0, 3).map((condition, i) => (
            <Circle
              key={condition.id}
              x={0}
              y={i * 12}
              radius={5}
              fill={condition.color ?? '#ef4444'}
              stroke="#000"
              strokeWidth={1}
            />
          ))}
        </Group>
      )}
    </Group>
  )
}
