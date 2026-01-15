import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      expect(screen.getByText('Confirm Action')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('renders default button labels', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    it('renders custom button labels', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="Delete Forever"
          cancelLabel="Keep It"
        />
      )

      expect(screen.getByRole('button', { name: 'Delete Forever' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep It' })).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('renders default variant', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-primary')
    })

    it('renders danger variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-destructive')
    })

    it('renders warning variant', () => {
      render(<ConfirmDialog {...defaultProps} variant="warning" />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      expect(confirmButton).toHaveClass('bg-warning')
    })
  })

  describe('accessibility', () => {
    it('uses alertdialog role', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('has aria-describedby pointing to message', () => {
      render(<ConfirmDialog {...defaultProps} />)

      const dialog = screen.getByRole('alertdialog')
      const describedById = dialog.getAttribute('aria-describedby')

      // The message should be linked via aria-describedby
      expect(describedById).toBeTruthy()
      const messageElement = document.getElementById(describedById!)
      expect(messageElement?.textContent).toBe('Are you sure you want to proceed?')
    })

    it('focuses confirm button when opened', async () => {
      render(<ConfirmDialog {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Confirm' })).toHaveFocus()
      })
    })
  })

  describe('user interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const onConfirm = vi.fn()
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn()
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when Escape is pressed', async () => {
      const onCancel = vi.fn()
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

      await userEvent.keyboard('{Escape}')

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when clicking backdrop', async () => {
      const onCancel = vi.fn()
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

      // Find and click backdrop
      const backdrop = document.querySelector('.bg-black\\/60')
      await userEvent.click(backdrop!)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when clicking close button', async () => {
      const onCancel = vi.fn()
      render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)

      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      await userEvent.click(closeButton)

      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('keyboard navigation', () => {
    it('allows tabbing between buttons', async () => {
      render(<ConfirmDialog {...defaultProps} />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      screen.getByRole('button', { name: 'Cancel' }) // Verify cancel exists

      // Confirm should start with focus
      await waitFor(() => {
        expect(confirmButton).toHaveFocus()
      })

      // Tab to cancel (might go through close button first)
      await userEvent.tab()
      await userEvent.tab()

      // Cancel should be reachable
      expect(document.activeElement?.textContent).toMatch(/Cancel|Close/)
    })

    it('allows pressing Enter on confirm button', async () => {
      const onConfirm = vi.fn()
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

      const confirmButton = screen.getByRole('button', { name: 'Confirm' })
      confirmButton.focus()

      await userEvent.keyboard('{Enter}')

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })
  })
})

describe('ConfirmDialog - common use cases', () => {
  it('delete confirmation', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Delete Token"
        message="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('Delete Token')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone. Are you sure?')).toBeInTheDocument()

    const deleteButton = screen.getByRole('button', { name: 'Delete' })
    expect(deleteButton).toHaveClass('bg-destructive')

    await userEvent.click(deleteButton)
    expect(onConfirm).toHaveBeenCalled()
  })

  it('reset fog confirmation', async () => {
    const onConfirm = vi.fn()

    render(
      <ConfirmDialog
        isOpen={true}
        title="Reset Fog of War"
        message="This will hide all revealed areas. Continue?"
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    )

    expect(screen.getByText('Reset Fog of War')).toBeInTheDocument()

    const resetButton = screen.getByRole('button', { name: 'Reset' })
    expect(resetButton).toHaveClass('bg-warning')
  })
})
