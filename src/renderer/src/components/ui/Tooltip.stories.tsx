import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right']
    },
    delay: {
      control: 'number'
    }
  }
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof Tooltip>

// Icon button for demos
function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-10 h-10 flex items-center justify-center bg-secondary rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
      {children}
    </button>
  )
}

// Simple arrow icon
function SelectIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
    </svg>
  )
}

function PanIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export const Default: Story = {
  args: {
    content: 'Select Tool',
    children: (
      <IconButton>
        <SelectIcon />
      </IconButton>
    )
  }
}

export const WithShortcut: Story = {
  args: {
    content: 'Select',
    shortcut: 'V',
    children: (
      <IconButton>
        <SelectIcon />
      </IconButton>
    )
  }
}

export const PositionTop: Story = {
  args: {
    content: 'Pan Canvas',
    shortcut: 'H',
    position: 'top',
    children: (
      <IconButton>
        <PanIcon />
      </IconButton>
    )
  }
}

export const PositionLeft: Story = {
  args: {
    content: 'Reveal Fog',
    shortcut: 'R',
    position: 'left',
    children: (
      <IconButton>
        <EyeIcon />
      </IconButton>
    )
  }
}

export const PositionRight: Story = {
  args: {
    content: 'Hide Fog',
    shortcut: 'F',
    position: 'right',
    children: (
      <IconButton>
        <EyeIcon />
      </IconButton>
    )
  }
}

export const NoDelay: Story = {
  args: {
    content: 'Instant tooltip',
    delay: 0,
    children: (
      <IconButton>
        <SelectIcon />
      </IconButton>
    )
  }
}

// Toolbar demo showing multiple tooltips
function ToolbarDemo() {
  return (
    <div className="flex gap-1 p-2 bg-secondary rounded-lg">
      <Tooltip content="Select" shortcut="V">
        <IconButton>
          <SelectIcon />
        </IconButton>
      </Tooltip>

      <Tooltip content="Pan" shortcut="H">
        <IconButton>
          <PanIcon />
        </IconButton>
      </Tooltip>

      <div className="w-px bg-border mx-1" />

      <Tooltip content="Reveal Fog" shortcut="R">
        <IconButton>
          <EyeIcon />
        </IconButton>
      </Tooltip>

      <Tooltip content="Hide Fog" shortcut="F">
        <IconButton>
          <EyeIcon />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export const Toolbar: Story = {
  render: () => <ToolbarDemo />
}

// Text tooltip demo
export const OnTextLink: Story = {
  render: () => (
    <p className="text-muted-foreground">
      Hover over the{' '}
      <Tooltip content="This reveals more information" position="top">
        <span className="text-primary underline cursor-help">highlighted text</span>
      </Tooltip>{' '}
      to see the tooltip.
    </p>
  )
}
