import type { BaseMap, MapPlugin } from '@/core'
import type { SelectOptions } from '@/types'
import { OlSelect } from '@/ol/operation'

export class OlSelectPlugin implements MapPlugin {
  readonly name = 'select'

  install(map: BaseMap): void {
    const m = map as any
    m.enableSelect = (options?: SelectOptions) => {
      const olMap = m.getOlMap() as import('ol').Map | null
      if (!olMap) return () => {}
      const mode = options?.mode ?? 'point'
      const callback = (features: import('@/types').FeatureInfo[]) => {
        options?.onSelect?.(features)
      }
      if (mode === 'box') {
        OlSelect.enableBoxSelect(olMap, callback)
      } else {
        OlSelect.enablePointSelect(olMap, callback)
      }
      return () => OlSelect.disable(olMap)
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    const olMap = m.getOlMap() as import('ol').Map | null
    OlSelect.disable(olMap)
    delete m.enableSelect
  }
}
