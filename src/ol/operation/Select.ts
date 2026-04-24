import type { Map } from 'ol'

/**
 * OpenLayers 选择操作。
 *
 * 职责：点选、框选、多边形选等交互式选择逻辑。
 */
export class OlSelect {
  /**
   * 启用点选模式：点击地图上的要素时触发回调。
   *
   * @param map - OpenLayers Map 实例
   * @param callback - 选中要素后的回调
   */
  static enablePointSelect(
    map: Map | null,
    callback: (features: unknown[]) => void
  ): void {
    if (!map) return
    // TODO: 使用 ol/interaction/Select 绑定 click 事件，过滤并返回选中要素
    void callback
  }

  /**
   * 启用框选模式：拖拽矩形框选区域内的要素。
   *
   * @param map - OpenLayers Map 实例
   * @param callback - 框选完成后的回调
   */
  static enableBoxSelect(
    map: Map | null,
    callback: (features: unknown[]) => void
  ): void {
    if (!map) return
    // TODO: 使用 ol/interaction/DragBox 实现框选
    void callback
  }

  /**
   * 禁用所有选择交互。
   *
   * @param map - OpenLayers Map 实例
   */
  static disable(map: Map | null): void {
    if (!map) return
    // TODO: 移除本模块添加的所有 interaction
  }
}
