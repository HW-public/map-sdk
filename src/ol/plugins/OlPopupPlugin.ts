import type { BaseMap, MapPlugin } from '@/core'
import type { PopupOptions } from '@/types'
import { OlPopup } from '@/ol/operation'

export class OlPopupPlugin implements MapPlugin {
  readonly name = 'popup'

  install(map: BaseMap): void {
    const olMap = (map as any).getOlMap?.() as import('ol').Map | null
    const m = map as any

    m.showPopup = (options: PopupOptions): void => {
      const id = options.id ?? `sdk-popup-${Date.now()}`
      const opts = { ...options, id }
      map.getPopupManager().add(opts)
      OlPopup.show(olMap, {
        ...opts,
        onClose: () => {
          map.getPopupManager().remove(id)
          options.onClose?.()
        },
      })
    }

    m.hidePopup = (id: string): void => {
      map.getPopupManager().remove(id)
      OlPopup.hide(olMap, id)
    }

    m.clearPopups = (): void => {
      map.getPopupManager().clear()
      OlPopup.clear(olMap)
    }
  }

  uninstall(map: BaseMap): void {
    const olMap = (map as any).getOlMap?.() as import('ol').Map | null
    OlPopup.clear(olMap)
    const m = map as any
    delete m.showPopup
    delete m.hidePopup
    delete m.clearPopups
  }
}
