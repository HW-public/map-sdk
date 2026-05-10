export type FeatureType = 'point' | 'polyline' | 'polygon'

export interface FeatureInfo {
  type: FeatureType
  coords: [number, number][]
  id?: string
  style?: Record<string, unknown>
}

/** 点选查询结果 */
export interface PickResult {
  id?: string
  type: FeatureType
  coords: [number, number][]
  style?: Record<string, unknown>
}

/** 交互式绘制选项 */
export interface DrawOptions {
  style?: Record<string, unknown>
  onComplete?: (feature: FeatureInfo) => void
  onChange?: (coords: [number, number][]) => void
}
