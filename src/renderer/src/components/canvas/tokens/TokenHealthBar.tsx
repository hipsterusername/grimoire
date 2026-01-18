import { Group, Rect } from 'react-konva'

interface TokenHealthBarProps {
  currentHp: number
  maxHp: number
  tempHp: number
  width: number
  x?: number
  y?: number
}

export function TokenHealthBar({
  currentHp,
  maxHp,
  tempHp,
  width,
  x = 0,
  y = 0
}: TokenHealthBarProps) {
  const height = 6
  const padding = 1

  const hpPercent = maxHp > 0 ? Math.max(0, Math.min(1, currentHp / maxHp)) : 0
  const tempPercent = maxHp > 0 ? Math.max(0, Math.min(1 - hpPercent, tempHp / maxHp)) : 0

  // Color based on HP percentage
  const hpColor =
    hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444'

  const innerWidth = width - padding * 2
  const hpWidth = innerWidth * hpPercent
  const tempWidth = innerWidth * tempPercent

  return (
    <Group x={x} y={y}>
      {/* Background */}
      <Rect
        width={width}
        height={height}
        fill="#1f2937"
        cornerRadius={2}
        stroke="#374151"
        strokeWidth={1}
      />

      {/* Current HP bar */}
      {hpWidth > 0 && (
        <Rect
          x={padding}
          y={padding}
          width={hpWidth}
          height={height - padding * 2}
          fill={hpColor}
          cornerRadius={1}
        />
      )}

      {/* Temp HP bar */}
      {tempWidth > 0 && (
        <Rect
          x={padding + hpWidth}
          y={padding}
          width={tempWidth}
          height={height - padding * 2}
          fill="#38bdf8"
          cornerRadius={1}
        />
      )}

    </Group>
  )
}
