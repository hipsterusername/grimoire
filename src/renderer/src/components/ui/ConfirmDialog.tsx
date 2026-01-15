import { useRef, useEffect, useId } from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const messageId = useId()

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        confirmButtonRef.current?.focus()
      })
    }
  }, [isOpen])

  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-destructive text-destructive-foreground hover:opacity-90'
      : variant === 'warning'
        ? 'bg-warning text-black hover:opacity-90'
        : 'bg-primary text-primary-foreground hover:opacity-90'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      role="alertdialog"
      ariaDescribedBy={messageId}
    >
      <p id={messageId} className="text-muted-foreground mb-6">{message}</p>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="min-h-[44px] px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          className={`min-h-[44px] px-4 py-2 text-sm rounded-lg transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary ${confirmButtonClass}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
