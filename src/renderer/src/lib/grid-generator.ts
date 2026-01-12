export interface GridGeneratorOptions {
  width: number
  height: number
  cellSize: number
  theme: 'dungeon' | 'forest' | 'cave' | 'plain'
}

export interface GeneratedGrid {
  imageDataUrl: string
  width: number
  height: number
}

const THEMES = {
  dungeon: {
    floor: ['#4a4a4a', '#3d3d3d', '#525252', '#454545'],
    accent: '#2a2a2a',
    grid: 'rgba(255, 255, 255, 0.15)'
  },
  forest: {
    floor: ['#4a6741', '#3d5635', '#5a7751', '#456841'],
    accent: '#2d3d28',
    grid: 'rgba(0, 0, 0, 0.2)'
  },
  cave: {
    floor: ['#5c5045', '#4a4038', '#6a6055', '#544840'],
    accent: '#3a3028',
    grid: 'rgba(255, 255, 255, 0.1)'
  },
  plain: {
    floor: ['#f5f5f5', '#e8e8e8', '#ffffff', '#eeeeee'],
    accent: '#cccccc',
    grid: 'rgba(0, 0, 0, 0.3)'
  }
}

export function generateGrid(options: GridGeneratorOptions): GeneratedGrid {
  const { width, height, cellSize, theme } = options
  const pixelWidth = width * cellSize
  const pixelHeight = height * cellSize

  const canvas = document.createElement('canvas')
  canvas.width = pixelWidth
  canvas.height = pixelHeight
  const ctx = canvas.getContext('2d')!

  const colors = THEMES[theme]

  // Fill background with random floor tiles
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const color = colors.floor[Math.floor(Math.random() * colors.floor.length)]
      ctx.fillStyle = color
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

      // Add subtle texture
      addNoiseToCell(ctx, x * cellSize, y * cellSize, cellSize, theme)
    }
  }

  // Draw grid lines
  ctx.strokeStyle = colors.grid
  ctx.lineWidth = 1

  // Vertical lines
  for (let x = 0; x <= width; x++) {
    ctx.beginPath()
    ctx.moveTo(x * cellSize + 0.5, 0)
    ctx.lineTo(x * cellSize + 0.5, pixelHeight)
    ctx.stroke()
  }

  // Horizontal lines
  for (let y = 0; y <= height; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * cellSize + 0.5)
    ctx.lineTo(pixelWidth, y * cellSize + 0.5)
    ctx.stroke()
  }

  return {
    imageDataUrl: canvas.toDataURL('image/png'),
    width: pixelWidth,
    height: pixelHeight
  }
}

function addNoiseToCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  theme: string
) {
  const dotCount = Math.floor(Math.random() * 8) + 3

  for (let i = 0; i < dotCount; i++) {
    const dx = x + Math.random() * size
    const dy = y + Math.random() * size
    const radius = Math.random() * 2 + 0.5

    if (theme === 'plain') {
      // Very subtle noise for plain theme
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.03})`
    } else {
      // More visible texture for other themes
      const brightness = Math.random() > 0.5 ? 0 : 255
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${Math.random() * 0.1})`
    }

    ctx.beginPath()
    ctx.arc(dx, dy, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Add occasional larger features for non-plain themes
  if (theme !== 'plain' && Math.random() > 0.85) {
    const fx = x + Math.random() * size
    const fy = y + Math.random() * size
    const fr = Math.random() * 4 + 2

    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.08})`
    ctx.beginPath()
    ctx.arc(fx, fy, fr, 0, Math.PI * 2)
    ctx.fill()
  }
}
