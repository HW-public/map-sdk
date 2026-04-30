export interface LayerInfo {
  type?: string
  [key: string]: unknown
}

/** 天地图图层配置 */
export interface TiandituLayerInfo extends LayerInfo {
  type?: 'tianditu'
  key: string
}
