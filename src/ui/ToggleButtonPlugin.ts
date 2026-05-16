import type { BaseMap } from '@/core'
import { ToggleButtonPluginBase, type ToggleType } from './ToggleButtonPluginBase'

export interface ToggleButtonOptions {
  /** 切换按钮被点击时触发，参数为目标引擎类型。不传时自动使用 map.switchTo（MapSDK 在 both 模式下注入） */
  onToggle?: (type: ToggleType) => unknown
  /** 初始引擎类型，决定按钮初次显示的目标文本（默认 '2d' → 显示 '3D'） */
  initialType?: ToggleType
  /** 自定义按钮 className，默认 'map-toggle-btn' */
  className?: string
}

/**
 * ToggleButtonPlugin — 2D/3D 切换按钮插件（默认实现）。
 *
 * 通常由 MapSDK 在 `both` 模式下自动安装，不需要用户手动 use；
 * 如需关闭，可在 init('both') 后调用 `map.unuse('toggle-button')`。
 *
 * 继承自 ToggleButtonPluginBase，name / isToggleButton / onToggle 解析
 * 和 updateToggleButton 挂载均由基类处理，本类只负责默认按钮的 DOM 实现。
 */
export class ToggleButtonPlugin extends ToggleButtonPluginBase {
  private btn: HTMLElement | null = null
  private readonly className: string

  constructor(options: ToggleButtonOptions = {}) {
    super(options)
    this.className = options.className ?? 'map-toggle-btn'
  }

  protected onInstall(map: BaseMap): void {
    if (!this.btn) {
      const container = map.getContainer()
      const btn = document.createElement('div')
      btn.className = this.className
      btn.textContent = this.targetText(this.current)
      btn.addEventListener('click', () => this.triggerToggle())
      container.appendChild(btn)
      this.btn = btn
    }
  }

  protected onUninstall(_map: BaseMap): void {
    if (this.btn) {
      this.btn.remove()
      this.btn = null
    }
  }

  protected onUpdateState(type: ToggleType): void {
    if (this.btn) {
      this.btn.textContent = this.targetText(type)
    }
  }

  private targetText(currentType: ToggleType): string {
    return currentType === '2d' ? '3D' : '2D'
  }
}
