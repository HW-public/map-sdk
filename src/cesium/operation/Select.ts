import type { Viewer } from 'cesium'

/**
 * Cesium 选择操作。
 *
 * 职责：点选、框选、多边形选等交互式选择逻辑。
 */
export class CesiumSelect {
  /**
   * 启用点选模式：点击 3D 场景中的实体时触发回调。
   *
   * @param viewer - Cesium Viewer 实例
   * @param callback - 选中实体后的回调
   */
  static enablePointSelect(
    viewer: Viewer | null,
    callback: (entities: unknown[]) => void
  ): void {
    if (!viewer) return
    // TODO: 使用 ScreenSpaceEventHandler.LEFT_CLICK + viewer.scene.pick 实现点选
    void callback
  }

  /**
   * 启用框选模式：拖拽矩形框选 3D 场景中的实体。
   *
   * @param viewer - Cesium Viewer 实例
   * @param callback - 框选完成后的回调
   */
  static enableBoxSelect(
    viewer: Viewer | null,
    callback: (entities: unknown[]) => void
  ): void {
    if (!viewer) return
    // TODO: 使用 ScreenSpaceEventHandler 监听拖拽起止，结合 Camera 视锥或 pickRect 实现框选
    void callback
  }

  /**
   * 禁用所有选择交互。
   *
   * @param viewer - Cesium Viewer 实例
   */
  static disable(viewer: Viewer | null): void {
    if (!viewer) return
    // TODO: 销毁本模块创建的所有 ScreenSpaceEventHandler
  }
}
