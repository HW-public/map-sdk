import * as Cesium from 'cesium'
import type { BaseMap, MapPlugin } from '@/core'
import type { PickResult } from '@/types'

export class CesiumPickPlugin implements MapPlugin {
  readonly name = 'pick'

  install(map: BaseMap): void {
    const m = map as any
    m.pickAtPixel = (pixel: [number, number]): PickResult[] => {
      const viewer = m.getViewer() as Cesium.Viewer | null
      if (!viewer) return []
      const cartesian2 = new Cesium.Cartesian2(pixel[0], pixel[1])
      const pickedObjects = viewer.scene.drillPick(cartesian2)
      const results: PickResult[] = []
      for (const picked of pickedObjects) {
        if (picked.id && picked.id.properties) {
          const props = picked.id.properties
          const tag = props?.__sdkDraw?.getValue()
          if (tag) {
            results.push({
              id: props?.featureId?.getValue(),
              type: props?.featureType?.getValue(),
              coords: props?.featureCoords?.getValue(),
              style: props?.featureStyle?.getValue(),
            })
          }
        }
      }
      return results
    }
  }

  uninstall(map: BaseMap): void {
    delete (map as any).pickAtPixel
  }
}
