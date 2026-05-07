import * as Cesium from 'cesium'
import type { MapConfig, MapEvent, FeatureInfo, DrawOptions, LayerInfo, TiandituLayerInfo } from '@/types'
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
  /** OpenLayers zoom 0 时赤道分辨率（米/像素） */
  private readonly OL_RESOLUTION_Z0 = 156543.03392804097

  constructor(config: MapConfig) {
    super(config)
  }

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
    const height = this.zoomToHeight(zoom)

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
      duration: 0,
    })
  }

  /** 子类实现：根据 layer.type 分发到具体渲染模块 */
  protected loadLayer(layer: LayerInfo): void {
    switch (layer.type) {
      case 'tianditu':
        addTianditu(this.viewer, { key: (layer as TiandituLayerInfo).key, id: layer.id })
        break
      // 后续新增类型在这里加 case
    }
  }

  removeLayer(id: string): void {
    super.removeLayer(id)
    if (!this.viewer) return
    for (let i = this.viewer.imageryLayers.length - 1; i >= 0; i--) {
      const layer = this.viewer.imageryLayers.get(i)
      if ((layer as any).layerId === id) {
        this.viewer.imageryLayers.remove(layer)
      }
    }
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
    const height = this.zoomToHeight(zoom)
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], height),
    })
  }

  getZoom(): number | undefined {
    if (!this.viewer) return undefined
    const height = this.viewer.camera.positionCartographic.height
    return this.heightToZoom(height)
  }

  flyTo(lon: number, lat: number, zoom?: number): void {
    if (!this.viewer) return
    const height = zoom !== undefined ? this.zoomToHeight(zoom) : this.viewer.camera.positionCartographic.height
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

  /** 根据地理范围框选相机（WGS84：[minLon, minLat, maxLon, maxLat]） */
  fitViewportExtent(extent: [number, number, number, number]): void {
    if (!this.viewer) return
    this.viewer.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]),
    })
  }

  /** 获取当前视口可见的地理范围（WGS84：[minLon, minLat, maxLon, maxLat]） */
  getViewportExtent(): [number, number, number, number] | undefined {
    if (!this.viewer) return undefined
    const rect = this.viewer.camera.computeViewRectangle()
    if (!rect) return undefined
    return [
      Cesium.Math.toDegrees(rect.west),
      Cesium.Math.toDegrees(rect.south),
      Cesium.Math.toDegrees(rect.east),
      Cesium.Math.toDegrees(rect.north),
    ]
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

  /** 获取 Cesium 当前垂直视场角（弧度），未就绪时按水平 60° 和 16:9 估算约 35° */
  private getFovy(): number {
    const frustum = this.viewer?.camera.frustum as Cesium.PerspectiveFrustum | undefined
    if (frustum?.fovy) return frustum.fovy
    // Cesium 默认水平 FOV = 60°，按常见 16:9 屏幕估算 fovy
    const fov = Cesium.Math.toRadians(60)
    const aspect = 16 / 9
    return 2 * Math.atan(Math.tan(fov / 2) / aspect)
  }

  /** 获取 canvas 高度，未就绪时用容器高度兜底 */
  private getCanvasHeight(): number {
    return (this.viewer?.scene.canvas.height ?? this.container.clientHeight) || 900
  }

  /** OpenLayers zoom → Cesium camera height */
  private zoomToHeight(zoom: number): number {
    const canvasHeight = this.getCanvasHeight()
    const fovy = this.getFovy()
    const olResolution = this.OL_RESOLUTION_Z0 / Math.pow(2, zoom)
    return (olResolution * canvasHeight) / (2 * Math.tan(fovy / 2))
  }

  /** Cesium camera height → OpenLayers zoom */
  private heightToZoom(height: number): number {
    const canvasHeight = this.getCanvasHeight()
    const fovy = this.getFovy()
    const olResolution = (height * 2 * Math.tan(fovy / 2)) / canvasHeight
    return Math.log2(this.OL_RESOLUTION_Z0 / olResolution)
  }

  addFeature(feature: FeatureInfo): void {
    super.addFeature(feature)
    CesiumDraw.addFeature(this.viewer, feature)
  }

  removeFeature(id: string): void {
    super.removeFeature(id)
    CesiumDraw.removeFeature(this.viewer, id)
  }

  clearFeatures(): void {
    super.clearFeatures()
    CesiumDraw.clearFeatures(this.viewer)
  }

  drawPoint(options?: DrawOptions): () => void {
    return CesiumDraw.startDraw(this.viewer, 'point', this.wrapDrawOptions(options))
  }

  drawLine(options?: DrawOptions): () => void {
    return CesiumDraw.startDraw(this.viewer, 'polyline', this.wrapDrawOptions(options))
  }

  drawPolygon(options?: DrawOptions): () => void {
    return CesiumDraw.startDraw(this.viewer, 'polygon', this.wrapDrawOptions(options))
  }

  stopDraw(): void {
    CesiumDraw.stopDraw(this.viewer)
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
}
