import type { BaseMap, MapPlugin } from '@/core'

export type ToggleType = '2d' | '3d'

export interface ToggleButtonOptions {
  /** 切换按钮被点击时触发，参数为目标引擎类型 */
  onToggle: (type: ToggleType) => unknown
  /** 初始引擎类型，决定按钮初次显示的目标文本（默认 '2d' → 显示 '3D'） */
  initialType?: ToggleType
  /** 自定义按钮 className，默认 'map-toggle-btn' */
  className?: string
}

/**
 * ToggleButtonPlugin — 2D/3D 切换按钮插件。
 *
 * 通常由 MapSDK 在 `both` 模式下自动安装，不需要用户手动 use；
 * 如需关闭，可在 init('both') 后调用 `map.unuse('toggle-button')`。
 *
 * 设计要点：
 * - `name = 'toggle-button'` 是约定的"魔法名"：BaseMap.use 在单引擎模式
 *   （非 both 模式）下会静默跳过这个 name 的插件，所以即使用户手动 use
 *   切换按钮，单引擎模式下也不会渲染。该拦截在 BaseMap 层完成，
 *   插件自身无需判断 isBothMode。
 * - 按钮 DOM 挂载到地图容器（map.getContainer()）上，跨引擎切换持久存在。
 * - install 是幂等的：插件实例随引擎切换迁移到新 BaseMap 时，
 *   不会重复创建按钮，只把 updateToggleButton 方法重新挂到新实例上。
 * - 通过 `(map as any).updateToggleButton(type)` 由 MapSDK 调用以更新按钮文字。
 */
export class ToggleButtonPlugin implements MapPlugin {
  readonly name = 'toggle-button'
  private btn: HTMLElement | null = null
  private currentType: ToggleType
  private readonly onToggle: (type: ToggleType) => unknown
  private readonly className: string

  constructor(options: ToggleButtonOptions) {
    this.onToggle = options.onToggle
    this.currentType = options.initialType ?? '2d'
    this.className = options.className ?? 'map-toggle-btn'
  }

  install(map: BaseMap): void {
    if (!this.btn) {
      const container = map.getContainer()
      const btn = document.createElement('div')
      btn.className = this.className
      btn.textContent = this.targetText(this.currentType)
      btn.addEventListener('click', () => {
        const target: ToggleType = this.currentType === '2d' ? '3d' : '2d'
        this.onToggle(target)
      })
      container.appendChild(btn)
      this.btn = btn
    }

    ;(map as any).updateToggleButton = (type: ToggleType) => this.updateText(type)
  }

  uninstall(map: BaseMap): void {
    if (this.btn) {
      this.btn.remove()
      this.btn = null
    }
    delete (map as any).updateToggleButton
  }

  private updateText(type: ToggleType): void {
    this.currentType = type
    if (this.btn) {
      this.btn.textContent = this.targetText(type)
    }
  }

  private targetText(currentType: ToggleType): string {
    return currentType === '2d' ? '3D' : '2D'
  }
}
