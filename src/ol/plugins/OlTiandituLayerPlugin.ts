import type { BaseMap, MapPlugin } from '@/core'
import type { TiandituLayerInfo } from '@/types'
import { addTianditu } from '@/ol/layers/addTianditu'

/**
 * OlTiandituLayerPlugin — OpenLayers 天地图图层渲染器。
 *
 * 向地图注册 `type='tianditu'` 的图层渲染能力。
 */
export class OlTiandituLayerPlugin implements MapPlugin {
  readonly name = 'layer-tianditu'

  install(map: BaseMap): void {
    map.registerLayerType('tianditu', (m, layer) => {
      const olMap = (m as any).getOlMap() as import('ol').Map | null
      addTianditu(olMap, { key: (layer as TiandituLayerInfo).key, id: layer.id })
    })
  }

  uninstall(_map: BaseMap): void {
    // 卸载时无需特殊清理，图层随引擎 destroy 自动释放
  }
}
