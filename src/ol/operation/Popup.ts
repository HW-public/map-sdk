import type { Map } from 'ol'
import type { PopupOptions } from '@/types'
import Overlay from 'ol/Overlay'
import { fromLonLat } from 'ol/proj'

const POPUP_PREFIX = 'sdk-popup-'

function createPopupElement(content: string | HTMLElement): HTMLElement {
  const el = document.createElement('div')
  el.className = 'sdk-popup'
  el.style.cssText =
    'position:absolute;background:#fff;border-radius:4px;padding:12px 28px 12px 12px;box-shadow:0 2px 12px rgba(0,0,0,0.15);font-size:14px;color:#333;min-width:120px;max-width:300px;white-space:nowrap;transform:translate(-50%,-100%);'

  const contentEl = document.createElement('div')
  contentEl.className = 'sdk-popup-content'
  if (typeof content === 'string') {
    contentEl.innerHTML = content
  } else {
    contentEl.appendChild(content)
  }
  el.appendChild(contentEl)

  const arrow = document.createElement('div')
  arrow.style.cssText =
    'position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid #fff;'
  el.appendChild(arrow)

  return el
}

function createCloseButton(onClose: () => void): HTMLElement {
  const btn = document.createElement('span')
  btn.innerHTML = '&times;'
  btn.style.cssText =
    'position:absolute;top:4px;right:8px;cursor:pointer;font-size:18px;color:#999;line-height:1;'
  btn.addEventListener('click', onClose)
  return btn
}

/** 当前活跃的弹窗映射 */
const activePopups: WeakMap<object, globalThis.Map<string, Overlay>> = new WeakMap()

function getMapPopups(map: Map | null): globalThis.Map<string, Overlay> {
  if (!map) return new globalThis.Map()
  if (!activePopups.has(map)) {
    activePopups.set(map, new globalThis.Map())
  }
  return activePopups.get(map)!
}

/**
 * OpenLayers 弹窗操作。
 */
export class OlPopup {
  /**
   * 显示弹窗。
   */
  static show(map: Map | null, options: PopupOptions): void {
    if (!map) return
    const popups = getMapPopups(map)
    const id = options.id ?? `${POPUP_PREFIX}${Date.now()}`

    // 如果已存在同 ID 弹窗，先移除
    OlPopup.hide(map, id)

    const el = createPopupElement(options.content)
    const closeBtn = createCloseButton(() => {
      OlPopup.hide(map, id)
      options.onClose?.()
    })
    el.appendChild(closeBtn)

    const overlay = new Overlay({
      element: el,
      position: fromLonLat(options.position),
      offset: options.offset ?? [0, -10],
      stopEvent: true,
    })

    map.addOverlay(overlay)
    popups.set(id, overlay)
  }

  /**
   * 隐藏指定弹窗。
   */
  static hide(map: Map | null, id: string): void {
    if (!map) return
    const popups = getMapPopups(map)
    const overlay = popups.get(id)
    if (overlay) {
      map.removeOverlay(overlay)
      popups.delete(id)
    }
  }

  /**
   * 清除所有弹窗。
   */
  static clear(map: Map | null): void {
    if (!map) return
    const popups = getMapPopups(map)
    for (const [, overlay] of popups) {
      map.removeOverlay(overlay)
    }
    popups.clear()
  }
}
