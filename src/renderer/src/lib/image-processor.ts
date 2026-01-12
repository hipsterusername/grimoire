export interface ProcessedImageResult {
  dataUrl: string
  width: number
  height: number
}

export interface ImageValidationResult {
  valid: boolean
  error?: string
  width?: number
  height?: number
  fileSize?: number
}

// Image limits
export const IMAGE_LIMITS = {
  maxFileSizeMB: 20,
  maxDimension: 8192, // 8K max dimension
  minDimension: 16,
  maxTotalPixels: 8192 * 8192, // ~67 megapixels max
  tokenMaxFileSizeMB: 5,
  tokenMaxDimension: 4096
} as const

const OUTPUT_SIZE = 256 // Standard token size for consistency

/**
 * Validate image dimensions and file size
 */
export function validateImageDataUrl(
  dataUrl: string,
  options: {
    maxFileSizeMB?: number
  } = {}
): ImageValidationResult {
  const maxFileSizeMB = options.maxFileSizeMB ?? IMAGE_LIMITS.maxFileSizeMB

  // Check file size from data URL
  const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
  if (!base64Match) {
    return { valid: false, error: 'Invalid image format' }
  }

  const base64 = base64Match[1]
  const fileSizeBytes = (base64.length * 3) / 4 // Approximate decoded size
  const fileSizeMB = fileSizeBytes / (1024 * 1024)

  if (fileSizeMB > maxFileSizeMB) {
    return {
      valid: false,
      error: `Image is too large (${fileSizeMB.toFixed(1)}MB). Maximum is ${maxFileSizeMB}MB.`,
      fileSize: fileSizeBytes
    }
  }

  return { valid: true, fileSize: fileSizeBytes }
}

/**
 * Validate image dimensions asynchronously (requires loading the image)
 */
export async function validateImageDimensions(
  dataUrl: string,
  options: {
    maxDimension?: number
    minDimension?: number
  } = {}
): Promise<ImageValidationResult> {
  const maxDimension = options.maxDimension ?? IMAGE_LIMITS.maxDimension
  const minDimension = options.minDimension ?? IMAGE_LIMITS.minDimension

  try {
    const { width, height } = await getImageDimensions(dataUrl)

    if (width < minDimension || height < minDimension) {
      return {
        valid: false,
        error: `Image is too small (${width}x${height}). Minimum dimension is ${minDimension}px.`,
        width,
        height
      }
    }

    if (width > maxDimension || height > maxDimension) {
      return {
        valid: false,
        error: `Image is too large (${width}x${height}). Maximum dimension is ${maxDimension}px.`,
        width,
        height
      }
    }

    if (width * height > IMAGE_LIMITS.maxTotalPixels) {
      return {
        valid: false,
        error: `Image has too many pixels (${(width * height / 1000000).toFixed(1)} megapixels). Maximum is ${(IMAGE_LIMITS.maxTotalPixels / 1000000).toFixed(0)} megapixels.`,
        width,
        height
      }
    }

    return { valid: true, width, height }
  } catch {
    return { valid: false, error: 'Failed to load image for validation' }
  }
}

/**
 * Process a token image: crop to circle (border rendered dynamically at display time)
 */
export async function processTokenImage(imageDataUrl: string): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        const size = OUTPUT_SIZE
        canvas.width = size
        canvas.height = size

        // Calculate center crop (square from center of image)
        const sourceSize = Math.min(img.width, img.height)
        const sourceX = (img.width - sourceSize) / 2
        const sourceY = (img.height - sourceSize) / 2

        const centerX = size / 2
        const centerY = size / 2
        const radius = size / 2

        // Draw the image with circular clip (full size, border added at render time)
        ctx.save()
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize, // Source crop
          0,
          0, // Dest position (full canvas)
          size,
          size // Dest size (full canvas)
        )
        ctx.restore()

        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: size,
          height: size
        })
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

/**
 * Generate SHA-256 hash for deduplication
 */
export async function hashImageData(dataUrl: string): Promise<string> {
  const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
  if (!base64Match) {
    throw new Error('Invalid data URL format')
  }

  const base64 = base64Match[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Load an image from a file path or data URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/**
 * Get image dimensions from a data URL
 */
export async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  const img = await loadImage(dataUrl)
  return { width: img.width, height: img.height }
}
