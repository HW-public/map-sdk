import { Map, View } from 'ol'
import { defaults as defaultControls } from 'ol/control'
import { fromLonLat, toLonLat } from 'ol/proj'
import type { MapConfig, MapEvent, FeatureInfo, LayerInfo, TiandituLayerInfo, PopupOptions } from '@/types'
import { BaseMap } from '@/core/BaseMap'
import type { MapPlugin } from '@/core'
import { addTianditu } from './layers/addTianditu'
import { OlDraw, OlPopup } from './operation'
import { OlDrawPlugin, OlEditPlugin, OlPickPlugin, OlMeasurePlugin } from './plugins'
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
    this.installDefaultPlugins()
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

  protected getDefaultPlugins(): MapPlugin[] {
    return [new OlDrawPlugin(), new OlEditPlugin(), new OlPickPlugin(), new OlMeasurePlugin()]
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
