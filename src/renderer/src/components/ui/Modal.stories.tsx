import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Modal } from './Modal'

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl']
    }
  }
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof Modal>

// Interactive wrapper for controlling modal state
function ModalDemo({
  size = 'md',
  title = 'Modal Title'
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  title?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        Open Modal
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size={size}>
        <p className="text-muted-foreground mb-4">
          This is the modal content. It can contain any React components, forms, or other
          interactive elements.
        </p>
        <p className="text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Escape</kbd> or click
          outside to close.
        </p>
      </Modal>
    </div>
  )
}

export const Default: Story = {
  render: () => <ModalDemo />
}

export const Small: Story = {
  render: () => <ModalDemo size="sm" title="Small Modal" />
}

export const Large: Story = {
  render: () => <ModalDemo size="lg" title="Large Modal" />
}

export const ExtraLarge: Story = {
  render: () => <ModalDemo size="xl" title="Extra Large Modal" />
}

// Modal with form content
function FormModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        Open Form Modal
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Token" size="md">
        <form className="space-y-4">
          <div>
            <label htmlFor="token-name" className="block text-sm font-medium mb-1">
              Token Name
            </label>
            <input
              id="token-name"
              type="text"
              placeholder="Enter token name"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="token-hp" className="block text-sm font-medium mb-1">
              Hit Points
            </label>
            <input
              id="token-hp"
              type="number"
              placeholder="20"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Token
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export const WithForm: Story = {
  render: () => <FormModal />
}

// Modal with scrollable content
function ScrollableModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        Open Scrollable Modal
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Long Content" size="md">
        <div className="space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <p key={i} className="text-muted-foreground">
              This is paragraph {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export const WithScrollableContent: Story = {
  render: () => <ScrollableModal />
}
