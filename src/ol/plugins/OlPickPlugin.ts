import type { BaseMap, MapPlugin } from '@/core'
import type { PickResult } from '@/types'

export class OlPickPlugin implements MapPlugin {
  readonly name = 'pick'

  install(map: BaseMap): void {
    const m = map as any
    m.pickAtPixel = (pixel: [number, number]): PickResult[] => {
      const olMap = m.getOlMap() as import('ol').Map | null
      if (!olMap) return []
      const features = olMap.getFeaturesAtPixel(pixel)
      if (!features) return []
      return features.map((f) => ({
        id: f.get('featureId') as string | undefined,
        type: f.get('featureType') as PickResult['type'],
        coords: f.get('featureCoords') as [number, number][],
        style: f.get('featureStyle') as Record<string, unknown> | undefined,
      }))
    }
  }

  uninstall(map: BaseMap): void {
    delete (map as any).pickAtPixel
  }
}
