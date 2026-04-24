import type { MapState, MapEvent } from '@/types'

export class StateManager {
  private state: MapState
  private eventHandlers: Map<string, Set<(e: MapEvent) => void>> = new Map()

  constructor(initial: Partial<MapState> = {}) {
    this.state = {
      center: initial.center ?? [116.3974, 39.9093],
      zoom: initial.zoom ?? 10,
    }
  }

  getState(): MapState {
    return { ...this.state }
  }

  setState(state: Partial<MapState>): void {
    if (state.center) {
      this.state.center = state.center
    }
    if (state.zoom !== undefined) {
      this.state.zoom = state.zoom
    }
  }

  on(event: string, callback: (e: MapEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(callback)
  }

  off(event: string, callback: (e: MapEvent) => void): void {
    this.eventHandlers.get(event)?.delete(callback)
  }

  getEventHandlers(): Map<string, Set<(e: MapEvent) => void>> {
    return this.eventHandlers
  }

  reset(): void {
    this.state = {
      center: [116.3974, 39.9093],
      zoom: 10,
    }
    this.eventHandlers.clear()
  }
}
