import type { Map } from 'ol'
import type { Feature } from 'ol'
import SelectInteraction from 'ol/interaction/Select'
import DragBox from 'ol/interaction/DragBox'
import type { FeatureInfo } from '@/types'

/**
 * OpenLayers 选择操作。
 *
 * 职责：点选、框选等交互式选择逻辑。
 */
export class OlSelect {
  private static selectInteraction: SelectInteraction | null = null
  private static dragBoxInteraction: DragBox | null = null

  /**
   * 启用点选模式：点击地图上的要素时触发回调。
   *
   * @param map - OpenLayers Map 实例
   * @param callback - 选中要素后的回调
   */
  static enablePointSelect(
    map: Map | null,
    callback: (features: FeatureInfo[]) => void
  ): void {
    if (!map) return
    OlSelect.disable(map)

    const select = new SelectInteraction({
      style: null,
    })
    select.on('select', (e) => {
      const features = e.selected as Feature[]
      callback(features.map((f) => OlSelect.toFeatureInfo(f)))
    })

    map.addInteraction(select)
    OlSelect.selectInteraction = select
  }

  /**
   * 启用框选模式：拖拽矩形框选区域内的要素。
   *
   * @param map - OpenLayers Map 实例
   * @param callback - 框选完成后的回调
   */
  static enableBoxSelect(
    map: Map | null,
    callback: (features: FeatureInfo[]) => void
  ): void {
    if (!map) return
    OlSelect.disable(map)

    const select = new SelectInteraction({
      style: null,
    })
    const dragBox = new DragBox()

    dragBox.on('boxend', () => {
      const extent = dragBox.getGeometry().getExtent()
      const selected: Feature[] = []
      map.getLayers().forEach((layer) => {
        const source = (layer as any).getSource?.()
        if (source?.forEachFeatureIntersectingExtent) {
          source.forEachFeatureIntersectingExtent(extent, (feature: Feature) => {
            selected.push(feature)
          })
        }
      })
      select.getFeatures().clear()
      selected.forEach((f) => select.getFeatures().push(f))
      callback(selected.map((f) => OlSelect.toFeatureInfo(f)))
    })

    map.addInteraction(select)
    map.addInteraction(dragBox)
    OlSelect.selectInteraction = select
    OlSelect.dragBoxInteraction = dragBox
  }

  /**
   * 禁用所有选择交互。
   *
   * @param map - OpenLayers Map 实例
   */
  static disable(map: Map | null): void {
    if (!map) return
    if (OlSelect.selectInteraction) {
      map.removeInteraction(OlSelect.selectInteraction)
      OlSelect.selectInteraction = null
    }
    if (OlSelect.dragBoxInteraction) {
      map.removeInteraction(OlSelect.dragBoxInteraction)
      OlSelect.dragBoxInteraction = null
    }
  }

  private static toFeatureInfo(feature: Feature): FeatureInfo {
    const type = feature.get('featureType') as FeatureInfo['type']
    const coords = feature.get('featureCoords') as [number, number][]
    return {
      type: type ?? 'point',
      coords: coords ?? [],
      id: feature.get('featureId') as string | undefined,
      style: feature.get('featureStyle') as Record<string, unknown> | undefined,
    }
  }
}
