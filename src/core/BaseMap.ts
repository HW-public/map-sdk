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
 * 3. restoreLayers / restoreFeatures 使用映射表分发 — 新增图层/要素类型时
 *    只需注册对应的恢复函数，不需要修改 restore 方法本身
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

  /** 图层恢复函数映射表：type → 恢复函数 */
  private layerRestorers = new Map<string, (layer: LayerInfo) => void>()
  /** 要素恢复函数映射表：type → 恢复函数 */
  private featureRestorers = new Map<string, (feature: FeatureInfo) => void>()

  constructor(config: MapConfig) {
    this.container = getElement(config.container)
    this.config = config

    // 注册默认的恢复函数
    this.registerLayerRestorer('tianditu', (layer) => this.loadTianditu(layer.key))
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

  // ==================== 恢复机制（基于注册表，无需修改即可扩展） ====================

  /**
   * 注册图层恢复函数。
   *
   * 新增图层类型时，在子类构造函数中调用此方法注册恢复逻辑，
   * 不需要修改 restoreLayers 方法本身。
   *
   * @example
   * this.registerLayerRestorer('wms', (layer) => this.loadWMS(layer.url!, layer.layers!))
   */
  protected registerLayerRestorer(type: string, restorer: (layer: LayerInfo) => void): void {
    this.layerRestorers.set(type, restorer)
  }

  /**
   * 注册要素恢复函数。
   *
   * 新增要素类型时，在子类构造函数中调用此方法注册恢复逻辑，
   * 不需要修改 restoreFeatures 方法本身。
   */
  protected registerFeatureRestorer(type: string, restorer: (feature: FeatureInfo) => void): void {
    this.featureRestorers.set(type, restorer)
  }

  /** 恢复图层 — 通过映射表自动分发，支持任意扩展类型 */
  restoreLayers(layers: LayerInfo[]): void {
    for (const layer of layers) {
      const restorer = this.layerRestorers.get(layer.type)
      if (restorer) {
        restorer(layer)
      }
    }
  }

  /** 恢复要素 — 通过映射表自动分发，支持任意扩展类型 */
  restoreFeatures(features: FeatureInfo[]): void {
    for (const feature of features) {
      const restorer = this.featureRestorers.get(feature.type)
      if (restorer) {
        restorer(feature)
      }
    }
  }
}
