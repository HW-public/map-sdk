import type { BaseMap, MapPlugin } from '@/core'
import type { SelectOptions } from '@/types'
import { CesiumSelect } from '@/cesium/operation'

export class CesiumSelectPlugin implements MapPlugin {
  readonly name = 'select'

  install(map: BaseMap): void {
    const m = map as any
    m.enableSelect = (options?: SelectOptions) => {
      const viewer = m.getViewer() as import('cesium').Viewer | null
      if (!viewer) return () => {}
      const mode = options?.mode ?? 'point'
      const callback = (features: import('@/types').FeatureInfo[]) => {
        options?.onSelect?.(features)
      }
      if (mode === 'box') {
        CesiumSelect.enableBoxSelect(viewer, callback)
      } else {
        CesiumSelect.enablePointSelect(viewer, callback)
      }
      return () => CesiumSelect.disable()
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    CesiumSelect.disable()
    delete m.enableSelect
  }
}
