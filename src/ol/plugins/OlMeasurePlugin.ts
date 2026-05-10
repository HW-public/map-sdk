import type { MapPlugin } from '@/core'
import type { BaseMap } from '@/core/BaseMap'
import type { DrawOptions, MeasureDistanceOptions, MeasureAreaOptions } from '@/types'
import { OlDraw } from '@/ol/operation'
import { lineLength, polygonArea } from '@/utils'

export class OlMeasurePlugin implements MapPlugin {
  readonly name = 'measure'

  install(map: BaseMap): void {
    const olMap = (map as any).getOlMap?.() as import('ol').Map | null
    if (!olMap) throw new Error('OlMeasurePlugin requires OlMap')

    const m = map as any

    m.measureDistance = (options?: MeasureDistanceOptions): () => void => {
      return OlDraw.startDraw(olMap, 'polyline', {
        style: { stroke: '#ff5722', strokeWidth: 3 },
        onComplete: (feature) => {
          const coords = feature.coords
          const dist = lineLength(coords, options?.unit ?? 'm')
          options?.onComplete?.(dist, coords)
        },
      } as DrawOptions)
    }

    m.measureArea = (options?: MeasureAreaOptions): () => void => {
      return OlDraw.startDraw(olMap, 'polygon', {
        style: { fill: 'rgba(255,87,34,0.2)', stroke: '#ff5722', strokeWidth: 2 },
        onComplete: (feature) => {
          const coords = feature.coords
          const area = polygonArea(coords, options?.unit ?? 'm2')
          options?.onComplete?.(area, coords)
        },
      } as DrawOptions)
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    delete m.measureDistance
    delete m.measureArea
  }
}
