import { Layer } from 'react-konva'
import type { Token as TokenType } from '../../../types'
import { Token } from '../tokens/Token'
import { useCanvasStore } from '../../../stores'

interface TokenLayerProps {
  tokens: TokenType[]
  gridSize: number
}

export function TokenLayer({ tokens, gridSize }: TokenLayerProps) {
  const selection = useCanvasStore((s) => s.selection)
  const selectToken = useCanvasStore((s) => s.selectToken)

  return (
    <Layer>
      {tokens.map((token) => (
        <Token
          key={token.id}
          token={token}
          gridSize={gridSize}
          isSelected={selection?.tokenIds?.includes(token.id) ?? false}
          onSelect={selectToken}
        />
      ))}
    </Layer>
  )
}
