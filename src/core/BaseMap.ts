import type { IMap, MapConfig, MapEvent, MapState, LayerInfo, TiandituLayerInfo, FeatureInfo, DrawOptions, PopupOptions } from '@/types'
import { getElement } from '@/utils'
import { LayerManager, OverlayManager, PopupManager } from '@/state'

/**
 * BaseMap — 二三维引擎的公共抽象基类。
 *
 * 设计原则：
 * 1. 核心服务方法（setCenter/flyTo/on/off 等）保持 abstract — 所有引擎必须实现
 * 2. 功能方法（loadTianditu/addFeature/clearFeatures）提供默认实现 —
 *    自动记录到 LayerManager/OverlayManager，引擎渲染部分由子类 override 补充
 * 3. 图层恢复：BaseMap 提供 addLayer 统一流程（记录 + 触发渲染），
 *    子类通过 loadLayer 用 switch 分发到具体模块
 * 4. 要素恢复：直接复用 addFeature，子类 override 负责实际渲染
 *
 * 新增图层类型时的步骤：
 * - 加模块文件（如 addWms.ts）
 * - OlMap.loadLayer / CesiumMap.loadLayer 各加一行 case
 * - BaseMap 和 restoreLayers 一行不动
 */
export abstract class BaseMap implements IMap {
  protected container: HTMLElement
  protected config: MapConfig
  protected layerMgr = new LayerManager()
  protected overlayMgr = new OverlayManager()
  protected popupMgr = new PopupManager()

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
   * 添加图层 — 统一流程：记录到 LayerManager，再触发子类渲染。
   *
   * 子类通过实现 loadLayer 完成具体渲染。
   */
  private addLayer(layer: LayerInfo): void {
    this.layerMgr.add(layer)
    this.loadLayer(layer)
  }

  /**
   * 根据 ID 移除指定图层。
   *
   * 默认实现：从 LayerManager 移除。子类如需实际清除，请 override 并先调用 super。
   */
  removeLayer(id: string): void {
    this.layerMgr.remove(id)
  }

  /** 子类实现：根据 layer.type 用 switch 分发到具体渲染模块 */
  protected abstract loadLayer(layer: LayerInfo): void

  /** 加载天地图底图 — 公共 API 糖衣，内部自动补 type */
  loadTianditu(key: string, id: string): void {
    this.addLayer({ type: 'tianditu', key, id } as TiandituLayerInfo)
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
   * 根据 ID 移除指定要素。
   *
   * 默认实现：从 OverlayManager 移除。子类如需实际清除，请 override 并先调用 super。
   */
  removeFeature(id: string): void {
    this.overlayMgr.remove(id)
  }

  /**
   * 根据 ID 更新指定要素的样式。
   *
   * 默认实现：更新 OverlayManager 中的样式记录。子类如需实际渲染，请 override 并先调用 super。
   */
  updateFeature(id: string, style: Record<string, unknown>): void {
    this.overlayMgr.update(id, { style })
  }

  /**
   * 清除所有绘制要素。
   *
   * 默认实现：清空 OverlayManager。子类如需实际清除，请 override 并先调用 super。
   */
  clearFeatures(): void {
    this.overlayMgr.clear()
  }

  // ==================== 弹窗（默认实现：记录到管理器） ====================

  /**
   * 显示信息弹窗。
   *
   * 默认实现：记录到 PopupManager。子类如需实际渲染，请 override 并先调用 super。
   */
  showPopup(options: PopupOptions): void {
    this.popupMgr.add(options)
  }

  /**
   * 隐藏指定弹窗。
   *
   * 默认实现：从 PopupManager 移除。子类如需实际清除，请 override 并先调用 super。
   */
  hidePopup(id: string): void {
    this.popupMgr.remove(id)
  }

  /**
   * 清除所有弹窗。
   *
   * 默认实现：清空 PopupManager。子类如需实际清除，请 override 并先调用 super。
   */
  clearPopups(): void {
    this.popupMgr.clear()
  }

  /**
   * 恢复弹窗 — 遍历重放 showPopup，子类 showPopup 负责具体渲染。
   */
  restorePopups(popups: PopupOptions[]): void {
    for (const popup of popups) {
      this.showPopup(popup)
    }
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

  getPopupManager(): PopupManager {
    return this.popupMgr
  }

  // ==================== 恢复机制（复用操作入口，恢复即重放） ====================

  /** 恢复图层 — 遍历重放 addLayer，子类 loadLayer 负责具体渲染 */
  restoreLayers(layers: LayerInfo[]): void {
    for (const layer of layers) {
      this.addLayer(layer)
    }
  }

  /** 恢复要素 — 直接复用 addFeature，子类 override 负责实际渲染 */
  restoreFeatures(features: FeatureInfo[]): void {
    for (const feature of features) {
      this.addFeature(feature)
    }
  }
}
