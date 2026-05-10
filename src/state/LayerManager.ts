import type { LayerInfo } from '@/types'

export class LayerManager {
  private layers: LayerInfo[] = []

  add(layer: LayerInfo): void {
    if (layer.id) {
      const existing = this.layers.find((l) => l.id === layer.id)
      if (existing) {
        // 保留现有可见性/透明度状态
        if (layer.visible === undefined) layer.visible = existing.visible
        if (layer.opacity === undefined) layer.opacity = existing.opacity
      }
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

  setVisible(id: string, visible: boolean): void {
    const layer = this.layers.find((l) => l.id === id)
    if (layer) layer.visible = visible
  }

  setOpacity(id: string, opacity: number): void {
    const layer = this.layers.find((l) => l.id === id)
    if (layer) layer.opacity = opacity
  }

  getState(id: string): { visible?: boolean; opacity?: number } {
    const layer = this.layers.find((l) => l.id === id)
    return { visible: layer?.visible, opacity: layer?.opacity }
  }
}
