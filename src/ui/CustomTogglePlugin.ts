import type { BaseMap } from '@/core'
import { ToggleButtonPluginBase, type ToggleType } from './ToggleButtonPluginBase'

export interface CustomTogglePluginOptions {
  /** 按钮被点击时触发，参数为目标引擎类型。不传时自动使用 map.switchTo（MapSDK 在 both 模式下注入） */
  onToggle?: (type: ToggleType) => unknown
  /** 初始引擎类型，默认 '2d' */
  initialType?: ToggleType
}

const STYLE_ID = 'map-sdk-custom-toggle-style'

const CSS = `
.map-sdk-custom-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.18);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  padding: 4px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  user-select: none;
}
.map-sdk-custom-toggle__slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #4f8ef7 0%, #6db3f2 100%);
  border-radius: 999px;
  box-shadow: 0 2px 10px rgba(79, 142, 247, 0.55);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
              background 0.28s ease,
              box-shadow 0.28s ease;
}
.map-sdk-custom-toggle--3d .map-sdk-custom-toggle__slider {
  transform: translateX(100%);
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  box-shadow: 0 2px 10px rgba(249, 115, 22, 0.55);
}
.map-sdk-custom-toggle__seg {
  position: relative;
  z-index: 1;
  min-width: 36px;
  padding: 6px 14px;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition: color 0.25s ease;
}
.map-sdk-custom-toggle__seg--active {
  color: #fff;
}
.map-sdk-custom-toggle__seg:not(.map-sdk-custom-toggle__seg--active):hover {
  color: rgba(255, 255, 255, 0.85);
}
`

/**
 * CustomTogglePlugin — 滑块式 2D/3D 切换按钮（自定义按钮插件）。
 *
 * 这是 ToggleButtonPlugin 的另一种 UI 实现，演示如何编写一个自定义的
 * 切换按钮：继承 ToggleButtonPluginBase 即可，name / isToggleButton /
 * onToggle 解析和 updateToggleButton 挂载由基类处理。
 *
 * 视觉风格：胶囊形分段控件，激活态滑块平滑滑动并切换渐变色（2D 蓝、3D 橙），
 * 自带 backdrop-filter 玻璃质感，CSS 在首次 install 时自动注入到 document.head。
 *
 * 与 ToggleButtonPlugin 互斥（共用 name='toggle-button'）：
 * - both 模式下手动 use 自身，会自动顶替 MapSDK 已安装的默认 ToggleButtonPlugin。
 * - 单引擎模式下，BaseMap.use 会按 isToggleButton 标记静默跳过（不渲染、不存储），
 *   所以即使误用也不会在 init({ type: '2d' }) / init({ type: '3d' }) 下出现假按钮。
 *
 * @example
 * import { CustomTogglePlugin } from '@/ui'
 *
 * const map = await sdk.init({ type: 'both', container: 'map', ... })
 * map.use(new CustomTogglePlugin())   // onToggle 由 MapSDK 自动注入
 */
export class CustomTogglePlugin extends ToggleButtonPluginBase {
  private wrap: HTMLElement | null = null
  private seg2d: HTMLElement | null = null
  private seg3d: HTMLElement | null = null

  constructor(options: CustomTogglePluginOptions = {}) {
    super(options)
  }

  protected onInstall(map: BaseMap): void {
    this.injectStyle()

    if (!this.wrap) {
      const wrap = document.createElement('div')
      wrap.className = 'map-sdk-custom-toggle'

      const slider = document.createElement('div')
      slider.className = 'map-sdk-custom-toggle__slider'

      const seg2d = document.createElement('div')
      seg2d.className = 'map-sdk-custom-toggle__seg'
      seg2d.textContent = '2D'
      seg2d.addEventListener('click', () => {
        if (this.current !== '2d') this.triggerToggle()
      })

      const seg3d = document.createElement('div')
      seg3d.className = 'map-sdk-custom-toggle__seg'
      seg3d.textContent = '3D'
      seg3d.addEventListener('click', () => {
        if (this.current !== '3d') this.triggerToggle()
      })

      wrap.append(slider, seg2d, seg3d)
      map.getContainer().appendChild(wrap)

      this.wrap = wrap
      this.seg2d = seg2d
      this.seg3d = seg3d
      this.applyState(this.current)
    }
  }

  protected onUninstall(_map: BaseMap): void {
    if (this.wrap) {
      this.wrap.remove()
      this.wrap = null
      this.seg2d = null
      this.seg3d = null
    }
  }

  protected onUpdateState(type: ToggleType): void {
    this.applyState(type)
  }

  private applyState(type: ToggleType): void {
    this.wrap?.classList.toggle('map-sdk-custom-toggle--3d', type === '3d')
    this.seg2d?.classList.toggle('map-sdk-custom-toggle__seg--active', type === '2d')
    this.seg3d?.classList.toggle('map-sdk-custom-toggle__seg--active', type === '3d')
  }

  private injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
  }
}
