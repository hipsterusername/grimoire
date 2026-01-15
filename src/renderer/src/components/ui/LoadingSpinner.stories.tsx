import type { Meta, StoryObj } from '@storybook/react-vite'
import { LoadingSpinner, LoadingOverlay, LoadingScreen } from './LoadingSpinner'

const meta = {
  title: 'UI/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
} satisfies Meta<typeof LoadingSpinner>

export default meta
type Story = StoryObj<typeof LoadingSpinner>

export const Default: Story = {
  args: {
    size: 'md'
  }
}

export const Small: Story = {
  args: {
    size: 'sm'
  }
}

export const Large: Story = {
  args: {
    size: 'lg'
  }
}

// All sizes comparison
export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="text-center">
        <LoadingSpinner size="sm" />
        <p className="mt-3 text-xs text-muted-foreground">Small</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-3 text-xs text-muted-foreground">Medium</p>
      </div>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-3 text-xs text-muted-foreground">Large</p>
      </div>
    </div>
  )
}

// Loading overlay story
export const Overlay: Story = {
  render: () => (
    <div className="relative w-96 h-64 bg-secondary rounded-lg overflow-hidden">
      {/* Background content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-2">Token List</h3>
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>

      {/* Overlay */}
      <LoadingOverlay message="Saving encounter..." />
    </div>
  )
}

// Loading in context examples
export const InButton: Story = {
  render: () => (
    <button
      disabled
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg opacity-70 flex items-center gap-2"
    >
      <LoadingSpinner size="sm" />
      <span>Saving...</span>
    </button>
  )
}

export const InCard: Story = {
  render: () => (
    <div className="w-64 p-4 bg-secondary rounded-lg">
      <h4 className="font-medium mb-4">Loading Encounter</h4>
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
      <p className="text-center text-sm text-muted-foreground">Please wait...</p>
    </div>
  )
}

// Loading screen (full page)
export const FullScreen: Story = {
  parameters: {
    layout: 'fullscreen'
  },
  render: () => <LoadingScreen message="Loading Grimoire..." />
}

// Loading states progression
export const StatesProgression: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 bg-secondary rounded-lg">
        <p className="text-sm font-medium mb-3">Inline Loading</p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <LoadingSpinner size="sm" />
          <span className="text-sm">Loading tokens...</span>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg">
        <p className="text-sm font-medium mb-3">Button Loading</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-muted rounded-lg" disabled>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2"
            disabled
          >
            <LoadingSpinner size="sm" />
            Saving...
          </button>
        </div>
      </div>

      <div className="p-4 bg-secondary rounded-lg">
        <p className="text-sm font-medium mb-3">Section Loading</p>
        <div className="h-32 flex items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      </div>
    </div>
  )
}
