import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'

const meta = {
  title: 'UI/ConfirmDialog',
  component: ConfirmDialog,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'warning', 'danger']
    }
  }
} satisfies Meta<typeof ConfirmDialog>

export default meta
type Story = StoryObj<typeof ConfirmDialog>

// Interactive demo wrapper
function ConfirmDialogDemo({
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default' as const
}: {
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'warning' | 'danger'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleConfirm = () => {
    setResult('Confirmed!')
    setIsOpen(false)
    setTimeout(() => setResult(null), 2000)
  }

  const handleCancel = () => {
    setResult('Cancelled')
    setIsOpen(false)
    setTimeout(() => setResult(null), 2000)
  }

  return (
    <div className="text-center">
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        Open Confirmation
      </button>

      {result && (
        <p className="mt-4 text-sm text-muted-foreground">
          Result: <span className="text-foreground font-medium">{result}</span>
        </p>
      )}

      <ConfirmDialog
        isOpen={isOpen}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        variant={variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  )
}

export const Default: Story = {
  render: () => <ConfirmDialogDemo />
}

export const DeleteConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Delete Token"
      message="Are you sure you want to delete this token? This action cannot be undone."
      confirmLabel="Delete"
      variant="danger"
    />
  )
}

export const WarningConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Reset Fog of War"
      message="This will reset all fog of war. Revealed areas will need to be redrawn."
      confirmLabel="Reset Fog"
      variant="warning"
    />
  )
}

export const EndCombatConfirmation: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="End Combat"
      message="Are you sure you want to end combat? Initiative order will be preserved."
      confirmLabel="End Combat"
      cancelLabel="Continue Fighting"
    />
  )
}

export const UnsavedChanges: Story = {
  render: () => (
    <ConfirmDialogDemo
      title="Unsaved Changes"
      message="You have unsaved changes. Do you want to save before closing?"
      confirmLabel="Save & Close"
      cancelLabel="Discard"
      variant="warning"
    />
  )
}
