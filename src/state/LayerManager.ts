import type { LayerInfo } from '@/types'

export class LayerManager {
  private layers: LayerInfo[] = []

  add(layer: LayerInfo): void {
    if (layer.id) {
      this.layers = this.layers.filter((l) => l.id !== layer.id)
    }
    this.layers.push(layer)
  }

  remove(id: string): void {
    this.layers = this.layers.filter((l) => l.id !== id)
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
