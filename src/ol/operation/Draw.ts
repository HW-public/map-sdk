import type { Map } from 'ol'
import type { FeatureInfo, FeatureType, DrawOptions } from '@/types'
import { Feature } from 'ol'
import { Point, LineString, Polygon } from 'ol/geom'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Fill, Stroke, Circle, Text } from 'ol/style'
import { Draw } from 'ol/interaction'

const LAYER_ID = 'sdk-draw-layer'

function getOrCreateLayer(map: Map): VectorLayer<VectorSource<Feature>> {
  const existing = map.getLayers().getArray().find(
    (l) => (l as any).get('id') === LAYER_ID
  ) as VectorLayer<VectorSource<Feature>> | undefined
  if (existing) return existing

  const layer = new VectorLayer({
    source: new VectorSource(),
    zIndex: 999,
  })
  layer.set('id', LAYER_ID)
  map.addLayer(layer)
  return layer
}

function resolveStyle(style: Record<string, unknown> | undefined) {
  const fillColor = (style?.fill as string) || 'rgba(255, 0, 0, 0.2)'
  const strokeColor = (style?.stroke as string) || '#ff0000'
  const strokeWidth = (style?.strokeWidth as number) || 2
  const pointRadius = (style?.radius as number) || 6
  const pointColor = (style?.pointColor as string) || '#ff0000'

  return new Style({
    fill: new Fill({ color: fillColor }),
    stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
    image: new Circle({
      radius: pointRadius,
      fill: new Fill({ color: pointColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
    }),
    text:
      style?.label
        ? new Text({
            text: String(style.label),
            font: '12px sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
            offsetY: -15,
          })
        : undefined,
  })
}

/** 将 OL 几何坐标转为 WGS84 [lon, lat] 数组 */
function geometryToCoords(
  type: FeatureType,
  geom: Point | LineString | Polygon
): [number, number][] {
  switch (type) {
    case 'point': {
      const c = (geom as Point).getCoordinates()
      return [toLonLat(c) as [number, number]]
    }
    case 'polyline': {
      return (geom as LineString).getCoordinates().map(
        (c) => toLonLat(c) as [number, number]
      )
    }
    case 'polygon': {
      return (geom as Polygon).getCoordinates()[0].map(
        (c) => toLonLat(c) as [number, number]
      )
    }
  }
}

/** 当前活跃的绘制交互映射：map → Draw */
const activeDraws = new WeakMap<Map, Draw>()

/**
 * OpenLayers 绘制操作。
 *
 * 职责：在 OL 地图上实际绘制点、线、面等矢量要素。
 */
export class OlDraw {
  /**
   * 开始交互式绘制。
   *
   * 点击地图添加点，双击结束绘制。
   * 同一时刻同一地图只能有一个绘制交互在进行。
   *
   * @param map - OpenLayers Map 实例
   * @param type - 绘制类型：point（单击完成）、polyline / polygon（点击加点、双击结束）
   * @param options - 可选回调和样式
   * @returns 取消函数，调用后可终止当前绘制
   */
  static startDraw(map: Map | null, type: FeatureType, options?: DrawOptions): () => void {
    if (!map) return () => {}

    // 先停止已有的绘制交互
    OlDraw.stopDraw(map)

    const layer = getOrCreateLayer(map)
    const source = layer.getSource()!

    const olType = type === 'point' ? 'Point' : type === 'polyline' ? 'LineString' : 'Polygon'

    const draw = new Draw({
      source,
      type: olType as 'Point' | 'LineString' | 'Polygon',
      style: resolveStyle(options?.style),
    })

    draw.on('drawend', (event) => {
      const geom = event.feature.getGeometry() as Point | LineString | Polygon
      const coords = geometryToCoords(type, geom)

      // 移除交互
      map.removeInteraction(draw)
      activeDraws.delete(map)

      // 给绘制完成的 feature 设置样式和 id
      const feature = event.feature
      feature.setStyle(resolveStyle(options?.style))

      options?.onComplete?.({
        type,
        coords,
        style: options?.style,
      })
    })

    draw.on('drawstart', () => {
      options?.onChange?.([])
    })

    // OL 的 Draw 没有直接的坐标变化事件，我们用 geometry 变化来模拟
    // 但 OL 的 Draw 在绘制过程中 feature 的 geometry 会不断更新
    // 这里简化处理：onChange 在 drawstart 时触发一次空数组

    map.addInteraction(draw)
    activeDraws.set(map, draw)

    return () => OlDraw.stopDraw(map)
  }

  /**
   * 停止当前进行中的交互式绘制。
   *
   * @param map - OpenLayers Map 实例
   */
  static stopDraw(map: Map | null): void {
    if (!map) return
    const draw = activeDraws.get(map)
    if (draw) {
      map.removeInteraction(draw)
      activeDraws.delete(map)
    }
  }

  /**
   * 在地图上添加一个绘制要素（非交互式，直接绘制）。
   *
   * @param map - OpenLayers Map 实例
   * @param feature - 要素描述信息
   */
  static addFeature(map: Map | null, feature: FeatureInfo): void {
    if (!map || !feature.coords.length) return

    const layer: VectorLayer<VectorSource<Feature>> = getOrCreateLayer(map)
    const source: VectorSource<Feature> = layer.getSource()!
    const style: Style = resolveStyle(feature.style)

    let geom: Point | LineString | Polygon

    switch (feature.type) {
      case 'point': {
        const [lon, lat] = feature.coords[0]
        geom = new Point(fromLonLat([lon, lat]))
        break
      }
      case 'polyline': {
        geom = new LineString(feature.coords.map(([lon, lat]) => fromLonLat([lon, lat])))
        break
      }
      case 'polygon': {
        // 确保首尾闭合
        const ring = feature.coords.map(([lon, lat]) => fromLonLat([lon, lat]))
        if (
          ring.length > 2 &&
          (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])
        ) {
          ring.push(ring[0])
        }
        geom = new Polygon([ring])
        break
      }
      default:
        return
    }

    if (feature.id) {
      const existing = source.getFeatureById(feature.id)
      if (existing) source.removeFeature(existing)
    }
    const f = new Feature(geom)
    f.setStyle(style)
    if (feature.id) f.setId(feature.id)
    source.addFeature(f)
  }

  /**
   * 根据 ID 移除指定要素。
   *
   * @param map - OpenLayers Map 实例
   * @param id - 要素 ID
   */
  static removeFeature(map: Map | null, id: string): void {
    if (!map) return
    const layer = map.getLayers().getArray().find(
      (l) => (l as any).get('id') === LAYER_ID
    ) as VectorLayer<VectorSource<Feature>> | undefined
    if (!layer) return
    const source = layer.getSource()
    if (!source) return
    const existing = source.getFeatureById(id)
    if (existing) source.removeFeature(existing)
  }

  /**
   * 根据 ID 更新指定要素的样式。
   *
   * @param map - OpenLayers Map 实例
   * @param id - 要素 ID
   * @param style - 新样式
   */
  static updateFeature(map: Map | null, id: string, style: Record<string, unknown>): void {
    if (!map) return
    const layer = map.getLayers().getArray().find(
      (l) => (l as any).get('id') === LAYER_ID
    ) as VectorLayer<VectorSource<Feature>> | undefined
    if (!layer) return
    const source = layer.getSource()
    if (!source) return
    const feature = source.getFeatureById(id)
    if (feature) feature.setStyle(resolveStyle(style))
  }

  /**
   * 清除所有绘制要素。
   *
   * @param map - OpenLayers Map 实例
   */
  static clearFeatures(map: Map | null): void {
    if (!map) return
    const layer = map.getLayers().getArray().find(
      (l) => (l as any).get('id') === LAYER_ID
    ) as VectorLayer<VectorSource<Feature>> | undefined
    if (layer) {
      layer.getSource()?.clear()
    }
  }
}
