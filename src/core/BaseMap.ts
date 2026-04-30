import type { IMap, MapConfig, MapEvent, MapState, LayerInfo, FeatureInfo, DrawOptions } from '@/types'
import { getElement } from '@/utils'
import { LayerManager, OverlayManager } from '@/state'

/**
 * BaseMap — 二三维引擎的公共抽象基类。
 *
 * 设计原则：
 * 1. 核心服务方法（setCenter/flyTo/on/off 等）保持 abstract — 所有引擎必须实现
 * 2. 功能方法（loadTianditu/addFeature/clearFeatures）提供默认实现 —
 *    自动记录到 LayerManager/OverlayManager，引擎渲染部分由子类 override 补充
 * 3. restoreFeatures 直接复用 addFeature，restoreLayers 直接复用 loadTianditu —
 *    恢复即重放，不需要额外注册恢复函数
 *
 * 新增方法时的步骤：
 * - 不需要引擎定制 → 只改 BaseMap（加默认实现）
 * - 需要引擎定制 → BaseMap（加默认实现）+ 子类 override（super.xxx() + 引擎渲染）
 */
export abstract class BaseMap implements IMap {
  protected container: HTMLElement
  protected config: MapConfig
  protected layerMgr = new LayerManager()
  protected overlayMgr = new OverlayManager()

  protected constructor(config: MapConfig) {
    this.container = getElement(config.container)
    this.config = config
  }

  // ==================== IMap 核心服务方法（子类必须实现） ====================

  abstract init(): Promise<void> | void
  abstract destroy(): void
  abstract setCenter(lon: number, lat: number): void
  abstract getCenter(): [number, number] | undefined
  abstract setZoom(zoom: number): void
  abstract getZoom(): number | undefined
  abstract flyTo(lon: number, lat: number, zoom?: number): void
  abstract on(event: string, callback: (e: MapEvent) => void): void
  abstract off(event: string, callback: (e: MapEvent) => void): void

  // ==================== IMap 状态管理（基类默认实现） ====================

  getState(): MapState {
    return {
      center: this.getCenter() ?? (this.config.center ?? [116.3974, 39.9093]),
      zoom: this.getZoom() ?? (this.config.zoom ?? 10),
    }
  }

  setState(state: Partial<MapState>): void {
    if (state.center) {
      this.setCenter(state.center[0], state.center[1])
    }
    if (state.zoom !== undefined) {
      this.setZoom(state.zoom)
    }
  }

  // ==================== 功能方法（默认实现：记录到管理器） ====================

  /**
   * 加载天地图底图。
   *
   * 默认实现：记录到 LayerManager。子类如需实际渲染，请 override 并先调用 super。
   *
   * @example
   * loadTianditu(key: string): void {
   *   super.loadTianditu(key)  // 记录到 LayerStore
   *   // ... 引擎实际渲染
   * }
   */
  loadTianditu(key: string): void {
    this.layerMgr.addTianditu(key)
  }

  /**
   * 添加绘制要素。
   *
   * 默认实现：记录到 OverlayManager。子类如需实际渲染，请 override 并先调用 super。
   */
  addFeature(feature: FeatureInfo): void {
    this.overlayMgr.add(feature)
  }

  /**
   * 清除所有绘制要素。
   *
   * 默认实现：清空 OverlayManager。子类如需实际清除，请 override 并先调用 super。
   */
  clearFeatures(): void {
    this.overlayMgr.clear()
  }

  // ==================== 交互式绘制（子类必须实现） ====================

  /**
   * 交互式绘制点。
   *
   * 单击地图完成绘制。
   *
   * @param options - 样式和回调选项
   * @returns 取消函数，调用后终止当前绘制
   */
  abstract drawPoint(options?: DrawOptions): () => void

  /**
   * 交互式绘制线。
   *
   * 点击地图添加顶点，双击结束绘制。
   *
   * @param options - 样式和回调选项
   * @returns 取消函数，调用后终止当前绘制
   */
  abstract drawLine(options?: DrawOptions): () => void

  /**
   * 交互式绘制面。
   *
   * 点击地图添加顶点，双击结束绘制。
   *
   * @param options - 样式和回调选项
   * @returns 取消函数，调用后终止当前绘制
   */
  abstract drawPolygon(options?: DrawOptions): () => void

  /**
   * 停止当前进行中的交互式绘制。
   */
  abstract stopDraw(): void

  // ==================== 管理器访问 ====================

  getLayerManager(): LayerManager {
    return this.layerMgr
  }

  getOverlayManager(): OverlayManager {
    return this.overlayMgr
  }

  // ==================== 恢复机制（复用操作入口，恢复即重放） ====================

  /** 恢复图层 — 直接复用 loadTianditu，子类 override 负责实际渲染 */
  restoreLayers(layers: LayerInfo[]): void {
    for (const layer of layers) {
      if (layer.type === 'tianditu') {
        this.loadTianditu(layer.key)
      }
    }
  }

  /** 恢复要素 — 直接复用 addFeature，子类 override 负责实际渲染 */
  restoreFeatures(features: FeatureInfo[]): void {
    for (const feature of features) {
      this.addFeature(feature)
    }
  }
}
