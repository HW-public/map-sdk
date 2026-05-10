import type { BaseMap, MapPlugin } from '@/core'
import type { PopupOptions } from '@/types'
import { CesiumPopup } from '@/cesium/operation'

export class CesiumPopupPlugin implements MapPlugin {
  readonly name = 'popup'

  install(map: BaseMap): void {
    const viewer = (map as any).getViewer?.() as import('cesium').Viewer | null
    const m = map as any

    m.showPopup = (options: PopupOptions): void => {
      const id = options.id ?? `sdk-popup-${Date.now()}`
      const opts = { ...options, id }
      map.getPopupManager().add(opts)
      CesiumPopup.show(viewer, {
        ...opts,
        onClose: () => {
          map.getPopupManager().remove(id)
          options.onClose?.()
        },
      })
    }

    m.hidePopup = (id: string): void => {
      map.getPopupManager().remove(id)
      CesiumPopup.hide(viewer, id)
    }

    m.clearPopups = (): void => {
      map.getPopupManager().clear()
      CesiumPopup.clear(viewer)
    }
  }

  uninstall(map: BaseMap): void {
    const viewer = (map as any).getViewer?.() as import('cesium').Viewer | null
    CesiumPopup.clear(viewer)
    const m = map as any
    delete m.showPopup
    delete m.hidePopup
    delete m.clearPopups
  }
}
