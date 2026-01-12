import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Icon } from '../ui/Icon'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary specifically for canvas rendering errors.
 * Provides a lighter-weight fallback that doesn't require a full page reload.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Canvas rendering error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="w-full h-full flex items-center justify-center bg-muted/50"
          role="alert"
          aria-live="polite"
        >
          <div className="text-center p-8 max-w-md">
            <Icon name="warning" size={48} className="mx-auto mb-4 text-warning" />
            <h2 className="text-lg font-semibold mb-2">Canvas Error</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Something went wrong while rendering the map. Your data is safe.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Technical details
                </summary>
                <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto max-h-24">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="min-h-[40px] px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
