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

/** 要素编辑选项 */
export interface EditOptions {
  onComplete?: (feature: FeatureInfo) => void
}

/** 选择模式 */
export type SelectMode = 'point' | 'box'

/** 选择选项 */
export interface SelectOptions {
  mode?: SelectMode
  onSelect?: (features: FeatureInfo[]) => void
}

/** 选择结果 */
export interface SelectResult {
  features: FeatureInfo[]
}
