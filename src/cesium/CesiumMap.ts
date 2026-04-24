import * as Cesium from 'cesium'
import type { MapEvent, FeatureInfo, DrawOptions } from '@/types'
import { BaseMap } from '@/core/BaseMap'
import { addTianditu } from './layers/addTianditu'
import { CesiumDraw } from './operation'
import 'cesium/Build/Cesium/Widgets/widgets.css'

/**
 * CesiumMap — Cesium 3D 引擎实现。
 *
 * 独有方法（不在 IMap 中）：
 * - getViewer() — 获取原始 Cesium Viewer 实例
 * - setPitch() / setHeading() — 相机姿态控制（3D 独有）
 */
export class CesiumMap extends BaseMap {
  private viewer: Cesium.Viewer | null = null

  async init(): Promise<void> {
    this.viewer = new Cesium.Viewer(this.container, {
      baseLayer: false,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      creditContainer: document.createElement('div'),
    })

    const center = this.config.center ?? [116.3974, 39.9093]
    const zoom = this.config.zoom ?? 10
    const height = 10000000 / Math.pow(2, zoom)

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
      duration: 0,
    })
  }

  loadTianditu(key: string): void {
    // 图层信息记录到 LayerManager
    super.loadTianditu(key)
    addTianditu(this.viewer, { key })
  }

  destroy(): void {
    if (this.viewer) {
      this.viewer.destroy()
      this.viewer = null
    }
  }

  setCenter(lon: number, lat: number): void {
    if (!this.viewer) return
    const height = this.viewer.camera.positionCartographic.height
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
    })
  }

  getCenter(): [number, number] | undefined {
    if (!this.viewer) return undefined
    const cartographic = this.viewer.camera.positionCartographic
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
    ]
  }

  setZoom(zoom: number): void {
    if (!this.viewer) return
    const center = this.getCenter()
    if (!center) return
    const height = 10000000 / Math.pow(2, zoom)
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
    })
  }

  getZoom(): number | undefined {
    if (!this.viewer) return undefined
    const height = this.viewer.camera.positionCartographic.height
    return Math.log2(10000000 / height)
  }

  flyTo(lon: number, lat: number, zoom?: number): void {
    if (!this.viewer) return
    const height = zoom ? 10000000 / Math.pow(2, zoom) : this.viewer.camera.positionCartographic.height
    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      duration: 1,
    })
  }

  on(event: string, callback: (e: MapEvent) => void): void {
    if (!this.viewer) return

    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)
    const eventType = this.getCesiumEventType(event)

    if (eventType !== undefined) {
      handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const cartesian = this.viewer!.camera.pickEllipsoid(click.position)
        let coord: [number, number] = [0, 0]
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
          coord = [
            Cesium.Math.toDegrees(cartographic.longitude),
            Cesium.Math.toDegrees(cartographic.latitude),
          ]
        }
        callback({
          type: event,
          coordinate: coord,
          pixel: [click.position.x, click.position.y],
        })
      }, eventType)
    }
  }

  off(event: string, _callback: (e: MapEvent) => void): void {
    void event
    void _callback
  }

  getViewer(): Cesium.Viewer | null {
    return this.viewer
  }

  private getCesiumEventType(event: string): Cesium.ScreenSpaceEventType | undefined {
    switch (event) {
      case 'click':
        return Cesium.ScreenSpaceEventType.LEFT_CLICK
      case 'dblclick':
        return Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      case 'rightclick':
        return Cesium.ScreenSpaceEventType.RIGHT_CLICK
      case 'mousemove':
        return Cesium.ScreenSpaceEventType.MOUSE_MOVE
      default:
        return undefined
    }
  }

  addFeature(feature: FeatureInfo): void {
    super.addFeature(feature)
    CesiumDraw.addFeature(this.viewer, feature)
  }

  clearFeatures(): void {
    super.clearFeatures()
    CesiumDraw.clearFeatures(this.viewer)
  }

  drawPoint(options?: DrawOptions): () => void {
    return CesiumDraw.startDraw(this.viewer, 'point', options)
  }

  drawLine(options?: DrawOptions): () => void {
    return CesiumDraw.startDraw(this.viewer, 'polyline', options)
  }

  drawPolygon(options?: DrawOptions): () => void {
    return CesiumDraw.startDraw(this.viewer, 'polygon', options)
  }

  stopDraw(): void {
    CesiumDraw.stopDraw(this.viewer)
  }
}
