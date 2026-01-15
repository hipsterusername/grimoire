import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  shortcut?: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({
  content,
  shortcut,
  children,
  position = 'bottom',
  delay = 400
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const isHoveredRef = useRef(false)

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const hideTooltip = useCallback(() => {
    clearPendingTimeout()
    isHoveredRef.current = false
    setIsVisible(false)
  }, [clearPendingTimeout])

  const showTooltip = useCallback(() => {
    isHoveredRef.current = true
    clearPendingTimeout()
    timeoutRef.current = setTimeout(() => {
      // Only show if still hovered
      if (isHoveredRef.current) {
        setIsVisible(true)
      }
    }, delay)
  }, [delay, clearPendingTimeout])

  // Hide tooltip on scroll, resize, or any pointer down outside
  useEffect(() => {
    if (!isVisible) return

    const handleHide = () => hideTooltip()

    // Hide on scroll (any scrollable ancestor)
    window.addEventListener('scroll', handleHide, true)
    window.addEventListener('resize', handleHide)
    // Hide on any click/touch elsewhere
    window.addEventListener('pointerdown', handleHide)

    return () => {
      window.removeEventListener('scroll', handleHide, true)
      window.removeEventListener('resize', handleHide)
      window.removeEventListener('pointerdown', handleHide)
    }
  }, [isVisible, hideTooltip])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingTimeout()
    }
  }, [clearPendingTimeout])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onPointerEnter={showTooltip}
      onPointerLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2 py-1.5 text-xs font-medium bg-foreground text-background rounded shadow-lg pointer-events-none whitespace-nowrap ${positionClasses[position]}`}
        >
          <div className="flex items-center gap-2">
            <span>{content}</span>
            {shortcut && (
              <kbd className="shrink-0 px-1.5 py-0.5 bg-black/20 rounded text-[10px] font-mono">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
