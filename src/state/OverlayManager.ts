import type { FeatureInfo } from '@/types'

export class OverlayManager {
  private features: FeatureInfo[] = []

  add(feature: FeatureInfo): void {
    if (feature.id) {
      this.features = this.features.filter((f) => f.id !== feature.id)
    }
    this.features.push(feature)
  }

  remove(id: string): void {
    this.features = this.features.filter((f) => f.id !== id)
  }

  update(id: string, partial: Partial<FeatureInfo>): void {
    const idx = this.features.findIndex((f) => f.id === id)
    if (idx !== -1) {
      this.features[idx] = { ...this.features[idx], ...partial }
    }
  }

  getAll(): FeatureInfo[] {
    return [...this.features]
  }

  restore(features: FeatureInfo[]): void {
    this.features = [...features]
  }

  clear(): void {
    this.features = []
  }
}
