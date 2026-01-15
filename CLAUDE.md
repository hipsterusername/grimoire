# CLAUDE.md - Grimoire Development Guide

## Project Overview

Grimoire is a desktop battle map manager for tabletop RPGs built with Electron + React. It provides DMs with tools for map management, token tracking, fog of war, and initiative during tactical encounters.

## Quick Start

```bash
npm install        # Install dependencies
npm run dev        # Start development (hot reload)
npm run typecheck  # Check types before committing
npm run test       # Run unit tests
npm run test:e2e   # Run e2e tests (builds first)
```

## Tech Stack

- **Runtime**: Electron 39
- **Frontend**: React 19, TypeScript 5.9
- **Canvas**: Konva 10 + react-konva (HTML5 2D canvas)
- **State**: Zustand 5 (lightweight stores with `subscribeWithSelector`)
- **Styling**: Tailwind CSS 4 (dark theme with CSS variables)
- **Build**: electron-vite 5, Vite 7
- **Testing**: Vitest (unit), Playwright (e2e), Storybook 10 (component docs)

## Architecture

```
src/
├── main/           # Electron main process - file I/O, IPC, windows
├── preload/        # Secure bridge between renderer and main
└── renderer/src/   # React application
    ├── components/
    │   ├── canvas/     # Konva layers (map, grid, tokens, fog), tools
    │   ├── layout/     # AppLayout, Sidebar, Toolbar, StatusBar
    │   ├── modals/     # Dialog overlays
    │   ├── panels/     # Sidebar panels (Token, Map, Library, Initiative)
    │   ├── presentation/  # Second window for players
    │   └── ui/         # Reusable primitives (Modal, ColorPicker, etc.)
    ├── stores/         # Zustand state (encounter, canvas, ui, library, presentation)
    ├── types/          # Domain types (encounter.ts, canvas.ts, library.ts)
    ├── lib/            # Utils (constants, grid-generator, image-processor)
    └── styles/         # Tailwind theme in globals.css
```

## Key Commands

```bash
npm run dev           # Start development
npm run build         # Build for production
npm run typecheck     # TypeScript validation

# Testing
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # E2E tests (builds first)
npm run test:e2e:dev  # E2E against dev server
npm run storybook     # Component documentation

# Packaging
npm run package:linux # Linux builds
npm run package:mac   # macOS builds
npm run package:win   # Windows builds
```

## Code Patterns

### Components
- Functional components with TypeScript interfaces for props
- Accessibility-first: ARIA labels, focus management, keyboard navigation
- Use `children` prop for composition
- Canvas components use Konva Groups with layers

### State Management (Zustand)
```typescript
// Access state selectively to avoid re-renders
const tokens = useEncounterStore((s) => s.encounter?.tokens ?? [])

// Actions are methods on the store
const { addToken, updateToken } = useEncounterStore()
```

**Stores**:
- `useEncounterStore` - Encounters, tokens, maps, fog, combat state
- `useCanvasStore` - Zoom, pan, tool selection, brush settings
- `useUIStore` - Modal states, panel visibility
- `useLibraryStore` - Saved assets (maps, tokens, templates)
- `usePresentationStore` - Presentation window state

