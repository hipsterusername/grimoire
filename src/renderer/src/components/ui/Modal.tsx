import { useEffect, useRef, useCallback, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** ID of the element that describes the modal content */
  ariaDescribedBy?: string
  /** Override the dialog role (e.g., 'alertdialog' for confirmations) */
  role?: 'dialog' | 'alertdialog'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl'
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  ariaDescribedBy,
  role = 'dialog'
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`)

  // Store the previously focused element and manage focus
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement

      // Find the first focusable element in the dialog
      requestAnimationFrame(() => {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements && focusableElements.length > 0) {
          // Focus the first input if there is one, otherwise the first focusable element
          const firstInput = dialogRef.current?.querySelector('input, select, textarea') as HTMLElement
          if (firstInput) {
            firstInput.focus()
          } else {
            (focusableElements[0] as HTMLElement).focus()
          }
        }
      })
    } else {
      // Return focus to the previously focused element
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusableElements || focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    },
    [isOpen, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={ariaDescribedBy}
        className={`relative bg-secondary rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2
            id={titleId.current}
            className="text-xl font-semibold"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
