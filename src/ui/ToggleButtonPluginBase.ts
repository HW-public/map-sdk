import type { BaseMap, MapPlugin } from '@/core'

export type ToggleType = '2d' | '3d'

export interface ToggleButtonBaseOptions {
  /** 切换按钮被点击时触发，参数为目标引擎类型。不传时自动使用 map.switchTo（MapSDK 在 both 模式下注入） */
  onToggle?: (type: ToggleType) => unknown
  /** 初始引擎类型，默认 '2d' */
  initialType?: ToggleType
}

/**
 * ToggleButtonPluginBase — 2D/3D 切换按钮的抽象基类。
 *
 * 自定义切换按钮只需继承此类并实现三个抽象方法即可，
 * `name = 'toggle-button'`、`isToggleButton = true`、
 * `onToggle` 延迟解析和 `updateToggleButton` 挂载由基类统一处理。
 *
 * 契约（基类已包办前两条）：
 * 1. `name = 'toggle-button'` — 同名替换默认实现
 * 2. `isToggleButton = true` — 单引擎模式下自动跳过
 * 3. install 幂等 — 子类负责保证 DOM 只创建一次
 * 4. 暴露 `updateToggleButton` — 基类自动挂到 map 上
 */
export abstract class ToggleButtonPluginBase implements MapPlugin {
  readonly name = 'toggle-button'
  readonly isToggleButton = true

  protected onToggle: ((type: ToggleType) => unknown) | null = null
  protected current: ToggleType

  constructor(options: ToggleButtonBaseOptions = {}) {
    this.onToggle = options.onToggle ?? null
    this.current = options.initialType ?? '2d'
  }

  install(map: BaseMap): void {
    // 延迟解析 onToggle：构造时未传则从 map.switchTo 获取（MapSDK 注入）
    if (!this.onToggle) {
      const fallback = (map as any).switchTo as ((type: ToggleType) => unknown) | undefined
      if (fallback) this.onToggle = fallback
    }
    if (!this.onToggle) {
      throw new Error(`${this.constructor.name}: onToggle is required when MapSDK did not inject switchTo.`)
    }

    this.onInstall(map)

    // 暴露 updateToggleButton 供 MapSDK 同步状态
    ;(map as any).updateToggleButton = (type: ToggleType) => {
      this.current = type
      this.onUpdateState(type)
    }
  }

  uninstall(map: BaseMap): void {
    this.onUninstall(map)
    delete (map as any).updateToggleButton
  }

  /** 触发切换：调用当前存储的 onToggle，目标类型与当前相反 */
  protected triggerToggle(): void {
    const target: ToggleType = this.current === '2d' ? '3d' : '2d'
    this.onToggle!(target)
  }

  /** 子类实现：首次 install 时创建并挂载 DOM */
  protected abstract onInstall(map: BaseMap): void

  /** 子类实现：uninstall 时清理 DOM */
  protected abstract onUninstall(map: BaseMap): void

  /** 子类实现：SDK 切换引擎后更新按钮视觉状态 */
  protected abstract onUpdateState(type: ToggleType): void
}
