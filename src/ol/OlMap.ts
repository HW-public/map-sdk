import { Map, View } from 'ol'
import { defaults as defaultControls } from 'ol/control'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Collection } from 'ol'
import { Modify } from 'ol/interaction'
import { altKeyOnly } from 'ol/events/condition'
import type { MapConfig, MapEvent, FeatureInfo, DrawOptions, LayerInfo, TiandituLayerInfo, PopupOptions, PickResult, EditOptions } from '@/types'
import { BaseMap } from '@/core/BaseMap'
import { addTianditu } from './layers/addTianditu'
import { OlDraw, OlPopup } from './operation'
import 'ol/ol.css'

/**
 * OlMap — OpenLayers 2D 引擎实现。
 *
 * 独有方法（不在 IMap 中）：
 * - getOlMap() — 获取原始 OpenLayers Map 实例
 */
export class OlMap extends BaseMap {
  private map: Map | null = null

  constructor(config: MapConfig) {
    super(config)
  }

  init(): void {
    this.map = new Map({
      target: this.container,
      layers: [],
      controls: defaultControls({ zoom: false }),
      view: new View({
        center: this.config.center
          ? fromLonLat(this.config.center)
          : fromLonLat([116.3974, 39.9093]),
        zoom: this.config.zoom ?? 10,
        maxZoom: 18,
      }),
    })
  }

  /** 子类实现：根据 layer.type 分发到具体渲染模块 */
  protected loadLayer(layer: LayerInfo): void {
    switch (layer.type) {
      case 'tianditu':
        addTianditu(this.map, { key: (layer as TiandituLayerInfo).key, id: layer.id })
        break
      // 后续新增类型在这里加 case
    }
  }

