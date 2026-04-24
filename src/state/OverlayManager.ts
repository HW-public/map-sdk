import type { FeatureInfo } from '@/types'

export class OverlayManager {
  private features: FeatureInfo[] = []

  add(feature: FeatureInfo): void {
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
