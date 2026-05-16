import type { BaseMap } from './BaseMap'

/**
 * MapPlugin — 地图功能插件接口。
 *
 * 将绘制、编辑、点选等功能从 BaseMap 的强制抽象方法中解放出来，
 * 变为可插拔扩展。引擎子类通过 getDefaultPlugins() 提供默认插件，
 * 保持向后兼容；高级用户可通过 use/unuse 动态增删功能。
 *
 * 特殊标记：
 * - `isToggleButton = true` 表示这是一个 2D/3D 切换按钮插件。
 *   BaseMap.use() 在单引擎模式下会静默跳过此类插件，避免渲染出
 *   点了也无法切换的"假"按钮。该标记取代了之前硬编码的 `name === 'toggle-button'`。
 */
export interface MapPlugin {
  readonly name: string
  install(map: BaseMap): void
  uninstall?(map: BaseMap): void
  /** 插件适用的引擎类型。未指定时默认为 'both'，表示所有引擎通用。 */
  readonly engine?: '2d' | '3d' | 'both'
}
