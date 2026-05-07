import * as Cesium from 'cesium'
import type { PopupOptions } from '@/types'

const POPUP_PREFIX = 'sdk-popup-'

function createPopupElement(content: string | HTMLElement): HTMLElement {
  const el = document.createElement('div')
  el.className = 'sdk-popup'
  el.style.cssText =
    'position:absolute;background:#fff;border-radius:4px;padding:12px 28px 12px 12px;box-shadow:0 2px 12px rgba(0,0,0,0.15);font-size:14px;color:#333;min-width:120px;max-width:300px;white-space:nowrap;pointer-events:auto;'

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

interface ActivePopup {
  element: HTMLElement
  position: [number, number]
  offset: [number, number]
}

/** 当前活跃的弹窗映射：viewer → {id → ActivePopup} */
const activePopups: WeakMap<Cesium.Viewer, Map<string, ActivePopup>> = new WeakMap()

/** postRender 监听器映射：viewer → 监听器函数 */
const postRenderListeners: WeakMap<Cesium.Viewer, () => void> = new WeakMap()

function getViewerPopups(viewer: Cesium.Viewer | null): Map<string, ActivePopup> {
  if (!viewer) return new Map()
  if (!activePopups.has(viewer)) {
    activePopups.set(viewer, new Map())
  }
  return activePopups.get(viewer)!
}

function updatePopupPositions(viewer: Cesium.Viewer): void {
  const popups = getViewerPopups(viewer)
  const containerRect = viewer.container.getBoundingClientRect()
  for (const [, popup] of popups) {
    const cartesian = Cesium.Cartesian3.fromDegrees(popup.position[0], popup.position[1])
    const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, cartesian)
    if (!screenPos) {
      popup.element.style.display = 'none'
      continue
    }
    // 检查是否在地球背面
    const cameraPos = viewer.camera.position
    const dot = Cesium.Cartesian3.dot(
      Cesium.Cartesian3.normalize(cameraPos, new Cesium.Cartesian3()),
      Cesium.Cartesian3.normalize(cartesian, new Cesium.Cartesian3())
    )
    if (dot < 0) {
      popup.element.style.display = 'none'
      continue
    }
    popup.element.style.display = 'block'
    const rect = popup.element.getBoundingClientRect()
    // window 坐标 → container 相对坐标
    const left = screenPos.x - containerRect.left - rect.width / 2 + popup.offset[0]
    const top = screenPos.y - containerRect.top - rect.height - 10 + popup.offset[1]
    popup.element.style.left = `${left}px`
    popup.element.style.top = `${top}px`
  }
}

function ensurePostRenderListener(viewer: Cesium.Viewer): void {
  if (postRenderListeners.has(viewer)) return
  const listener = () => updatePopupPositions(viewer)
  viewer.scene.postRender.addEventListener(listener)
  postRenderListeners.set(viewer, listener)
}

/**
 * Cesium 弹窗操作。
 */
export class CesiumPopup {
  /**
   * 显示弹窗。
   */
  static show(viewer: Cesium.Viewer | null, options: PopupOptions): void {
    if (!viewer) return
    const popups = getViewerPopups(viewer)
    const id = options.id ?? `${POPUP_PREFIX}${Date.now()}`

    // 如果已存在同 ID 弹窗，先移除
    CesiumPopup.hide(viewer, id)

    const el = createPopupElement(options.content)
    el.style.position = 'absolute'
    el.style.zIndex = '1000'

    const closeBtn = createCloseButton(() => {
      CesiumPopup.hide(viewer, id)
      options.onClose?.()
    })
    el.appendChild(closeBtn)

    viewer.container.appendChild(el)

    const popup: ActivePopup = {
      element: el,
      position: [options.position[0], options.position[1]],
      offset: options.offset ?? [0, -10],
    }
    popups.set(id, popup)

    ensurePostRenderListener(viewer)
    updatePopupPositions(viewer)
  }

  /**
   * 隐藏指定弹窗。
   */
  static hide(viewer: Cesium.Viewer | null, id: string): void {
    if (!viewer) return
    const popups = getViewerPopups(viewer)
    const popup = popups.get(id)
    if (popup) {
      popup.element.remove()
      popups.delete(id)
    }
  }

  /**
   * 清除所有弹窗。
   */
  static clear(viewer: Cesium.Viewer | null): void {
    if (!viewer) return
    const popups = getViewerPopups(viewer)
    for (const [, popup] of popups) {
      popup.element.remove()
    }
    popups.clear()
  }
}
