import { Collection } from 'ol'
import { Modify } from 'ol/interaction'
import { altKeyOnly } from 'ol/events/condition'
import { toLonLat } from 'ol/proj'
import type { EditOptions, FeatureType } from '@/types'

export class OlEdit {
  static startEdit(
    map: import('ol').Map,
    overlayMgr: { update(id: string, data: { coords: [number, number][] }): void },
    id: string,
    options?: EditOptions,
  ): () => void {
    const layer = map.getLayers().getArray().find(
      (l) => (l as any).get('id') === 'sdk-draw-layer'
    ) as import('ol/layer').Vector<import('ol/source').Vector<import('ol').Feature>> | undefined
    if (!layer) return () => {}

    const source = layer.getSource()
    if (!source) return () => {}

    const feature = source.getFeatureById(id)
    if (!feature) return () => {}

    const modify = new Modify({
      features: new Collection([feature]),
      deleteCondition: (e) => {
        if (!altKeyOnly(e) && !e.originalEvent.shiftKey) return false
        const g = feature.getGeometry()
        const t = feature.get('featureType') as FeatureType
        if (!g || t === 'point') return false
        let cs: number[][] = []
        if (t === 'polyline') {
          cs = (g as import('ol/geom').LineString).getCoordinates()
        } else if (t === 'polygon') {
          cs = (g as import('ol/geom').Polygon).getCoordinates()[0]
        }
        const closed = cs.length > 1 && cs[0][0] === cs[cs.length - 1][0] && cs[0][1] === cs[cs.length - 1][1]
        const actual = t === 'polygon' && closed ? cs.length - 1 : cs.length
        const min = t === 'polygon' ? 3 : 2
        return actual > min
      },
    })

    modify.on('modifyend', () => {
      const geom = feature.getGeometry()
      const type = feature.get('featureType') as FeatureType
      const style = feature.get('featureStyle') as Record<string, unknown> | undefined

      let coords: [number, number][] = []
      switch (type) {
        case 'point': {
          const c = (geom as import('ol/geom').Point).getCoordinates()
          coords = [toLonLat(c) as [number, number]]
          break
        }
        case 'polyline': {
          coords = (geom as import('ol/geom').LineString).getCoordinates().map(
            (c) => toLonLat(c) as [number, number]
          )
          break
        }
        case 'polygon': {
          coords = (geom as import('ol/geom').Polygon).getCoordinates()[0].map(
            (c) => toLonLat(c) as [number, number]
          )
          break
        }
      }

      overlayMgr.update(id, { coords })
      options?.onComplete?.({ id, type, coords, style })
    })

    map.addInteraction(modify)

    const viewport = map.getViewport()
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()

      const geom = feature.getGeometry()
      const fType = feature.get('featureType') as FeatureType
      if (!geom || fType === 'point') return

      const pixel = map.getEventPixel(e)
      let coords: number[][] = []
      if (fType === 'polyline') {
        coords = (geom as import('ol/geom').LineString).getCoordinates()
      } else if (fType === 'polygon') {
        coords = (geom as import('ol/geom').Polygon).getCoordinates()[0]
      }

      const isClosed = fType === 'polygon' && coords.length > 1
        && coords[0][0] === coords[coords.length - 1][0]
        && coords[0][1] === coords[coords.length - 1][1]
      const actualCount = fType === 'polygon' && isClosed ? coords.length - 1 : coords.length
      const minCount = fType === 'polygon' ? 3 : 2
      if (actualCount <= minCount) return

      const pixelCoords = coords.map((c) => map.getPixelFromCoordinate(c))
      let bestIdx = -1
      let bestDist = Infinity
      for (let i = 0; i < pixelCoords.length; i++) {
        const d = Math.sqrt((pixel[0] - pixelCoords[i][0]) ** 2 + (pixel[1] - pixelCoords[i][1]) ** 2)
        if (d < bestDist) {
          bestDist = d
          bestIdx = i
        }
      }

      if (bestIdx >= 0 && bestDist < 10) {
        if (fType === 'polygon') {
          const isClosed = coords.length > 1
            && coords[0][0] === coords[coords.length - 1][0]
            && coords[0][1] === coords[coords.length - 1][1]
          if (isClosed && (bestIdx === 0 || bestIdx === coords.length - 1)) {
            coords.splice(coords.length - 1, 1)
            coords.splice(0, 1)
            coords.push([coords[0][0], coords[0][1]])
          } else {
            coords.splice(bestIdx, 1)
          }
          ;(geom as import('ol/geom').Polygon).setCoordinates([coords])
        } else {
          coords.splice(bestIdx, 1)
          ;(geom as import('ol/geom').LineString).setCoordinates(coords)
        }

        const newCoords = coords.map((c) => toLonLat(c) as [number, number])
        overlayMgr.update(id, { coords: newCoords })
        options?.onComplete?.({ id, type: fType, coords: newCoords })
      }
    }
    viewport.addEventListener('contextmenu', onContextMenu)

    return () => {
      map.removeInteraction(modify)
      viewport.removeEventListener('contextmenu', onContextMenu)
    }
  }
}
