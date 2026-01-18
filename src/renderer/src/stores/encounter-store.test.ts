import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEncounterStore } from './encounter-store'
import { useCampaignStore } from './campaign-store'
import { TokenType, CreatureSize, type Token } from '../types'

// Helper to create a test token
function createTestToken(overrides: Partial<Token> = {}): Omit<Token, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Test Token',
    type: TokenType.PlayerCharacter,
    size: CreatureSize.Medium,
    gridX: 0,
    gridY: 0,
    color: '#ff0000',
    stats: {
      maxHp: 20,
      currentHp: 20,
      tempHp: 0,
      armorClass: 15,
      initiativeModifier: 2
    },
    conditions: [],
    visible: true,
    ...overrides
  }
}

// Helper to set up a mock active campaign
function setupMockCampaign() {
  useCampaignStore.setState({
    activeCampaign: {
      id: 'test-campaign-id',
      name: 'Test Campaign',
      color: '#8b5cf6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    campaigns: [],
    isLoading: false,
    error: null,
    needsMigration: false
  })
}

describe('encounter-store', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useEncounterStore.setState({
      encounter: null,
      isDirty: false,
      isLoading: false,
      error: null,
      recentEncounters: []
    })
    // Reset campaign store
    useCampaignStore.setState({
      activeCampaign: null,
      campaigns: [],
      isLoading: false,
      error: null,
      needsMigration: false
    })
  })

  describe('createEncounter', () => {
    beforeEach(() => {
      setupMockCampaign()
    })

    it('creates a new encounter with the given name', () => {
      const store = useEncounterStore.getState()
      store.createEncounter('Test Battle')

      const { encounter, isDirty } = useEncounterStore.getState()
      expect(encounter).not.toBeNull()
      expect(encounter?.name).toBe('Test Battle')
      expect(encounter?.tokens).toEqual([])
      expect(encounter?.inCombat).toBe(false)
      expect(isDirty).toBe(true)
    })

    it('sets error if no active campaign', () => {
      // Clear the campaign first
      useCampaignStore.setState({ activeCampaign: null })

      const store = useEncounterStore.getState()
      store.createEncounter('Test Battle')

      const { encounter, error } = useEncounterStore.getState()
      expect(encounter).toBeNull()
      expect(error).toBe('No active campaign')
    })
  })

  describe('closeEncounter', () => {
    beforeEach(() => {
      setupMockCampaign()
    })

    it('clears the current encounter', () => {
      const store = useEncounterStore.getState()
      store.createEncounter('Test Battle')
      store.closeEncounter()

      const { encounter, isDirty } = useEncounterStore.getState()
      expect(encounter).toBeNull()
      expect(isDirty).toBe(false)
    })
  })

  describe('token management', () => {
    beforeEach(() => {
      setupMockCampaign()
      useEncounterStore.getState().createEncounter('Token Test')
    })

    it('adds a token to the encounter', () => {
      const store = useEncounterStore.getState()
      store.addToken(createTestToken({ name: 'Warrior' }))

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens).toHaveLength(1)
      expect(encounter?.tokens[0].name).toBe('Warrior')
      expect(encounter?.tokens[0].id).toBeDefined()
    })

    it('updates a token by id', () => {
      const store = useEncounterStore.getState()
      store.addToken(createTestToken({ name: 'Warrior' }))

      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!
      store.updateToken(tokenId, { name: 'Updated Warrior', gridX: 5 })

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens[0].name).toBe('Updated Warrior')
      expect(encounter?.tokens[0].gridX).toBe(5)
    })

    it('removes a token by id', () => {
      const store = useEncounterStore.getState()
      store.addToken(createTestToken({ name: 'Warrior' }))
      store.addToken(createTestToken({ name: 'Mage' }))

      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!
      store.removeToken(tokenId)

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens).toHaveLength(1)
      expect(encounter?.tokens[0].name).toBe('Mage')
    })

    it('moves a token to new grid position', () => {
      const store = useEncounterStore.getState()
      store.addToken(createTestToken({ name: 'Warrior', gridX: 0, gridY: 0 }))

      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!
      store.moveToken(tokenId, 5, 3)

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens[0].gridX).toBe(5)
      expect(encounter?.tokens[0].gridY).toBe(3)
    })

    it('updates token HP and clamps to valid range', () => {
      const store = useEncounterStore.getState()
      store.addToken(createTestToken({ name: 'Warrior' }))

      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!

      // Take damage
      store.updateTokenHp(tokenId, 15)
      expect(useEncounterStore.getState().encounter?.tokens[0].stats.currentHp).toBe(15)

      // HP can't go below 0
      store.updateTokenHp(tokenId, -5)
      expect(useEncounterStore.getState().encounter?.tokens[0].stats.currentHp).toBe(0)

      // HP can't exceed max
      store.updateTokenHp(tokenId, 100)
      expect(useEncounterStore.getState().encounter?.tokens[0].stats.currentHp).toBe(20)

      // Temp HP
      store.updateTokenHp(tokenId, 20, 5)
      expect(useEncounterStore.getState().encounter?.tokens[0].stats.tempHp).toBe(5)
    })
  })

  describe('combat management', () => {
    beforeEach(() => {
      setupMockCampaign()
      const store = useEncounterStore.getState()
      store.createEncounter('Combat Test')
      store.addToken(createTestToken({ name: 'Fighter' }))
      store.addToken(createTestToken({ name: 'Goblin' }))
    })

    it('starts combat', () => {
      const store = useEncounterStore.getState()
      store.startCombat()

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.inCombat).toBe(true)
      expect(encounter?.roundNumber).toBe(1)
      expect(encounter?.currentTurnIndex).toBe(0)
    })

    it('ends combat', () => {
      const store = useEncounterStore.getState()
      store.startCombat()
      store.endCombat()

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.inCombat).toBe(false)
    })

    it('sets initiative for tokens', () => {
      const store = useEncounterStore.getState()
      const tokens = useEncounterStore.getState().encounter?.tokens!

      store.setInitiative(tokens[0].id, 18)
      store.setInitiative(tokens[1].id, 12)

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens[0].stats.initiative).toBe(18)
      expect(encounter?.tokens[1].stats.initiative).toBe(12)
    })

    it('clamps initiative to valid range (0-99)', () => {
      const store = useEncounterStore.getState()
      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!

      store.setInitiative(tokenId, 150)
      expect(useEncounterStore.getState().encounter?.tokens[0].stats.initiative).toBe(99)

      store.setInitiative(tokenId, -10)
      expect(useEncounterStore.getState().encounter?.tokens[0].stats.initiative).toBe(0)
    })

    it('sorts initiative order by descending value', () => {
      const store = useEncounterStore.getState()
      const tokens = useEncounterStore.getState().encounter?.tokens!

      // Fighter rolls 8, Goblin rolls 15
      store.setInitiative(tokens[0].id, 8)
      store.setInitiative(tokens[1].id, 15)
      store.sortInitiative()

      const { encounter } = useEncounterStore.getState()
      // Goblin (15) should be first
      expect(encounter?.initiativeOrder[0]).toBe(tokens[1].id)
      expect(encounter?.initiativeOrder[1]).toBe(tokens[0].id)
    })

    it('advances to next turn and increments round', () => {
      const store = useEncounterStore.getState()
      const tokens = useEncounterStore.getState().encounter?.tokens!

      store.setInitiative(tokens[0].id, 15)
      store.setInitiative(tokens[1].id, 10)
      store.sortInitiative()
      store.startCombat()

      // Initial state
      expect(useEncounterStore.getState().encounter?.currentTurnIndex).toBe(0)
      expect(useEncounterStore.getState().encounter?.roundNumber).toBe(1)

      // Next turn
      store.nextTurn()
      expect(useEncounterStore.getState().encounter?.currentTurnIndex).toBe(1)
      expect(useEncounterStore.getState().encounter?.roundNumber).toBe(1)

      // Wrap around to next round
      store.nextTurn()
      expect(useEncounterStore.getState().encounter?.currentTurnIndex).toBe(0)
      expect(useEncounterStore.getState().encounter?.roundNumber).toBe(2)
    })

    it('goes back to previous turn', () => {
      const store = useEncounterStore.getState()
      const tokens = useEncounterStore.getState().encounter?.tokens!

      store.setInitiative(tokens[0].id, 15)
      store.setInitiative(tokens[1].id, 10)
      store.sortInitiative()
      store.startCombat()

      // Advance a few turns
      store.nextTurn()
      store.nextTurn()

      // Now at round 2, turn 0
      expect(useEncounterStore.getState().encounter?.currentTurnIndex).toBe(0)
      expect(useEncounterStore.getState().encounter?.roundNumber).toBe(2)

      // Go back
      store.previousTurn()
      expect(useEncounterStore.getState().encounter?.currentTurnIndex).toBe(1)
      expect(useEncounterStore.getState().encounter?.roundNumber).toBe(1)
    })
  })

  describe('condition management', () => {
    beforeEach(() => {
      setupMockCampaign()
      const store = useEncounterStore.getState()
      store.createEncounter('Condition Test')
      store.addToken(createTestToken({ name: 'Fighter' }))
    })

    it('adds a condition to a token', () => {
      const store = useEncounterStore.getState()
      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!

      store.addCondition(tokenId, { name: 'Poisoned', color: '#22c55e' })

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens[0].conditions).toHaveLength(1)
      expect(encounter?.tokens[0].conditions[0].name).toBe('Poisoned')
      expect(encounter?.tokens[0].conditions[0].color).toBe('#22c55e')
      expect(encounter?.tokens[0].conditions[0].id).toBeDefined()
    })

    it('adds a condition with duration', () => {
      const store = useEncounterStore.getState()
      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!

      store.addCondition(tokenId, { name: 'Blessed', color: '#fbbf24', duration: 3 })

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens[0].conditions[0].duration).toBe(3)
    })

    it('removes a condition from a token', () => {
      const store = useEncounterStore.getState()
      const tokenId = useEncounterStore.getState().encounter?.tokens[0].id!

      store.addCondition(tokenId, { name: 'Poisoned', color: '#22c55e' })
      store.addCondition(tokenId, { name: 'Frightened', color: '#a855f7' })

      const conditionId = useEncounterStore.getState().encounter?.tokens[0].conditions[0].id!
      store.removeCondition(tokenId, conditionId)

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.tokens[0].conditions).toHaveLength(1)
      expect(encounter?.tokens[0].conditions[0].name).toBe('Frightened')
    })

    it('decrements condition duration on nextTurn', () => {
      const store = useEncounterStore.getState()

      // Add a second token for initiative order
      store.addToken(createTestToken({ name: 'Goblin' }))

      // Set up initiative
      const tokens = useEncounterStore.getState().encounter?.tokens!
      store.setInitiative(tokens[0].id, 15)
      store.setInitiative(tokens[1].id, 10)
      store.sortInitiative()
      store.startCombat()

      // Add a condition with duration 2 to the first token (Fighter)
      store.addCondition(tokens[0].id, { name: 'Blessed', color: '#fbbf24', duration: 2 })

      // Verify initial duration
      expect(useEncounterStore.getState().encounter?.tokens[0].conditions[0].duration).toBe(2)

      // Advance turn (Fighter's turn ends)
      store.nextTurn()

      // Duration should be decremented
      expect(useEncounterStore.getState().encounter?.tokens[0].conditions[0].duration).toBe(1)
    })

    it('removes condition when duration reaches 0', () => {
      const store = useEncounterStore.getState()

      // Add a second token for initiative order
      store.addToken(createTestToken({ name: 'Goblin' }))

      // Set up initiative
      const tokens = useEncounterStore.getState().encounter?.tokens!
      store.setInitiative(tokens[0].id, 15)
      store.setInitiative(tokens[1].id, 10)
      store.sortInitiative()
      store.startCombat()

      // Add a condition with duration 1 to the first token
      store.addCondition(tokens[0].id, { name: 'Blessed', color: '#fbbf24', duration: 1 })

      expect(useEncounterStore.getState().encounter?.tokens[0].conditions).toHaveLength(1)

      // Advance turn (Fighter's turn ends, condition expires)
      store.nextTurn()

      // Condition should be removed
      expect(useEncounterStore.getState().encounter?.tokens[0].conditions).toHaveLength(0)
    })

    it('does not decrement permanent conditions (no duration)', () => {
      const store = useEncounterStore.getState()

      // Add a second token for initiative order
      store.addToken(createTestToken({ name: 'Goblin' }))

      // Set up initiative
      const tokens = useEncounterStore.getState().encounter?.tokens!
      store.setInitiative(tokens[0].id, 15)
      store.setInitiative(tokens[1].id, 10)
      store.sortInitiative()
      store.startCombat()

      // Add a permanent condition (no duration)
      store.addCondition(tokens[0].id, { name: 'Poisoned', color: '#22c55e' })

      // Advance turn
      store.nextTurn()

      // Condition should still exist and have no duration
      const condition = useEncounterStore.getState().encounter?.tokens[0].conditions[0]
      expect(condition?.name).toBe('Poisoned')
      expect(condition?.duration).toBeUndefined()
    })
  })

  describe('fog of war', () => {
    beforeEach(() => {
      setupMockCampaign()
      useEncounterStore.getState().createEncounter('Fog Test')
    })

    it('toggles fog of war', () => {
      const store = useEncounterStore.getState()

      store.toggleFog(true)
      expect(useEncounterStore.getState().encounter?.fogOfWar.enabled).toBe(true)

      store.toggleFog(false)
      expect(useEncounterStore.getState().encounter?.fogOfWar.enabled).toBe(false)
    })

    it('adds revealed areas', () => {
      const store = useEncounterStore.getState()

      store.addFogReveal({ type: 'circle', x: 100, y: 100, radius: 50 })

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.fogOfWar.revealedAreas).toHaveLength(1)
      expect(encounter?.fogOfWar.revealedAreas[0].type).toBe('circle')
      expect(encounter?.fogOfWar.revealedAreas[0].radius).toBe(50)
    })

    it('adds hidden areas', () => {
      const store = useEncounterStore.getState()

      store.addFogHide({ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 })

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.fogOfWar.hiddenAreas).toHaveLength(1)
      expect(encounter?.fogOfWar.hiddenAreas[0].type).toBe('rectangle')
    })

    it('resets fog to default state', () => {
      const store = useEncounterStore.getState()

      store.toggleFog(true)
      store.addFogReveal({ type: 'circle', x: 100, y: 100, radius: 50 })
      store.addFogHide({ type: 'rectangle', x: 0, y: 0, width: 100, height: 100 })

      store.resetFog()

      const { encounter } = useEncounterStore.getState()
      expect(encounter?.fogOfWar.enabled).toBe(true) // Preserves enabled state
      expect(encounter?.fogOfWar.revealedAreas).toHaveLength(0)
      expect(encounter?.fogOfWar.hiddenAreas).toHaveLength(0)
    })
  })

  describe('async operations', () => {
    beforeEach(() => {
      // Set up mock campaign for async operations
      setupMockCampaign()
    })

    it('loads an encounter from the API', async () => {
      const mockEncounter = {
        id: 'test-123',
        campaignId: 'test-campaign-id',
        name: 'Loaded Battle',
        tokens: [],
        fogOfWar: { enabled: false, color: '#000', opacity: 0.95, revealedAreas: [], hiddenAreas: [] },
        initiativeOrder: [],
        currentTurnIndex: 0,
        roundNumber: 1,
        inCombat: false,
        viewState: { zoom: 1, panX: 0, panY: 0 },
        map: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      vi.mocked(window.electronAPI.loadCampaignEncounter).mockResolvedValueOnce(mockEncounter)

      const store = useEncounterStore.getState()
      await store.loadEncounter('test-123')

      const { encounter, isLoading, error } = useEncounterStore.getState()
      expect(encounter?.name).toBe('Loaded Battle')
      expect(isLoading).toBe(false)
      expect(error).toBeNull()
    })

    it('handles load errors gracefully', async () => {
      vi.mocked(window.electronAPI.loadCampaignEncounter).mockRejectedValueOnce(new Error('Not found'))

      const store = useEncounterStore.getState()
      await store.loadEncounter('invalid-id')

      const { encounter, error } = useEncounterStore.getState()
      expect(encounter).toBeNull()
      expect(error).toContain('Failed to load encounter')
    })

    it('saves the current encounter', async () => {
      vi.mocked(window.electronAPI.saveCampaignEncounter).mockResolvedValueOnce({ success: true })
      vi.mocked(window.electronAPI.listCampaignEncounters).mockResolvedValueOnce([])

      const store = useEncounterStore.getState()
      store.createEncounter('Save Test')
      await store.saveEncounter()

      const { isDirty } = useEncounterStore.getState()
      expect(isDirty).toBe(false)
      expect(window.electronAPI.saveCampaignEncounter).toHaveBeenCalledWith(
        'test-campaign-id',
        expect.objectContaining({ name: 'Save Test' })
      )
    })
  })
})
