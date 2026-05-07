import type * as Cesium from 'cesium'
import { createTiandituProvider } from '../utils'

export interface TiandituConfig {
  key: string
  id?: string
}

/**
 * Cesium 渲染天地图底图。
 *
 * @param viewer - Cesium Viewer 实例
 * @param config - 天地图配置 { key, id? }
 */
export function addTianditu(viewer: Cesium.Viewer | null, config: TiandituConfig): void {
  if (!viewer) return

  const imgLayer = viewer.imageryLayers.addImageryProvider(createTiandituProvider(config.key, 'img'))
  if (config.id) (imgLayer as any).layerId = config.id

  const ciaLayer = viewer.imageryLayers.addImageryProvider(createTiandituProvider(config.key, 'cia'))
  if (config.id) (ciaLayer as any).layerId = config.id
}
