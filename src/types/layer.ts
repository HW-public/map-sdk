export interface LayerInfo {
  id?: string
  type?: string
  /** 图层是否可见，默认 true */
  visible?: boolean
  /** 图层透明度 0~1，默认 1 */
  opacity?: number
  [key: string]: unknown
}

/** 天地图图层配置 */
export interface TiandituLayerInfo extends LayerInfo {
  type?: 'tianditu'
  key: string
}
