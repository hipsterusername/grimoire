import { useEncounterStore, useCanvasStore } from '../../stores'

const TOOL_LABELS: Record<string, string> = {
  select: 'Select',
  pan: 'Pan',
  'fog-reveal': 'Reveal Fog',
  'fog-hide': 'Hide Fog',
  measure: 'Measure',
  'add-token': 'Add Token'
}

export function StatusBar() {
  const encounter = useEncounterStore((s) => s.encounter)
  const selection = useCanvasStore((s) => s.selection)
  const activeTool = useCanvasStore((s) => s.activeTool)

  const tokenCount = encounter?.tokens.length ?? 0
  const selectedCount = selection?.tokenIds?.length ?? 0

  return (
    <footer
      className="min-h-[28px] px-4 py-1 bg-muted border-t border-border flex items-center gap-4 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-label="Application status"
    >
      <span aria-label={`Active tool: ${TOOL_LABELS[activeTool] || activeTool}`}>
        Tool: <span className="font-medium">{TOOL_LABELS[activeTool] || activeTool}</span>
      </span>

      <span role="separator" className="w-px h-3 bg-border" aria-hidden="true" />

      <span aria-label={`${tokenCount} tokens on map`}>
        Tokens: <span className="font-medium">{tokenCount}</span>
      </span>

      {selectedCount > 0 && (
        <>
          <span role="separator" className="w-px h-3 bg-border" aria-hidden="true" />
          <span aria-label={`${selectedCount} tokens selected`}>
            Selected: <span className="font-medium">{selectedCount}</span>
          </span>
        </>
      )}

      {encounter?.inCombat && (
        <>
          <span role="separator" className="w-px h-3 bg-border" aria-hidden="true" />
          <span className="text-accent font-medium" aria-label={`Combat round ${encounter.roundNumber}`}>
            Round {encounter.roundNumber}
          </span>
        </>
      )}

      <div className="flex-1" aria-hidden="true" />

      {encounter?.fogOfWar.enabled && (
        <span className="font-medium" aria-label="Fog of war is enabled">
          Fog of War: ON
        </span>
      )}
    </footer>
  )
}