### Styling
- Tailwind utility classes with semantic color names
- Theme variables in `src/renderer/src/styles/globals.css`
- Primary: purple (#8b5cf6), Accent: gold (#c4a962)
- Dark theme: background #0f0d13, foreground #e8e4ed

### Electron IPC
- Main process handles file operations, accessed via `window.electronAPI`
- All IPC calls go through preload script for security
- Use async/await pattern in stores for IPC operations

## Testing Strategy

### Unit Tests (Vitest)
- Located alongside source: `*.test.ts` or `*.test.tsx`
- Mock Electron API in `src/renderer/src/test/setup.ts`
- Use `createTestToken()` helpers for test data
- Reset store state in `beforeEach`

### Component Tests
- Use Testing Library for DOM queries and user events
- Test accessibility (ARIA, focus management, keyboard)
- Example: `Modal.test.tsx` tests focus trapping, escape key, backdrop clicks

### Storybook Stories
- Located alongside components: `*.stories.tsx`
- Multiple variants per component
- Use for visual documentation and interactive development

### E2E Tests (Playwright)
- Located in `e2e/` directory
- Page Object pattern: `e2e/pages/app.page.ts`
- Custom Electron fixture handles app launch
- Visual regression with snapshots in `e2e/__snapshots__/`

## Adding New Features

### New Component
1. Create in appropriate `components/` subdirectory
2. Add TypeScript interface for props
3. Include accessibility attributes (aria-label, role, tabIndex)
4. Create `ComponentName.stories.tsx` for documentation
5. Add `ComponentName.test.tsx` for unit tests

### New Store Action
1. Add action type to store interface
2. Implement action in store
3. Set `isDirty: true` if action modifies persisted data
4. Add unit tests in `*.test.ts`
5. Update CLAUDE.md if action has non-obvious behavior

### New Type/Enum
1. Add to appropriate file in `types/`
2. Export from `types/index.ts`
3. Use enums for fixed sets (TokenType, CreatureSize)
4. Add to constants.ts if UI needs labels/metadata
5. Include factory functions for defaults if complex

### New Canvas Tool
1. Add tool type to `CanvasTool` union in `types/canvas.ts`
2. Add tool metadata to `TOOLS` array in `lib/constants.ts`
3. Add keyboard shortcut to `KEYBOARD_SHORTCUTS` in constants.ts
4. Implement tool component in `components/canvas/tools/`
5. Add tool rendering in `BattleMapCanvas.tsx` (respect z-order)
6. Handle tool state in `canvas-store.ts`
7. Add toolbar button in `Toolbar.tsx`
8. Add e2e test for tool interaction
9. Update CLAUDE.md keyboard shortcuts table

### New IPC Channel
1. Add handler in `src/main/index.ts` with `ipcMain.handle()`
2. Add security validation (isValidId, isPathAllowed) if handling paths/IDs
3. Expose in `src/preload/index.ts` via electronAPI object
4. Add TypeScript types for params and return values
5. Mock in `src/renderer/src/test/setup.ts` for unit tests
6. Update CLAUDE.md IPC channels table if new prefix

### New Panel/Modal
1. Create component in `components/panels/` or `components/modals/`
2. Add modal type to UIStore if modal
3. Add open/close handlers to `ui-store.ts`
4. Create story file for visual documentation
5. Add e2e test if user-facing workflow

## Operational Checklists

### Before Every PR
```bash
npm run typecheck    # No type errors
npm run test         # Unit tests pass
npm run test:e2e     # E2E tests pass (run on CI if slow locally)
```

### When Adding User-Facing Features
- [ ] Unit tests for new store actions
- [ ] Component tests for new UI components
- [ ] Storybook story for visual documentation
- [ ] E2E test for critical user workflows
- [ ] Update keyboard shortcuts in constants.ts AND CLAUDE.md if applicable
- [ ] Update validation limits in constants.ts if new inputs

### When Modifying Data Models
- [ ] Update types in `types/*.ts`
- [ ] Update factory functions (createDefaultEncounter, etc.)
- [ ] Consider migration path for existing saved data
- [ ] Update relevant store actions
- [ ] Add/update unit tests for affected stores

### When Adding Canvas Features
- [ ] Respect layer z-order in BattleMapCanvas.tsx
- [ ] Use `listening={false}` on non-interactive layers (performance)
- [ ] Handle coordinate conversion (screen → canvas → grid)
- [ ] Test with zoom/pan applied
- [ ] Add e2e test with `{ force: true }` for canvas clicks

### When Modifying Fog of War
- [ ] Always set `createdAt: Date.now()` on new areas
- [ ] Test reveal → hide → reveal sequences work correctly
- [ ] Verify presentation window syncs (fogAreasCount dependency)

### When Modifying IPC/File Operations
- [ ] Add isValidId() check for user-provided IDs
- [ ] Add isPathAllowed() check for file paths
- [ ] Update preload type declarations
- [ ] Mock new IPC methods in test setup
- [ ] Test error handling paths

### Updating This Document
Update CLAUDE.md when:
- Adding new keyboard shortcuts
- Adding new IPC channel prefixes
- Adding new validation limits
- Discovering new gotchas/non-obvious behavior
- Changing data storage structure
- Adding new canvas layers (update z-order list)

## Important Files

- `src/main/index.ts` - Main process, IPC handlers, security
- `src/renderer/src/components/canvas/BattleMapCanvas.tsx` - Main canvas orchestrator
- `src/renderer/src/stores/encounter-store.ts` - Primary game state
- `src/renderer/src/types/encounter.ts` - Core domain types
- `src/renderer/src/lib/constants.ts` - App constants, colors, sizes, shortcuts

## Critical Implementation Details

### Fog of War - Chronological Processing
Fog areas use `createdAt` timestamps (Unix ms). Areas are processed oldest-first so **the most recent action wins**. This allows reveal → hide → reveal sequences to work correctly. When adding fog areas, always include `createdAt: Date.now()`.

```typescript
// In FogOfWarLayer.tsx - areas sorted chronologically before rendering
allAreas.sort((a, b) => (a.area.createdAt || 0) - (b.area.createdAt || 0))
// reveal uses destination-out, hide uses source-over compositing
```

### Canvas Layer Z-Order (bottom to top)
1. Background (solid color)
2. MapLayer (image)
3. GridLayer (overlay)
4. TokenLayer (creatures/objects)
5. MovementMeasure (drag distance display)
6. FogOfWarLayer (visibility mask)
7. PresentationBounds (crop rectangle)
8. FogBrush (tool preview)

### View State Does NOT Mark Dirty
Zoom/pan changes don't trigger save prompts - this is intentional. Only content changes (tokens, fog, map) set `isDirty: true`.

### Coordinate Conversions
Screen → Canvas → Grid:
```typescript
const canvasX = (screenX - view.panX) / view.zoom
const canvasY = (screenY - view.panY) / view.zoom
const gridX = Math.floor(canvasX / gridSize)
const gridY = Math.floor(canvasY / gridSize)
```

### Presentation Window Sync
- Main window pushes state via `presentation:updateState` IPC
- Presentation window requests state on load via `presentation:requestState`
- 100ms delay before sync to ensure window is ready
- Sync triggers on: encounter changes, fog area count changes, bounds changes

## Data Storage

All data stored in Electron's `userData` directory:
```
{userData}/
├── encounters/     # {id}.json files
├── maps/           # Uploaded map images
├── tokens/         # Uploaded token images
└── library/
    ├── library.json   # Asset metadata
    └── assets/        # Saved asset files
```

## IPC Channels

| Prefix | Purpose |
|--------|---------|
| `encounters:` | CRUD operations for encounters |
| `images:` | Upload images, get data URLs |
| `library:` | Asset library management |
| `presentation:` | Second window control and sync |

Key methods on `window.electronAPI`:
- `uploadImage(type)` - Opens file dialog, returns `{ path, filename }`
- `getLocalFileUrl(path)` - Returns `local-file://` URL for secure loading
- `saveEncounter(encounter)` - Persists to disk, auto-sets `updatedAt`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select tool |
| H | Pan tool |
| R | Fog reveal tool |
| F | Fog hide tool |
| Space (hold) | Temporary pan |
| Middle mouse | Temporary pan |
| Ctrl+S | Save |
| Ctrl+R | Recenter/fit map |
| Delete | Remove selected token |

## Validation Limits

From `lib/constants.ts`:
- Encounter name: 2-100 chars
- Token name: max 100 chars
- Notes: max 1000 chars
- HP: max 9999
- AC: max 99
- Initiative: 0-99
- Grid: max 40x30 cells, cell size 30-200px, max 4 megapixels
- Map resize: 100-4000px per dimension

## Conventions

- Path alias: `@` maps to `src/renderer/src`
- UUIDs via `crypto.randomUUID()` for new entities
- ISO strings for timestamps (`createdAt`, `updatedAt`)
- Unix timestamps for fog areas (`Date.now()`)
- Mark state dirty when modified for save tracking
- Use `force: true` on canvas clicks in e2e tests
- Grid units: 1 unit = 1 creature space (varies by CreatureSize)
- Token sizes: Tiny=0.5, Small/Medium=1, Large=2, Huge=3, Gargantuan=4 cells

## Security

- Context isolation enabled in renderer
- Preload script validates IPC paths
- `isValidId()` prevents path traversal (alphanumeric, dash, underscore only)
- `isPathAllowed()` restricts file access to userData subdirectories
- Custom `local-file://` protocol for secure image loading
- No direct Node.js access from renderer

## Common Gotchas

1. **Fog not updating?** Check `createdAt` timestamp is set on new areas
2. **Token not appearing?** Verify `gridX`/`gridY` are within map bounds
3. **IPC failing?** Ensure ID passes `isValidId()` validation
4. **Canvas click not working in e2e?** Use `{ force: true }` option
5. **Presentation not syncing?** Check `isPresenting` state and `fogAreasCount` dependency

## Run Tests Before Committing

```bash
npm run typecheck && npm run test && npm run test:e2e
```
