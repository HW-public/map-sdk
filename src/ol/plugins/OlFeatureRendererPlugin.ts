import { BaseMap } from '@/core/BaseMap'
import type { MapPlugin } from '@/core/Plugin'
import type { FeatureInfo } from '@/types'
import { OlDraw } from '@/ol/operation'

/**
 * OlFeatureRendererPlugin — OpenLayers 矢量要素渲染插件。
 *
 * 增强 BaseMap 的 addFeature / removeFeature / updateFeature / clearFeatures，
 * 在状态管理（OverlayManager）之外补充 OL 矢量层的实际渲染。
 * 卸载后回落到 BaseMap 默认实现（仅状态管理，不渲染）。
 */
export class OlFeatureRendererPlugin implements MapPlugin {
  readonly name = 'feature'

  install(map: BaseMap): void {
    const m = map as any
    const olMap = m.getOlMap() as import('ol').Map | null

    m.addFeature = (feature: FeatureInfo) => {
      // 先调用 BaseMap 原型上的默认实现（OverlayManager 状态管理）
      BaseMap.prototype.addFeature.call(map, feature)
      // 再渲染到 OL 矢量层
      OlDraw.addFeature(olMap, feature)
    }

    m.removeFeature = (id: string) => {
      BaseMap.prototype.removeFeature.call(map, id)
      OlDraw.removeFeature(olMap, id)
    }

    m.updateFeature = (id: string, style: Record<string, unknown>) => {
      BaseMap.prototype.updateFeature.call(map, id, style)
      OlDraw.updateFeature(olMap, id, style)
    }

    m.clearFeatures = () => {
      BaseMap.prototype.clearFeatures.call(map)
      OlDraw.clearFeatures(olMap)
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    delete m.addFeature
    delete m.removeFeature
    delete m.updateFeature
    delete m.clearFeatures
  }
}
