import type { MapConfig, MapEvent, SwitchToOptions } from '@/types'
import { BaseMap } from './BaseMap'
import { OlMap } from '@/ol'
import { CesiumMap } from '@/cesium'
import { ToggleButtonPlugin } from '@/ui'
import { StateManager } from '@/state'
import { createForwardingProxy } from '@/utils'

/**
 * MapSDK — 二三维地图的工厂入口。
 *
 * 职责范围：
 * 1. 根据配置创建 2D（OpenLayers）或 3D（Cesium）引擎实例
 * 2. both 模式下自动安装 ToggleButtonPlugin（2D/3D 切换按钮）
 * 3. 切换引擎时自动同步：地图状态 → 图层 → 绘制要素 → 跨切换事件监听
 * 4. 维护权威状态（StateManager），保证切换后视角不丢失
 * 5. 提供跨切换持久化的事件注册能力（on/off）
 *
 * 不做的事：
 * - 不直接提供 flyTo、setCenter、loadTianditu 等地图操作方法
 * - 不持有引擎实例引用以外的任何地图状态
 * - 不处理 DOM 细节（由 ToggleButtonPlugin 等 UI 插件处理）
 *
 * ==================== 使用文档 ====================
 *
 * 1) 单引擎模式（2D / 3D）— 返回值可直接推断出引擎独有方法
 *
 *    const map2d = await sdk.init({ type: '2d', container: 'map', ... })
 *    map2d.getOlMap()?.getView()          // 2D 独有方法
 *
 *    const map3d = await sdk.init({ type: '3d', container: 'map', ... })
 *    map3d.getViewer()?.camera.flyTo(...) // 3D 独有方法
 *
 * 2) both 模式 — 先以 2D 启动，自动挂载切换按钮
 *
 *    const map = await sdk.init({ type: 'both', container: 'map', ... })
 *    map.loadTianditu(KEY)
 *
 * 3) 手动切换 — 返回值根据 type 自动推断
 *
 *    const map3d = await sdk.switchTo('3d')
 *    map3d.getViewer()?.camera.flyTo(...)
 *
 *    const map2d = await sdk.switchTo('2d')
 *    map2d.getOlMap()?.getView()
 *
 * 4) 3D 独有方法调用（both 模式下获取当前实例）
 *
 *    const current = sdk.getMap()
 *    if (current instanceof CesiumMap) {
 *      current.getViewer()?.camera.setView(...)
 *    }
 *
 * 5) 跨切换持久化事件 — 切换后自动重新绑定
 *
 *    sdk.on('click', (e) => console.log(e.coordinate))
 */
export class MapSDK {
  private impl: BaseMap | null = null
  private togglePlugin: ToggleButtonPlugin | null = null
  private currentConfig: MapConfig | null = null
  private bothMode: boolean = false
  private stateMgr = new StateManager()
  /** 创建引擎实例（不恢复任何状态） */
  private async create(config: MapConfig): Promise<BaseMap> {
    if (config.type === '2d') {
      this.impl = new OlMap(config)
    } else if (config.type === '3d') {
      this.impl = new CesiumMap(config)
    } else {
      throw new Error(`Unsupported map type: ${config.type}`)
    }
    await this.impl.init()
    // 在默认插件已安装、即将进入 use(自定义插件) 阶段前打标，
    // 让 toggle 等 UI 插件在 install 时能据此决定是否渲染。
    this.impl.markBothMode(this.bothMode)
    return this.impl
  }

  /**
   * 初始化地图。
   *
   * @param config - 地图配置
   *   - type 为 '2d' / '3d'：创建对应单引擎实例，返回值可推断出引擎独有方法
   *   - type 为 'both'：先以 2D 初始化，并自动挂载切换按钮，返回 BaseMap
   * @returns 创建的引擎实例，类型根据 config.type 自动推断
   */
  async init(config: MapConfig & { type: '2d' }): Promise<OlMap>
  async init(config: MapConfig & { type: '3d' }): Promise<CesiumMap>
  async init(config: MapConfig & { type: 'both' }): Promise<BaseMap>
  async init(config: MapConfig): Promise<BaseMap> {
    this.currentConfig = { ...config }
    this.stateMgr.setState({
      center: config.center,
      zoom: config.zoom,
    })

    const isBoth = config.type === 'both'

    if (!isBoth) {
      this.destroy()
      this.bothMode = false
      await this.create(config)
      this.impl!.setState(this.stateMgr.getState())
      return createForwardingProxy<BaseMap>(() => this.getMap()) as OlMap | CesiumMap
    }

    this.bothMode = true
    await this.switchTo('2d')
    // both 模式下首次进入时安装切换按钮插件；后续切换由 switchTo 的迁移循环复用同一实例。
    this.togglePlugin = new ToggleButtonPlugin({
      onToggle: (t) => this.switchTo(t),
      initialType: '2d',
    })
    this.impl!.use(this.togglePlugin)
    return createForwardingProxy<BaseMap>(() => this.getMap()) as OlMap | CesiumMap;
  }

