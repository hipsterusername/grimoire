import { useState, useRef, useEffect, type ReactNode } from 'react'

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

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

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
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2 py-1.5 text-xs font-medium bg-foreground text-background rounded shadow-lg whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="ml-2 px-1.5 py-0.5 bg-black/20 rounded text-[10px] font-mono">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  )
}
