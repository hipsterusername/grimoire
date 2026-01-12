import { useRef, useEffect, useState, useCallback } from 'react'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { BattleMapCanvas } from '../canvas/BattleMapCanvas'
import { CanvasErrorBoundary } from '../canvas/CanvasErrorBoundary'
import { useCanvasStore } from '../../stores'
import { UI_TIMING } from '../../lib/constants'

// Debounce helper
function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}

export function AppLayout() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const setViewportSize = useCanvasStore((s) => s.setViewportSize)

  // Debounced resize handler
  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setCanvasSize({
        width: rect.width,
        height: rect.height
      })
      setViewportSize(rect.width, rect.height)
    }
  }, [setViewportSize])

  useEffect(() => {
    const debouncedUpdate = debounce(updateSize, UI_TIMING.debounceMs)

    // Initial size
    updateSize()

    window.addEventListener('resize', debouncedUpdate)
    return () => window.removeEventListener('resize', debouncedUpdate)
  }, [updateSize])

  return (
    <div className="flex flex-col h-full">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex-1 bg-canvas-bg overflow-hidden"
        >
          <CanvasErrorBoundary>
            <BattleMapCanvas
              width={canvasSize.width}
              height={canvasSize.height}
            />
          </CanvasErrorBoundary>
        </div>

        <Sidebar />
      </div>

      <StatusBar />
    </div>
  )
}
