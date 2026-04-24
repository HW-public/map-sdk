import type * as Cesium from 'cesium'
import { createTiandituProvider } from '../utils'

export interface TiandituConfig {
  key: string
}

/**
 * Cesium 渲染天地图底图。
 *
 * @param viewer - Cesium Viewer 实例
 * @param config - 天地图配置 { key }
 */
export function addTianditu(viewer: Cesium.Viewer | null, config: TiandituConfig): void {
  if (!viewer) return

  viewer.imageryLayers.addImageryProvider(createTiandituProvider(config.key, 'img'))
  viewer.imageryLayers.addImageryProvider(createTiandituProvider(config.key, 'cia'))
}
