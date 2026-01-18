import type { TokenCondition } from '../../types'
import { Icon } from './Icon'
import { Tooltip } from './Tooltip'

interface ConditionBadgeProps {
  condition: TokenCondition
  onRemove?: () => void
  showDuration?: boolean
  size?: 'sm' | 'md'
}

export function ConditionBadge({
  condition,
  onRemove,
  showDuration = true,
  size = 'md'
}: ConditionBadgeProps) {
  const isSmall = size === 'sm'
  const hasDuration = condition.duration !== undefined

  const tooltipContent = hasDuration
    ? `${condition.name} (${condition.duration} turn${condition.duration !== 1 ? 's' : ''} remaining)`
    : condition.name

  return (
    <Tooltip content={tooltipContent}>
      <div
        className={`inline-flex items-center gap-1 rounded-full border transition-colors ${
          isSmall ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
        }`}
        style={{
          backgroundColor: `${condition.color}20`,
          borderColor: `${condition.color}60`,
          color: condition.color
        }}
      >
        {/* Icon */}
        {condition.icon && (
          <Icon name={condition.icon} size={isSmall ? 10 : 12} />
        )}

        {/* Name */}
        <span className="font-medium truncate max-w-[80px]">
          {condition.name}
        </span>

        {/* Duration counter */}
        {showDuration && hasDuration && (
          <span
            className={`flex items-center justify-center font-bold rounded-full bg-black/20 ${
              isSmall ? 'w-3.5 h-3.5 text-[9px]' : 'w-4 h-4 text-[10px]'
            }`}
          >
            {condition.duration}
          </span>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className={`flex items-center justify-center rounded-full hover:bg-black/20 transition-colors ${
              isSmall ? 'w-3 h-3 -mr-0.5' : 'w-4 h-4 -mr-1'
            }`}
            aria-label={`Remove ${condition.name} condition`}
          >
            <Icon name="x" size={isSmall ? 8 : 10} />
          </button>
        )}
      </div>
    </Tooltip>
  )
}
