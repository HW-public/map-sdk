import type { BaseMap, MapPlugin } from '@/core'
import type { DrawOptions } from '@/types'
import { OlDraw } from '@/ol/operation'

export class OlDrawPlugin implements MapPlugin {
  readonly name = 'draw'

  install(map: BaseMap): void {
    const olMap = (map as any).getOlMap() as import('ol').Map | null
    const m = map as any

    m.drawPoint = (options?: DrawOptions) => {
      return OlDraw.startDraw(olMap, 'point', wrapOptions(map, options))
    }
    m.drawLine = (options?: DrawOptions) => {
      return OlDraw.startDraw(olMap, 'polyline', wrapOptions(map, options))
    }
    m.drawPolygon = (options?: DrawOptions) => {
      return OlDraw.startDraw(olMap, 'polygon', wrapOptions(map, options))
    }
    m.stopDraw = () => {
      OlDraw.stopDraw(olMap)
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    delete m.drawPoint
    delete m.drawLine
    delete m.drawPolygon
    delete m.stopDraw
  }
}

function wrapOptions(map: BaseMap, options?: DrawOptions): DrawOptions | undefined {
  if (!options) return undefined
  return {
    ...options,
    onComplete: (feature) => {
      map.addFeature(feature)
      options.onComplete?.(feature)
    },
  }
}
