import type { BaseMap } from './BaseMap'

/**
 * MapPlugin — 地图功能插件接口。
 *
 * 将绘制、编辑、点选等功能从 BaseMap 的强制抽象方法中解放出来，
 * 变为可插拔扩展。引擎子类通过 getDefaultPlugins() 提供默认插件，
 * 保持向后兼容；高级用户可通过 use/unuse 动态增删功能。
 */
export interface MapPlugin {
  readonly name: string
  install(map: BaseMap): void
  uninstall?(map: BaseMap): void
}
