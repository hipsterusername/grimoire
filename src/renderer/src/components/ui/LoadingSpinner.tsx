interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3'
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  label = 'Loading...'
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status">
      <div
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-40">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
