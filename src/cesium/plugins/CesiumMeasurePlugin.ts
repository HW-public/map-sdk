import * as Cesium from 'cesium'
import type { MapPlugin } from '@/core'
import type { BaseMap } from '@/core/BaseMap'
import type { DrawOptions, MeasureDistanceOptions, MeasureAreaOptions } from '@/types'
import { CesiumDraw } from '@/cesium/operation'
import { lineLength, polygonArea } from '@/utils'

export class CesiumMeasurePlugin implements MapPlugin {
  readonly name = 'measure'

  install(map: BaseMap): void {
    const viewer = (map as any).getViewer?.() as Cesium.Viewer | null
    if (!viewer) throw new Error('CesiumMeasurePlugin requires CesiumMap')

    const m = map as any

    m.measureDistance = (options?: MeasureDistanceOptions): () => void => {
      return CesiumDraw.startDraw(viewer, 'polyline', {
        style: { stroke: '#ff5722', strokeWidth: 3 },
        onComplete: (feature) => {
          const coords = feature.coords
          const dist = lineLength(coords, options?.unit ?? 'm')
          options?.onComplete?.(dist, coords)
        },
      } as DrawOptions)
    }

    m.measureArea = (options?: MeasureAreaOptions): () => void => {
      return CesiumDraw.startDraw(viewer, 'polygon', {
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
