import type { BaseMap, MapPlugin } from '@/core'
import type { EditOptions } from '@/types'
import { CesiumEdit } from '@/cesium/operation'

export class CesiumEditPlugin implements MapPlugin {
  readonly name = 'edit'

  install(map: BaseMap): void {
    const m = map as any
    m.editFeature = (id: string, options?: EditOptions) => {
      const viewer = m.getViewer() as import('cesium').Viewer | null
      if (!viewer) return () => {}
      return CesiumEdit.startEdit(viewer, map.getOverlayManager(), id, options)
    }
  }

  uninstall(map: BaseMap): void {
    delete (map as any).editFeature
  }
}
