import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders with different sizes', () => {
      const { rerender } = render(<Modal {...defaultProps} size="sm" />)
      expect(screen.getByRole('dialog')).toHaveClass('max-w-sm')

      rerender(<Modal {...defaultProps} size="lg" />)
      expect(screen.getByRole('dialog')).toHaveClass('max-w-lg')

      rerender(<Modal {...defaultProps} size="xl" />)
      expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl')
    })

    it('renders with custom role', () => {
      render(<Modal {...defaultProps} role="alertdialog" />)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Modal {...defaultProps} ariaDescribedBy="test-desc" />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby', 'test-desc')
    })

    it('has accessible close button', () => {
      render(<Modal {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('focuses first input when opened', async () => {
      render(
        <Modal {...defaultProps}>
          <input type="text" data-testid="first-input" />
          <button>Submit</button>
        </Modal>
      )

      await waitFor(() => {
        expect(screen.getByTestId('first-input')).toHaveFocus()
      })
    })

    it('focuses first focusable element when no input', async () => {
      render(
        <Modal {...defaultProps}>
          <button data-testid="first-button">First</button>
          <button>Second</button>
        </Modal>
      )

      await waitFor(() => {
        // First focusable might be close button, then first button in content
        const focused = document.activeElement
        expect(focused?.tagName).toBe('BUTTON')
      })
    })
  })

  describe('keyboard interactions', () => {
    it('closes on Escape key', async () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      await userEvent.keyboard('{Escape}')

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('traps focus within modal', async () => {
      render(
        <Modal {...defaultProps}>
          <button data-testid="btn1">First</button>
          <button data-testid="btn2">Second</button>
        </Modal>
      )

      // Get elements
      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      const btn2 = screen.getByTestId('btn2')

      // Wait for initial focus to settle
      await waitFor(() => {
        expect(document.activeElement?.tagName).toBe('BUTTON')
      })

      // Focus last element and tab forward
      btn2.focus()
      expect(btn2).toHaveFocus()

      await userEvent.tab()

      // Should wrap to first focusable element (close button)
      // The focus trap wraps from last to first
      await waitFor(() => {
        expect(closeButton).toHaveFocus()
      }, { timeout: 2000 })
    })

    it('traps focus in reverse with shift+tab', async () => {
      render(
        <Modal {...defaultProps}>
          <button data-testid="btn1">First</button>
          <button data-testid="btn2">Second</button>
        </Modal>
      )

      // Get elements
      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      const btn1 = screen.getByTestId('btn1')
      const btn2 = screen.getByTestId('btn2')

      // Wait for initial focus to settle
      await waitFor(() => {
        expect(document.activeElement?.tagName).toBe('BUTTON')
      })

      // Focus first content button (btn1) and shift+tab
      // This should wrap to close button or last element
      btn1.focus()
      expect(btn1).toHaveFocus()

      await userEvent.tab({ shift: true })

      // Should go to close button (previous in tab order)
      await waitFor(() => {
        expect(closeButton).toHaveFocus()
      }, { timeout: 2000 })

      // One more shift+tab should wrap to btn2 (last element)
      await userEvent.tab({ shift: true })

      await waitFor(() => {
        expect(btn2).toHaveFocus()
      }, { timeout: 2000 })
    })
  })

  describe('backdrop interaction', () => {
    it('closes when clicking backdrop', async () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      // Find and click backdrop (the element with bg-black/60)
      const backdrop = document.querySelector('.bg-black\\/60')
      expect(backdrop).toBeInTheDocument()

      fireEvent.click(backdrop!)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when clicking dialog content', async () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      const dialog = screen.getByRole('dialog')
      fireEvent.click(dialog)

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('close button', () => {
    it('closes when clicking close button', async () => {
      const onClose = vi.fn()
      render(<Modal {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close dialog/i })
      await userEvent.click(closeButton)

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('body scroll prevention', () => {
    it('prevents body scroll when open', () => {
      render(<Modal {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body scroll when closed', () => {
      const { rerender } = render(<Modal {...defaultProps} />)
      expect(document.body.style.overflow).toBe('hidden')

      rerender(<Modal {...defaultProps} isOpen={false} />)
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('focus restoration', () => {
    it('returns focus to previously focused element on close', async () => {
      const triggerButton = document.createElement('button')
      triggerButton.setAttribute('data-testid', 'trigger')
      document.body.appendChild(triggerButton)
      triggerButton.focus()

      const { rerender } = render(<Modal {...defaultProps} />)

      // Close the modal
      rerender(<Modal {...defaultProps} isOpen={false} />)

      await waitFor(() => {
        expect(triggerButton).toHaveFocus()
      })

      document.body.removeChild(triggerButton)
    })
  })
})
