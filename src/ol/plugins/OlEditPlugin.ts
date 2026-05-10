import type { BaseMap, MapPlugin } from '@/core'
import type { EditOptions } from '@/types'
import { OlEdit } from '@/ol/operation'

export class OlEditPlugin implements MapPlugin {
  readonly name = 'edit'

  install(map: BaseMap): void {
    const m = map as any
    m.editFeature = (id: string, options?: EditOptions) => {
      const olMap = (map as any).getOlMap() as import('ol').Map | null
      if (!olMap) return () => {}
      return OlEdit.startEdit(olMap, map.getOverlayManager(), id, options)
    }
  }

  uninstall(map: BaseMap): void {
    delete (map as any).editFeature
  }
}
