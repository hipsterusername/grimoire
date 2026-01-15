import type { Preview } from '@storybook/react-vite'

// Import Tailwind styles
import '../src/renderer/src/styles/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      default: 'grimoire-dark',
      values: [
        { name: 'grimoire-dark', value: '#0f0d13' },
        { name: 'grimoire-canvas', value: '#0a080d' },
        { name: 'light', value: '#ffffff' }
      ]
    },
    a11y: {
      test: 'todo'
    }
  }
}

export default preview
