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