  /**
   * 在 2D 与 3D 之间切换。
   *
   * 切换流程：
   * 1. 捕获当前实例的实时状态、图层和绘制要素
   * 2. 销毁旧实例，创建新实例
   * 3. 恢复状态 → 恢复图层 → 恢复要素 → 恢复跨切换事件监听
   *
   * @param type - 目标引擎类型
   * @param options - 同步控制选项（可选，不传则全部同步）
   *   - state: 是否同步地图状态（中心点、缩放），默认 true
   *   - layers: 是否同步图层。可传 true（全部）或 string[]（按类型过滤，如 ['tianditu']），默认 true
   *   - features: 是否同步绘制要素，默认 true
   *   - events: 是否同步跨切换事件监听，默认 true
   *
   * @example
   * // 默认全部同步
   * await sdk.switchTo('3d')
   *
   * // 只同步状态，不恢复图层和要素
   * await sdk.switchTo('3d', { layers: false, features: false })
   *
   * // 只同步天地图图层
   * await sdk.switchTo('3d', { layers: ['tianditu'] })
   *
   * @returns 新的引擎实例，类型根据传入的 type 自动推断
   */
  async switchTo(type: '2d', options?: SwitchToOptions): Promise<OlMap>
  async switchTo(type: '3d', options?: SwitchToOptions): Promise<CesiumMap>
  async switchTo(type: '2d' | '3d', options?: SwitchToOptions): Promise<BaseMap>
  async switchTo(type: '2d' | '3d', options?: SwitchToOptions): Promise<BaseMap> {
    // 解析同步选项，默认全部开启（向后兼容）
    const syncState = options?.state !== false
    const syncFeatures = options?.features !== false
    const syncEvents = options?.events !== false
    const rawLayers = options?.layers
    const syncLayers = rawLayers !== false
    const layerFilter = Array.isArray(rawLayers) ? rawLayers : null
    const syncPopups = options?.popups !== false

    // === 捕获旧实例的实时状态（兜底用）===
    // 主路径现在走 extent 同步，但 stateMgr 仍需最新数据作为 fallback，
    // 且后续步骤9恢复跨切换事件监听依赖 stateMgr。
    const liveState = this.impl?.getState()
    if (liveState) {
      this.stateMgr.setState(liveState)
    }

    // === 捕获旧实例的图层、绘制要素与视图范围 ===
    // LayerManager 记录了用户通过 loadTianditu 添加的所有底图，
    // OverlayManager 记录了通过 addFeature 添加的所有绘制要素（点、线、面）。
    const layers = this.impl?.getLayerManager().getAll() ?? []
    const features = this.impl?.getOverlayManager().getAll() ?? []
    const popups = this.impl?.getPopupManager().getAll() ?? []
    const oldExtent =
      this.impl instanceof OlMap
        ? this.impl.getViewportExtent()
        : this.impl instanceof CesiumMap
          ? this.impl.getViewportExtent()
          : undefined

    // 保存旧实例引用用于后续插件迁移
    const oldImpl = this.impl

    // === 销毁旧实例 ===
    // 释放引擎占用的资源（canvas、DOM、事件监听、网络请求等），
    // 防止内存泄漏。销毁后 this.impl 置为 null，避免后续误用。
    if (this.impl) {
      this.impl.destroy()
      this.impl = null
    }

    // === 检查配置可用性 ===
    // currentConfig 在 destroy() 时会被清空，如果此时调用 switchTo 则无配置可用。
    if (!this.currentConfig) {
      throw new Error('No config available for map switch')
    }

    // === 创建新引擎实例 ===
    // 基于原始配置，将 type 替换为目标类型（2d → OlMap，3d → CesiumMap）。
    const config = { ...this.currentConfig, type }
    this.impl = await this.create(config)

    // === 恢复地图状态 ===
    // 双向切换都优先用 extent 同步，绕过 zoom/height 公式换算的累积误差。
    if (syncState) {
      if (oldExtent && this.impl instanceof CesiumMap) {
        this.impl.fitViewportExtent(oldExtent)
      } else if (oldExtent && this.impl instanceof OlMap) {
        this.impl.fitViewportExtent(oldExtent)
      } else {
        this.impl!.setState(this.stateMgr.getState())
      }
    }

    // === 恢复图层 ===
    // 遍历步骤 2 捕获的 LayerInfo 列表，根据类型调用对应加载方法。
    // 支持按类型过滤：options.layers 为 string[] 时只恢复指定类型的图层。
    if (syncLayers) {
      const filteredLayers = layerFilter
        ? layers.filter((l) => l.type && layerFilter.includes(l.type))
        : layers
      this.impl!.restoreLayers(filteredLayers)
    }

    // === 恢复绘制要素 ===
    // 遍历步骤 2 捕获的 FeatureInfo 列表，在新实例上重新绘制。
    if (syncFeatures) {
      this.impl!.restoreFeatures(features)
    }

    // === 恢复弹窗 ===
    // 遍历步骤 2 捕获的 PopupOptions 列表，在新实例上重新显示。
    if (syncPopups) {
      this.impl!.restorePopups(popups)
    }

    // === 迁移用户自定义插件 ===
    // 新实例创建时已通过 getDefaultPlugins() 安装引擎专属的默认插件，
    // 这里只迁移旧实例上「不在新实例默认列表里」的用户自定义插件，
    // 避免把 OL 专属插件错装到 Cesium 上（同名 use 会先 unuse 现有的）。
    const existingNames = new Set(this.impl!.getPlugins().map((p) => p.name))
    for (const plugin of oldImpl?.getPlugins() ?? []) {
      if (!existingNames.has(plugin.name)) {
        this.impl!.use(plugin)
      }
    }

    // === 恢复跨切换持久化事件监听 ===
    // 用户通过 sdk.on() 注册的事件会被 StateManager 缓存，
    // 切换后需要重新绑定到新实例上，否则事件将失效。
    if (syncEvents) {
      for (const [event, handlers] of this.stateMgr.getEventHandlers()) {
        for (const handler of handlers) {
          this.impl!.on(event, handler)
        }
      }
    }

    // === 更新切换按钮 ===
    // both 模式下右上角有切换按钮，需要更新按钮文字
    //（当前为 2D 时显示 "3D"，当前为 3D 时显示 "2D"）。
    // 按钮 DOM 由 ToggleButtonPlugin 在 init('both') 时挂载并随迁移循环延续；
    // 这里只触发新实例上的 updateToggleButton 方法以同步文字。
    if (this.bothMode) {
      ;(this.impl as any).updateToggleButton?.(type)
    }

    // === 返回代理对象（始终指向当前活跃实例） ===
    return createForwardingProxy<BaseMap>(() => this.getMap()) as OlMap | CesiumMap
  }

