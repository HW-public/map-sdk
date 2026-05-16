import * as Cesium from 'cesium'
import type { FeatureInfo } from '@/types'

/**
 * Cesium 选择操作。
 *
 * 职责：点选、框选等交互式选择逻辑。
 */
export class CesiumSelect {
  private static handler: Cesium.ScreenSpaceEventHandler | null = null
  private static startPosition: Cesium.Cartesian2 | null = null

  /**
   * 启用点选模式：点击 3D 场景中的实体时触发回调。
   *
   * @param viewer - Cesium Viewer 实例
   * @param callback - 选中实体后的回调
   */
  static enablePointSelect(
    viewer: Cesium.Viewer | null,
    callback: (features: FeatureInfo[]) => void
  ): void {
    if (!viewer) return
    CesiumSelect.disable()

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.drillPick(click.position)
      const features: FeatureInfo[] = picked
        .map((p) => {
          const entity = (p as any).id
          if (!entity) return null
          return {
            type: entity.featureType ?? 'point',
            coords: entity.featureCoords ?? [],
            id: entity.featureId,
            style: entity.featureStyle,
          } as FeatureInfo
        })
        .filter((f): f is FeatureInfo => f !== null)
      callback(features)
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    CesiumSelect.handler = handler
  }

  /**
   * 启用框选模式：拖拽矩形框选 3D 场景中的实体。
   *
   * @param viewer - Cesium Viewer 实例
   * @param callback - 框选完成后的回调
   */
  static enableBoxSelect(
    viewer: Cesium.Viewer | null,
    callback: (features: FeatureInfo[]) => void
  ): void {
    if (!viewer) return
    CesiumSelect.disable()

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)

    handler.setInputAction((down: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      CesiumSelect.startPosition = down.position
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    handler.setInputAction((up: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const start = CesiumSelect.startPosition
      if (!start) return
      CesiumSelect.startPosition = null

      const x1 = Math.min(start.x, up.position.x)
      const y1 = Math.min(start.y, up.position.y)
      const x2 = Math.max(start.x, up.position.x)
      const y2 = Math.max(start.y, up.position.y)

      const features: FeatureInfo[] = []
      // Cesium 没有原生 pickRect，逐像素采样（步长 5px）近似框选
      const step = 5
      const seen = new Set<string>()
      for (let x = x1; x <= x2; x += step) {
        for (let y = y1; y <= y2; y += step) {
          const picked = viewer.scene.pick(new Cesium.Cartesian2(x, y))
          const entity = (picked as any)?.id
          if (entity && entity.featureId && !seen.has(entity.featureId)) {
            seen.add(entity.featureId)
            features.push({
              type: entity.featureType ?? 'point',
              coords: entity.featureCoords ?? [],
              id: entity.featureId,
              style: entity.featureStyle,
            })
          }
        }
      }
      callback(features)
    }, Cesium.ScreenSpaceEventType.LEFT_UP)

    CesiumSelect.handler = handler
  }

  /**
   * 禁用所有选择交互。
   */
  static disable(): void {
    if (CesiumSelect.handler) {
      CesiumSelect.handler.destroy()
      CesiumSelect.handler = null
    }
    CesiumSelect.startPosition = null
  }
}
