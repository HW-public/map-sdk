import type { LayerInfo } from '@/types'

export class LayerManager {
  private layers: LayerInfo[] = []

  add(layer: LayerInfo): void {
    this.layers.push(layer)
  }

  getAll(): LayerInfo[] {
    return [...this.layers]
  }

  restore(layers: LayerInfo[]): void {
    this.layers = [...layers]
  }

  clear(): void {
    this.layers = []
  }
}
