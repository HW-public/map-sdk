import { BaseMap } from '@/core/BaseMap'
import type { MapPlugin } from '@/core/Plugin'
import type { FeatureInfo } from '@/types'
import { CesiumDraw } from '@/cesium/operation'

/**
 * CesiumFeatureRendererPlugin — Cesium 实体渲染插件。
 *
 * 增强 BaseMap 的 addFeature / removeFeature / updateFeature / clearFeatures，
 * 在状态管理（OverlayManager）之外补充 Cesium Viewer 的实际实体渲染。
 * 卸载后回落到 BaseMap 默认实现（仅状态管理，不渲染）。
 */
export class CesiumFeatureRendererPlugin implements MapPlugin {
  readonly name = 'feature'

  install(map: BaseMap): void {
    const m = map as any
    const viewer = m.getViewer() as import('cesium').Viewer | null

    m.addFeature = (feature: FeatureInfo) => {
      BaseMap.prototype.addFeature.call(map, feature)
      CesiumDraw.addFeature(viewer, feature)
    }

    m.removeFeature = (id: string) => {
      BaseMap.prototype.removeFeature.call(map, id)
      CesiumDraw.removeFeature(viewer, id)
    }

    m.updateFeature = (id: string, style: Record<string, unknown>) => {
      BaseMap.prototype.updateFeature.call(map, id, style)
      CesiumDraw.updateFeature(viewer, id, style)
    }

    m.clearFeatures = () => {
      BaseMap.prototype.clearFeatures.call(map)
      CesiumDraw.clearFeatures(viewer)
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
