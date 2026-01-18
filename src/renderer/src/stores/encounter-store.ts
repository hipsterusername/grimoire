import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Encounter, Token, MapData, FogRevealArea, TokenCondition } from '../types'
import { createDefaultEncounter, DEFAULT_FOG_OF_WAR } from '../types'
import { useCampaignStore } from './campaign-store'

interface EncounterState {
  encounter: Encounter | null
  isDirty: boolean
  isLoading: boolean
  error: string | null
  recentEncounters: Array<{ id: string; name: string; updatedAt: string }>

  // Actions - Encounter
  loadEncounter: (id: string) => Promise<void>
  saveEncounter: () => Promise<void>
  createEncounter: (name: string) => void
  closeEncounter: () => void
  fetchRecentEncounters: () => Promise<void>
  deleteEncounter: (id: string) => Promise<void>

  // Actions - Tokens
  addToken: (token: Omit<Token, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateToken: (id: string, updates: Partial<Token>) => void
  removeToken: (id: string) => void
  duplicateToken: (id: string) => void
  moveToken: (id: string, gridX: number, gridY: number) => void
  updateTokenHp: (id: string, currentHp: number, tempHp?: number) => void

  // Actions - Conditions
  addCondition: (tokenId: string, condition: Omit<TokenCondition, 'id'>) => void
  removeCondition: (tokenId: string, conditionId: string) => void

  // Actions - Map
  setMap: (map: MapData) => void
  updateMapGrid: (settings: Partial<MapData['gridSettings']>) => void
  resizeMap: (width: number, height: number) => void
  clearMap: () => void

  // Actions - Fog of War
  toggleFog: (enabled: boolean) => void
  addFogReveal: (area: Omit<FogRevealArea, 'id' | 'createdAt'>) => void
  removeFogReveal: (id: string) => void
  addFogHide: (area: Omit<FogRevealArea, 'id' | 'createdAt'>) => void
  removeFogHide: (id: string) => void
  clearAllFog: () => void
  resetFog: () => void

  // Actions - Combat
  startCombat: () => void
  endCombat: () => void
  nextTurn: () => void
  previousTurn: () => void
  setInitiative: (tokenId: string, initiative: number) => void
  sortInitiative: () => void

  // Actions - View State
  updateViewState: (viewState: Partial<Encounter['viewState']>) => void
}

export const useEncounterStore = create<EncounterState>()(
  subscribeWithSelector((set, get) => ({
    encounter: null,
    isDirty: false,
    isLoading: false,
    error: null,
    recentEncounters: [],

    loadEncounter: async (id) => {
      const campaignId = useCampaignStore.getState().activeCampaign?.id
      if (!campaignId) {
        set({ error: 'No active campaign' })
        return
      }

      set({ isLoading: true, error: null })
      try {
        const encounter = await window.electronAPI.loadCampaignEncounter(campaignId, id)
        if (!encounter) {
          throw new Error('Encounter not found')
        }
        set({ encounter: encounter as Encounter, isLoading: false, isDirty: false })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({
          error: `Failed to load encounter: ${message}`,
          isLoading: false
        })
      }
    },

    saveEncounter: async () => {
      const { encounter } = get()
      if (!encounter) return

      const campaignId = useCampaignStore.getState().activeCampaign?.id
      if (!campaignId) {
        set({ error: 'No active campaign' })
        return
      }

      try {
        await window.electronAPI.saveCampaignEncounter(campaignId, encounter)
        set({ isDirty: false })
        get().fetchRecentEncounters()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to save encounter: ${message}` })
      }
    },

    createEncounter: (name) => {
      const campaignId = useCampaignStore.getState().activeCampaign?.id
      if (!campaignId) {
        set({ error: 'No active campaign' })
        return
      }
      const encounter = createDefaultEncounter(name, campaignId)
      set({ encounter, isDirty: true })
    },

    closeEncounter: () => {
      set({ encounter: null, isDirty: false })
    },

    fetchRecentEncounters: async () => {
      const campaignId = useCampaignStore.getState().activeCampaign?.id
      if (!campaignId) {
        set({ recentEncounters: [] })
        return
      }

      try {
        const encounters = await window.electronAPI.listCampaignEncounters(campaignId)
        set({ recentEncounters: encounters })
      } catch (error) {
        console.error('Failed to fetch encounters:', error)
      }
    },

    deleteEncounter: async (id) => {
      const campaignId = useCampaignStore.getState().activeCampaign?.id
      if (!campaignId) {
        set({ error: 'No active campaign' })
        return
      }

      try {
        await window.electronAPI.deleteCampaignEncounter(campaignId, id)
        const { encounter } = get()
        if (encounter?.id === id) {
          set({ encounter: null, isDirty: false })
        }
        get().fetchRecentEncounters()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        set({ error: `Failed to delete encounter: ${message}` })
      }
    },

    // Token actions
    addToken: (tokenData) => {
      set((state) => {
        if (!state.encounter) return state

        const newToken: Token = {
          ...tokenData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        return {
          encounter: {
            ...state.encounter,
            tokens: [...state.encounter.tokens, newToken]
          },
          isDirty: true
        }
      })
    },

    updateToken: (id, updates) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.map((t) =>
              t.id === id
                ? { ...t, ...updates, updatedAt: new Date().toISOString() }
                : t
            )
          },
          isDirty: true
        }
      })
    },

    removeToken: (id) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.filter((t) => t.id !== id),
            initiativeOrder: state.encounter.initiativeOrder.filter((i) => i !== id)
          },
          isDirty: true
        }
      })
    },

    duplicateToken: (id) => {
      set((state) => {
        if (!state.encounter) return state

        const sourceToken = state.encounter.tokens.find((t) => t.id === id)
        if (!sourceToken) return state

        // Find an empty cell near the source token
        const occupiedCells = new Set(
          state.encounter.tokens.map((t) => `${t.gridX},${t.gridY}`)
        )

        // Spiral search for empty cell
        let newX = sourceToken.gridX + 1
        let newY = sourceToken.gridY
        const directions = [
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: -1 }
        ]
        let x = sourceToken.gridX
        let y = sourceToken.gridY
        let steps = 1
        let dirIndex = 0
        let stepsInDir = 0
        let turnCount = 0

        for (let i = 0; i < 100; i++) {
          x += directions[dirIndex].dx
          y += directions[dirIndex].dy
          stepsInDir++

          if (x >= 0 && y >= 0 && !occupiedCells.has(`${x},${y}`)) {
            newX = x
            newY = y
            break
          }

          if (stepsInDir >= steps) {
            stepsInDir = 0
            dirIndex = (dirIndex + 1) % 4
            turnCount++
            if (turnCount % 2 === 0) {
              steps++
            }
          }
        }

        const newToken: Token = {
          ...sourceToken,
          id: crypto.randomUUID(),
          name: `${sourceToken.name} (Copy)`,
          gridX: newX,
          gridY: newY,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        return {
          encounter: {
            ...state.encounter,
            tokens: [...state.encounter.tokens, newToken]
          },
          isDirty: true
        }
      })
    },

    moveToken: (id, gridX, gridY) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.map((t) =>
              t.id === id
                ? { ...t, gridX, gridY, updatedAt: new Date().toISOString() }
                : t
            )
          },
          isDirty: true
        }
      })
    },

    updateTokenHp: (id, currentHp, tempHp) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.map((t) =>
              t.id === id
                ? {
                    ...t,
                    stats: {
                      ...t.stats,
                      currentHp: Math.max(0, Math.min(currentHp, t.stats.maxHp)),
                      tempHp: tempHp ?? t.stats.tempHp
                    },
                    updatedAt: new Date().toISOString()
                  }
                : t
            )
          },
          isDirty: true
        }
      })
    },

    // Condition actions
    addCondition: (tokenId, condition) => {
      set((state) => {
        if (!state.encounter) return state

        const newCondition: TokenCondition = {
          ...condition,
          id: crypto.randomUUID()
        }

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.map((t) =>
              t.id === tokenId
                ? {
                    ...t,
                    conditions: [...t.conditions, newCondition],
                    updatedAt: new Date().toISOString()
                  }
                : t
            )
          },
          isDirty: true
        }
      })
    },

    removeCondition: (tokenId, conditionId) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.map((t) =>
              t.id === tokenId
                ? {
                    ...t,
                    conditions: t.conditions.filter((c) => c.id !== conditionId),
                    updatedAt: new Date().toISOString()
                  }
                : t
            )
          },
          isDirty: true
        }
      })
    },

    // Map actions
    setMap: (map) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            map
          },
          isDirty: true
        }
      })
    },

    updateMapGrid: (settings) => {
      set((state) => {
        if (!state.encounter?.map) return state

        return {
          encounter: {
            ...state.encounter,
            map: {
              ...state.encounter.map,
              gridSettings: {
                ...state.encounter.map.gridSettings,
                ...settings
              }
            }
          },
          isDirty: true
        }
      })
    },

    resizeMap: (width, height) => {
      set((state) => {
        if (!state.encounter?.map) return state

        return {
          encounter: {
            ...state.encounter,
            map: {
              ...state.encounter.map,
              imageWidth: width,
              imageHeight: height,
              updatedAt: new Date().toISOString()
            }
          },
          isDirty: true
        }
      })
    },

    clearMap: () => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            map: null
          },
          isDirty: true
        }
      })
    },

    // Fog of War actions
    toggleFog: (enabled) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...state.encounter.fogOfWar,
              enabled
            }
          },
          isDirty: true
        }
      })
    },

    addFogReveal: (area) => {
      set((state) => {
        if (!state.encounter) return state

        const newArea: FogRevealArea = {
          ...area,
          id: crypto.randomUUID(),
          createdAt: Date.now()
        }

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...state.encounter.fogOfWar,
              revealedAreas: [...state.encounter.fogOfWar.revealedAreas, newArea]
            }
          },
          isDirty: true
        }
      })
    },

    removeFogReveal: (id) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...state.encounter.fogOfWar,
              revealedAreas: state.encounter.fogOfWar.revealedAreas.filter(
                (a) => a.id !== id
              )
            }
          },
          isDirty: true
        }
      })
    },

    addFogHide: (area) => {
      set((state) => {
        if (!state.encounter) return state

        const newArea: FogRevealArea = {
          ...area,
          id: crypto.randomUUID(),
          createdAt: Date.now()
        }

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...state.encounter.fogOfWar,
              hiddenAreas: [...(state.encounter.fogOfWar.hiddenAreas || []), newArea]
            }
          },
          isDirty: true
        }
      })
    },

    removeFogHide: (id) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...state.encounter.fogOfWar,
              hiddenAreas: (state.encounter.fogOfWar.hiddenAreas || []).filter(
                (a) => a.id !== id
              )
            }
          },
          isDirty: true
        }
      })
    },

    clearAllFog: () => {
      set((state) => {
        if (!state.encounter?.map) return state

        // Reveal entire map and clear hidden areas
        const fullReveal: FogRevealArea = {
          id: crypto.randomUUID(),
          type: 'rectangle',
          x: 0,
          y: 0,
          width: state.encounter.map.imageWidth,
          height: state.encounter.map.imageHeight,
          createdAt: Date.now()
        }

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...state.encounter.fogOfWar,
              revealedAreas: [fullReveal],
              hiddenAreas: []
            }
          },
          isDirty: true
        }
      })
    },

    resetFog: () => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            fogOfWar: {
              ...DEFAULT_FOG_OF_WAR,
              enabled: state.encounter.fogOfWar.enabled
            }
          },
          isDirty: true
        }
      })
    },

    // Combat actions
    startCombat: () => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            inCombat: true,
            roundNumber: 1,
            currentTurnIndex: 0
          },
          isDirty: true
        }
      })
    },

    endCombat: () => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            inCombat: false
          },
          isDirty: true
        }
      })
    },

    nextTurn: () => {
      set((state) => {
        if (!state.encounter || !state.encounter.inCombat) return state

        const orderLength = state.encounter.initiativeOrder.length
        if (orderLength === 0) return state

        // Get the token whose turn is ending (conditions expire at end of their turn)
        const currentTokenId = state.encounter.initiativeOrder[state.encounter.currentTurnIndex]

        // Process conditions for the token whose turn is ending
        const updatedTokens = state.encounter.tokens.map((t) => {
          if (t.id !== currentTokenId) return t

          // Decrement duration for timed conditions and remove expired ones
          const updatedConditions = t.conditions
            .map((c) => {
              if (c.duration === undefined) return c // Permanent condition
              return { ...c, duration: c.duration - 1 }
            })
            .filter((c) => c.duration === undefined || c.duration > 0)

          // Only update token if conditions changed
          if (updatedConditions.length === t.conditions.length &&
              updatedConditions.every((c, i) => c.duration === t.conditions[i].duration)) {
            return t
          }

          return {
            ...t,
            conditions: updatedConditions,
            updatedAt: new Date().toISOString()
          }
        })

        const nextIndex = (state.encounter.currentTurnIndex + 1) % orderLength
        const newRound =
          nextIndex === 0
            ? state.encounter.roundNumber + 1
            : state.encounter.roundNumber

        return {
          encounter: {
            ...state.encounter,
            tokens: updatedTokens,
            currentTurnIndex: nextIndex,
            roundNumber: newRound
          },
          isDirty: true
        }
      })
    },

    previousTurn: () => {
      set((state) => {
        if (!state.encounter || !state.encounter.inCombat) return state

        const orderLength = state.encounter.initiativeOrder.length
        if (orderLength === 0) return state

        const prevIndex =
          state.encounter.currentTurnIndex === 0
            ? orderLength - 1
            : state.encounter.currentTurnIndex - 1

        const newRound =
          state.encounter.currentTurnIndex === 0 &&
          state.encounter.roundNumber > 1
            ? state.encounter.roundNumber - 1
            : state.encounter.roundNumber

        return {
          encounter: {
            ...state.encounter,
            currentTurnIndex: prevIndex,
            roundNumber: newRound
          },
          isDirty: true
        }
      })
    },

    setInitiative: (tokenId, initiative) => {
      set((state) => {
        if (!state.encounter) return state

        // Clamp initiative to valid range (0-99)
        const clampedInitiative = Math.max(0, Math.min(99, Math.round(initiative)))

        return {
          encounter: {
            ...state.encounter,
            tokens: state.encounter.tokens.map((t) =>
              t.id === tokenId
                ? {
                    ...t,
                    stats: { ...t.stats, initiative: clampedInitiative },
                    updatedAt: new Date().toISOString()
                  }
                : t
            )
          },
          isDirty: true
        }
      })
    },

    sortInitiative: () => {
      set((state) => {
        if (!state.encounter) return state

        const tokensWithInit = state.encounter.tokens
          .filter((t) => t.stats.initiative !== undefined)
          .sort((a, b) => (b.stats.initiative ?? 0) - (a.stats.initiative ?? 0))

        return {
          encounter: {
            ...state.encounter,
            initiativeOrder: tokensWithInit.map((t) => t.id),
            currentTurnIndex: 0
          },
          isDirty: true
        }
      })
    },

    // View state
    updateViewState: (viewState) => {
      set((state) => {
        if (!state.encounter) return state

        return {
          encounter: {
            ...state.encounter,
            viewState: {
              ...state.encounter.viewState,
              ...viewState
            }
          }
          // Don't mark as dirty for view changes
        }
      })
    }
  }))
)