  removeLayer(id: string): void {
    super.removeLayer(id)
    if (!this.map) return
    const layers = this.map.getLayers().getArray()
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]
      if (layer.get('layerId') === id) {
        this.map.removeLayer(layer)
      }
    }
  }

  setLayerVisible(id: string, visible: boolean): void {
    super.setLayerVisible(id, visible)
    if (!this.map) return
    this.map.getLayers().forEach((layer) => {
      if (layer.get('layerId') === id) {
        layer.setVisible(visible)
      }
    })
  }

  setLayerOpacity(id: string, opacity: number): void {
    super.setLayerOpacity(id, opacity)
    if (!this.map) return
    this.map.getLayers().forEach((layer) => {
      if (layer.get('layerId') === id) {
        layer.setOpacity(opacity)
      }
    })
  }

  destroy(): void {
    if (this.map) {
      OlPopup.clear(this.map)
      this.map.setTarget(undefined)
      this.map.dispose()
      this.map = null
    }
  }

  setCenter(lon: number, lat: number): void {
    this.map?.getView().setCenter(fromLonLat([lon, lat]))
  }

  getCenter(): [number, number] | undefined {
    const center = this.map?.getView().getCenter()
    if (!center) return undefined
    return toLonLat(center) as [number, number]
  }

  setZoom(zoom: number): void {
    this.map?.getView().setZoom(zoom)
  }

  getZoom(): number | undefined {
    return this.map?.getView().getZoom()
  }

  flyTo(lon: number, lat: number, zoom?: number): void {
    const view = this.map?.getView()
    if (!view) return
    view.animate({
      center: fromLonLat([lon, lat]),
      zoom: zoom ?? view.getZoom() ?? 10,
      duration: 1000,
    })
  }

  on(event: string, callback: (e: MapEvent) => void): void {
    this.map?.on(event as unknown as Parameters<Map['on']>[0], (olEvent: unknown) => {
      const evt = olEvent as { coordinate?: number[]; pixel?: number[] }
      const coord = evt.coordinate
        ? (toLonLat(evt.coordinate) as [number, number])
        : ([0, 0] as [number, number])
      callback({
        type: event,
        coordinate: coord,
        pixel: (evt.pixel ?? [0, 0]) as [number, number],
      })
    })
  }

  off(event: string, callback: (e: MapEvent) => void): void {
    this.map?.un(event as unknown as Parameters<Map['un']>[0], callback as unknown as (p0: unknown) => void)
  }

  getOlMap(): Map | null {
    return this.map
  }

  /** 获取当前视口的地理范围（WGS84：[minLon, minLat, maxLon, maxLat]） */
  getViewportExtent(): [number, number, number, number] | undefined {
    if (!this.map) return undefined
    const view = this.map.getView()
    const size = this.map.getSize()
    if (!size) return undefined
    const ex = view.calculateExtent(size)
    const sw = toLonLat([ex[0], ex[1]]) as [number, number]
    const ne = toLonLat([ex[2], ex[3]]) as [number, number]
    return [sw[0], sw[1], ne[0], ne[1]]
  }

  /** 根据地理范围适配视图（WGS84：[minLon, minLat, maxLon, maxLat]） */
  fitViewportExtent(extent: [number, number, number, number]): void {
    if (!this.map) return
    const view = this.map.getView()
    const size = this.map.getSize()
    if (!size) return
    view.fit(
      [fromLonLat([extent[0], extent[1]]), fromLonLat([extent[2], extent[3]])].flat(),
      { size, nearest: true }
    )
  }

  addFeature(feature: FeatureInfo): void {
    super.addFeature(feature)
    OlDraw.addFeature(this.map, feature)
  }

  removeFeature(id: string): void {
    super.removeFeature(id)
    OlDraw.removeFeature(this.map, id)
  }

  updateFeature(id: string, style: Record<string, unknown>): void {
    super.updateFeature(id, style)
    OlDraw.updateFeature(this.map, id, style)
  }

  clearFeatures(): void {
    super.clearFeatures()
    OlDraw.clearFeatures(this.map)
  }

  drawPoint(options?: DrawOptions): () => void {
    return OlDraw.startDraw(this.map, 'point', this.wrapDrawOptions(options))
  }

  drawLine(options?: DrawOptions): () => void {
    return OlDraw.startDraw(this.map, 'polyline', this.wrapDrawOptions(options))
  }

  drawPolygon(options?: DrawOptions): () => void {
    return OlDraw.startDraw(this.map, 'polygon', this.wrapDrawOptions(options))
  }

  /** 包装 DrawOptions，绘制完成后自动 addFeature 并透传用户回调 */
  private wrapDrawOptions(options?: DrawOptions): DrawOptions | undefined {
    if (!options) return undefined
    return {
      ...options,
      onComplete: (feature) => {
        this.addFeature(feature)
        options.onComplete?.(feature)
      },
    }
  }

  stopDraw(): void {
    OlDraw.stopDraw(this.map)
  }

  editFeature(id: string, options?: EditOptions): () => void {
    if (!this.map) return () => {}

    const layer = this.map.getLayers().getArray().find(
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
        const t = feature.get('featureType') as import('@/types').FeatureType
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
      const type = feature.get('featureType') as import('@/types').FeatureType
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

      this.overlayMgr.update(id, { coords })
      options?.onComplete?.({ id, type, coords, style })
    })

    this.map.addInteraction(modify)

    const viewport = this.map.getViewport()
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (!this.map) return

      const geom = feature.getGeometry()
      const fType = feature.get('featureType') as import('@/types').FeatureType
      if (!geom || fType === 'point') return

      const pixel = this.map.getEventPixel(e)
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

      const pixelCoords = coords.map((c) => this.map!.getPixelFromCoordinate(c))
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
        this.overlayMgr.update(id, { coords: newCoords })
        options?.onComplete?.({ id, type: fType, coords: newCoords })
      }
    }
    viewport.addEventListener('contextmenu', onContextMenu)

    return () => {
      this.map?.removeInteraction(modify)
      viewport.removeEventListener('contextmenu', onContextMenu)
    }
  }

  pickAtPixel(pixel: [number, number]): PickResult[] {
    if (!this.map) return []
    const features = this.map.getFeaturesAtPixel(pixel)
    console.log('features', features)
    if (!features) return []
    return features.map((f) => ({
      id: f.get('featureId') as string | undefined,
      type: f.get('featureType') as PickResult['type'],
      coords: f.get('featureCoords') as [number, number][],
      style: f.get('featureStyle') as Record<string, unknown> | undefined,
    }))
  }

  showPopup(options: PopupOptions): void {
    const id = options.id ?? `sdk-popup-${Date.now()}`
    const opts = { ...options, id }
    super.showPopup(opts)
    OlPopup.show(this.map, {
      ...opts,
      onClose: () => {
        super.hidePopup(id)
        options.onClose?.()
      },
    })
  }

  hidePopup(id: string): void {
    super.hidePopup(id)
    OlPopup.hide(this.map, id)
  }

  clearPopups(): void {
    super.clearPopups()
    OlPopup.clear(this.map)
  }
}
