import type { IMap, MapConfig, MapEvent, MapState, LayerInfo, TiandituLayerInfo, FeatureInfo, DrawOptions, PopupOptions, PickResult, EditOptions, MeasureDistanceOptions, MeasureAreaOptions } from '@/types'
import { getElement } from '@/utils'
import { LayerManager, OverlayManager, PopupManager } from '@/state'
import type { MapPlugin } from './Plugin'

/**
 * BaseMap — 二三维引擎的公共抽象基类。
 *
 * 架构分层（三类方法，界限分明）：
 *
 * 1. IMap 核心服务（abstract）— 生命周期、视角、事件、状态
 *    所有引擎必须实现，否则编译不通过。
 *
 * 2. 基础功能（基类提供默认实现，子类可 override）— 图层、要素、弹窗
 *    默认实现负责状态管理（LayerManager/OverlayManager/PopupManager）。
 *    引擎子类 override 时必须先调用 super，再补充渲染逻辑。
 *
 * 3. 可选扩展（由插件动态挂载）— 绘制、编辑、点选、测量
 *    不安装插件时调用会抛错提示。引擎通过 getDefaultPlugins() 控制默认安装哪些。
 *
 * 新增图层类型时的步骤：
 * - 加模块文件（如 addWms.ts）
 * - OlMap.loadLayer / CesiumMap.loadLayer 各加一行 case
 * - BaseMap 和 restoreLayers 一行不动
 */
export abstract class BaseMap implements IMap {
  protected container: HTMLElement
  protected config: MapConfig
  protected overlayMgr = new OverlayManager()
  protected popupMgr = new PopupManager()
  protected layerMgr = new LayerManager()
  private _plugins = new Map<string, MapPlugin>()

  protected constructor(config: MapConfig) {
    this.container = getElement(config.container)
    this.config = config
  }

  // ==================== 1. IMap 核心服务（子类必须实现） ====================

  abstract init(): Promise<void> | void
  abstract destroy(): void
  abstract setCenter(lon: number, lat: number): void
  abstract getCenter(): [number, number] | undefined
  abstract setZoom(zoom: number): void
  abstract getZoom(): number | undefined
  abstract flyTo(lon: number, lat: number, zoom?: number): void
  abstract on(event: string, callback: (e: MapEvent) => void): void
  abstract off(event: string, callback: (e: MapEvent) => void): void

  // ==================== 2. 状态管理（基类默认实现） ====================

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

  // ==================== 3. 图层操作（基类默认实现，子类 override 渲染） ====================

  /** 引擎内部钩子：根据 layer.type 用 switch 分发到具体渲染模块 */
  protected abstract loadLayer(layer: LayerInfo): void

  addLayer(layer: LayerInfo): void {
    this.layerMgr.add(layer)
    this.loadLayer(layer)
    if (layer.id) {
      if (layer.visible !== undefined) this.setLayerVisible(layer.id, layer.visible)
      if (layer.opacity !== undefined) this.setLayerOpacity(layer.id, layer.opacity)
    }
  }

  removeLayer(id: string): void {
    this.layerMgr.remove(id)
  }

  setLayerVisible(id: string, visible: boolean): void {
    this.layerMgr.setVisible(id, visible)
  }

  setLayerOpacity(id: string, opacity: number): void {
    this.layerMgr.setOpacity(id, opacity)
  }

  loadTianditu(key: string, id: string): void {
    this.addLayer({ type: 'tianditu', key, id } as TiandituLayerInfo)
  }

  restoreLayers(layers: LayerInfo[]): void {
    for (const layer of layers) {
      this.addLayer(layer)
    }
  }

  getLayerManager(): LayerManager {
    return this.layerMgr
  }

  // ==================== 4. 绘制要素（基类默认记录，子类 override 渲染） ====================

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

  /** 恢复要素 — 遍历重放 addFeature，子类 override 负责实际渲染 */
  restoreFeatures(features: FeatureInfo[]): void {
    for (const feature of features) {
      this.addFeature(feature)
    }
  }

  // ==================== 5. 弹窗（基类默认记录，子类 override 渲染） ====================

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

  /** 恢复弹窗 — 遍历重放 showPopup，子类 showPopup 负责具体渲染 */
  restorePopups(popups: PopupOptions[]): void {
    for (const popup of popups) {
      this.showPopup(popup)
    }
  }

  // ==================== 6. 插件系统 ====================

  /**
   * 注册功能插件。
   *
   * 插件通过动态挂载方法扩展地图能力（绘制、编辑、点选等）。
   * 同名插件重复安装时会先卸载旧实例。
   */
  use(plugin: MapPlugin): BaseMap {
    if (this._plugins.has(plugin.name)) {
      this.unuse(plugin.name)
    }
    this._plugins.set(plugin.name, plugin)
    plugin.install(this)
    return this
  }

  /**
   * 卸载指定插件。
   */
  unuse(name: string): BaseMap {
    const plugin = this._plugins.get(name)
    if (plugin?.uninstall) {
      plugin.uninstall(this)
    }
    this._plugins.delete(name)
    return this
  }

  /** 获取当前已安装的所有插件 */
  getPlugins(): MapPlugin[] {
    return Array.from(this._plugins.values())
  }

  /** 子类提供默认插件列表，init 后自动安装 */
  protected abstract getDefaultPlugins(): MapPlugin[]

  /** 安装默认插件，由子类在 init() 完成后调用 */
  protected installDefaultPlugins(): void {
    for (const plugin of this.getDefaultPlugins()) {
      this.use(plugin)
    }
  }

  // ==================== 7. 可选功能扩展（由插件提供） ====================

  /** 未安装 DrawPlugin 时抛错提示 */
  drawPoint(_options?: DrawOptions): () => void {
    throw new Error('DrawPlugin not installed. Call map.use(new DrawPlugin()) first.')
  }

  drawLine(_options?: DrawOptions): () => void {
    throw new Error('DrawPlugin not installed. Call map.use(new DrawPlugin()) first.')
  }

  drawPolygon(_options?: DrawOptions): () => void {
    throw new Error('DrawPlugin not installed. Call map.use(new DrawPlugin()) first.')
  }

  stopDraw(): void {
    throw new Error('DrawPlugin not installed. Call map.use(new DrawPlugin()) first.')
  }

  /** 未安装 PickPlugin 时抛错提示 */
  pickAtPixel(_pixel: [number, number]): PickResult[] {
    throw new Error('PickPlugin not installed. Call map.use(new PickPlugin()) first.')
  }

  /** 未安装 EditPlugin 时抛错提示 */
  editFeature(_id: string, _options?: EditOptions): () => void {
    throw new Error('EditPlugin not installed. Call map.use(new EditPlugin()) first.')
  }

  /** 未安装 MeasurePlugin 时抛错提示 */
  measureDistance(_options?: MeasureDistanceOptions): () => void {
    throw new Error('MeasurePlugin not installed. Call map.use(new MeasurePlugin()) first.')
  }

  measureArea(_options?: MeasureAreaOptions): () => void {
    throw new Error('MeasurePlugin not installed. Call map.use(new MeasurePlugin()) first.')
  }

  // ==================== 8. 管理器访问 ====================

  getOverlayManager(): OverlayManager {
    return this.overlayMgr
  }

  getPopupManager(): PopupManager {
    return this.popupMgr
  }
}
