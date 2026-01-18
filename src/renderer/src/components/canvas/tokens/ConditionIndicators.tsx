import { Group, Circle, Path, Text } from 'react-konva'
import type { TokenCondition } from '../../../types'

/**
 * SVG path data for condition icons, extracted from the Icon component.
 * Paths are designed for a 24x24 viewBox and need to be centered at origin.
 */
const ICON_PATHS: Record<string, string> = {
  'eye-off': 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
  'eye': 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  'user': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  'minus': 'M20 12H4',
  'alert-triangle': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  'hand': 'M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11',
  'stop': 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'box': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  'skull': 'M9 9.5a1 1 0 100-2 1 1 0 000 2zM15 9.5a1 1 0 100-2 1 1 0 000 2zM9 17v4M12 17v4M15 17v4M8.5 13c0 1 1.5 2 3.5 2s3.5-1 3.5-2',
  'warning': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  'x': 'M6 18L18 6M6 6l12 12',
  'arrow-left': 'M10 19l-7-7m0 0l7-7m-7 7h18',
  'arrow-right': 'M14 5l7 7m0 0l-7 7m7-7H3',
  'plus': 'M12 4v16m8-8H4',
  'crosshair': 'M12 2v4M12 18v4M2 12h4M18 12h4',
  'dice': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
}

interface ConditionIndicatorsProps {
  conditions: TokenCondition[]
  tokenSize: number
  offset: number
  maxVisible?: number
}

/**
 * Renders condition indicators as a compact vertical strip alongside the token.
 * Automatically scales down when many conditions are present.
 */
export function ConditionIndicators({
  conditions,
  tokenSize,
  offset,
  maxVisible = 6
}: ConditionIndicatorsProps) {
  if (conditions.length === 0) return null

  const conditionCount = conditions.length
  const visibleConditions = conditions.slice(0, maxVisible)
  const overflowCount = conditionCount - maxVisible

  // Dynamic sizing based on condition count and token size
  // Smaller indicators when there are many, or when token is small
  const baseRadius = Math.min(7, tokenSize * 0.12)
  const scaleFactor = conditionCount > 3 ? Math.max(0.65, 1 - (conditionCount - 3) * 0.1) : 1
  const indicatorRadius = Math.max(4.5, baseRadius * scaleFactor)
  const indicatorDiameter = indicatorRadius * 2
  const indicatorGap = Math.max(1, indicatorRadius * 0.3)
  const indicatorSpacing = indicatorDiameter + indicatorGap

  // Total height of the indicator strip
  const totalIndicators = visibleConditions.length + (overflowCount > 0 ? 1 : 0)
  const stripHeight = totalIndicators * indicatorSpacing - indicatorGap

  // Position: right edge of token, vertically centered
  const xPos = tokenSize + offset + indicatorRadius + 2
  const yPos = offset + (tokenSize - stripHeight) / 2 + indicatorRadius

  // Icon scale: fit within the circle with padding
  const iconScale = (indicatorRadius * 1.4) / 24

  return (
    <Group x={xPos} y={yPos}>
      {visibleConditions.map((condition, i) => {
        const pathData = condition.icon ? ICON_PATHS[condition.icon] : null
        const yOffset = i * indicatorSpacing

        return (
          <Group key={condition.id} x={0} y={yOffset}>
            {/* Background circle with subtle depth */}
            <Circle
              x={0}
              y={0}
              radius={indicatorRadius}
              fill={condition.color ?? '#ef4444'}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={0.75}
            />

            {/* Icon centered in circle */}
            {pathData && (
              <Path
                data={pathData}
                x={-12 * iconScale}
                y={-12 * iconScale}
                scaleX={iconScale}
                scaleY={iconScale}
                stroke="#fff"
                strokeWidth={1 / iconScale}
                fill="transparent"
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
            )}

            {/* Duration badge - tiny pill at bottom-right */}
            {condition.duration !== undefined && (
              <Group x={indicatorRadius * 0.5} y={indicatorRadius * 0.5}>
                <Circle
                  x={0}
                  y={0}
                  radius={indicatorRadius * 0.55}
                  fill="#18181b"
                  stroke="#fff"
                  strokeWidth={0.5}
                />
                <Text
                  x={-indicatorRadius * 0.55}
                  y={-indicatorRadius * 0.45}
                  width={indicatorRadius * 1.1}
                  height={indicatorRadius * 0.9}
                  text={String(condition.duration)}
                  fontSize={indicatorRadius * 0.8}
                  fill="#fff"
                  align="center"
                  verticalAlign="middle"
                  fontStyle="bold"
                />
              </Group>
            )}
          </Group>
        )
      })}

      {/* Overflow indicator */}
      {overflowCount > 0 && (
        <Group x={0} y={visibleConditions.length * indicatorSpacing}>
          <Circle
            x={0}
            y={0}
            radius={indicatorRadius}
            fill="#27272a"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={0.5}
          />
          <Text
            x={-indicatorRadius}
            y={-indicatorRadius * 0.5}
            width={indicatorRadius * 2}
            height={indicatorRadius}
            text={`+${overflowCount}`}
            fontSize={indicatorRadius * 0.9}
            fill="#a1a1aa"
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
          />
        </Group>
      )}
    </Group>
  )
}
