import * as Cesium from 'cesium'
import type { BaseMap, MapPlugin } from '@/core'
import type { DrawOptions } from '@/types'
import { CesiumDraw } from '@/cesium/operation'

export class CesiumDrawPlugin implements MapPlugin {
  readonly name = 'draw'

  install(map: BaseMap): void {
    const viewer = (map as any).getViewer() as Cesium.Viewer | null
    const m = map as any

    m.drawPoint = (options?: DrawOptions) => {
      return CesiumDraw.startDraw(viewer, 'point', wrapOptions(map, options))
    }
    m.drawLine = (options?: DrawOptions) => {
      return CesiumDraw.startDraw(viewer, 'polyline', wrapOptions(map, options))
    }
    m.drawPolygon = (options?: DrawOptions) => {
      return CesiumDraw.startDraw(viewer, 'polygon', wrapOptions(map, options))
    }
    m.stopDraw = () => {
      CesiumDraw.stopDraw(viewer)
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
