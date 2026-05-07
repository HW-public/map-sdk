import type { Map } from 'ol'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { buildTiandituUrls } from '../utils'

export interface TiandituConfig {
  key: string
  id?: string
}

/**
 * OpenLayers 渲染天地图底图。
 *
 * @param map - OpenLayers Map 实例
 * @param config - 天地图配置 { key, id? }
 */
export function addTianditu(map: Map | null, config: TiandituConfig): void {
  if (!map) return

  const imgLayer = new TileLayer({
    source: new XYZ({
      urls: buildTiandituUrls(config.key, 'img'),
      crossOrigin: 'anonymous',
      maxZoom: 18,
    }),
  })
  if (config.id) imgLayer.set('layerId', config.id)
  map.addLayer(imgLayer)

  const ciaLayer = new TileLayer({
    source: new XYZ({
      urls: buildTiandituUrls(config.key, 'cia'),
      crossOrigin: 'anonymous',
      maxZoom: 18,
    }),
  })
  if (config.id) ciaLayer.set('layerId', config.id)
  map.addLayer(ciaLayer)
}