  /**
   * 注册跨切换持久化的事件监听。
   *
   * 通过 SDK 注册的事件会在 2D/3D 切换后自动重新绑定到新实例上，
   * 不需要手动注销和重新注册。
   *
   * @param event - 事件名，如 'click'、'mousemove'
   * @param callback - 事件回调
   */
  on(event: string, callback: (e: MapEvent) => void): void {
    this.stateMgr.on(event, callback)
    this.impl?.on(event, callback)
  }

  /**
   * 注销跨切换持久化的事件监听。
   *
   * @param event - 事件名
   * @param callback - 要注销的回调（必须与注册时是同一个引用）
   */
  off(event: string, callback: (e: MapEvent) => void): void {
    this.stateMgr.off(event, callback)
    this.impl?.off(event, callback)
  }

  /**
   * 销毁 SDK 及当前引擎实例。
   *
   * 清除所有状态、图层、要素、事件缓存，并移除切换按钮。
   */
  destroy(): void {
    this.bothMode = false
    this.currentConfig = null
    this.stateMgr.reset()
    if (this.impl && this.togglePlugin) {
      this.impl.unuse('toggle-button')
    }
    this.togglePlugin = null
    if (this.impl) {
      this.impl.destroy()
      this.impl = null
    }
  }

  /**
   * 获取当前引擎实例。
   *
   * 切换后需要重新调用以获取最新实例；如果始终持有 init/switchTo 返回的引用，
   * 则不需要使用此方法。
   *
   * @returns 当前活动的引擎实例，未初始化时返回 null
   */
  getMap(): BaseMap | null {
    return this.impl
  }
}

export { OlMap, CesiumMap }
