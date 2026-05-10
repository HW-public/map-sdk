import * as Cesium from 'cesium'
import type { MapConfig, MapEvent, FeatureInfo, DrawOptions, LayerInfo, TiandituLayerInfo, PopupOptions, PickResult, EditOptions } from '@/types'
import { BaseMap } from '@/core/BaseMap'
import { addTianditu } from './layers/addTianditu'
import { CesiumDraw, CesiumPopup } from './operation'
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

  setLayerVisible(id: string, visible: boolean): void {
    super.setLayerVisible(id, visible)
    if (!this.viewer) return
    for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
      const layer = this.viewer.imageryLayers.get(i)
      if ((layer as any).layerId === id) {
        layer.show = visible
      }
    }
  }

  setLayerOpacity(id: string, opacity: number): void {
    super.setLayerOpacity(id, opacity)
    if (!this.viewer) return
    for (let i = 0; i < this.viewer.imageryLayers.length; i++) {
      const layer = this.viewer.imageryLayers.get(i)
      if ((layer as any).layerId === id) {
        layer.alpha = opacity
      }
    }
  }

  destroy(): void {
    if (this.viewer) {
      CesiumPopup.clear(this.viewer)
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

  /** 计算屏幕像素点到三维线段在屏幕投影的距离与投影比例 t（0~1） */
  private screenSpaceDistanceToSegment(
    px: [number, number],
    a: Cesium.Cartesian3,
    b: Cesium.Cartesian3,
  ): { distance: number; t: number } | undefined {
    if (!this.viewer) return undefined
    const va = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, a, new Cesium.Cartesian2())
    const vb = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer.scene, b, new Cesium.Cartesian2())
    if (!va || !vb) return undefined
    const dx = vb.x - va.x
    const dy = vb.y - va.y
    const len2 = dx * dx + dy * dy
    let t = len2 === 0 ? 0 : ((px[0] - va.x) * dx + (px[1] - va.y) * dy) / len2
    t = Math.max(0, Math.min(1, t))
    const projX = va.x + t * dx
    const projY = va.y + t * dy
    const dist = Math.sqrt((px[0] - projX) ** 2 + (px[1] - projY) ** 2)
    return { distance: dist, t }
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

  updateFeature(id: string, style: Record<string, unknown>): void {
    super.updateFeature(id, style)
    CesiumDraw.updateFeature(this.viewer, id, style)
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

  editFeature(id: string, options?: EditOptions): () => void {
    if (!this.viewer) return () => {}

    const entity = this.viewer.entities.getById(id)
    if (!entity) return () => {}

    // 提取当前坐标和类型
    let coords: [number, number][] = []
    let type: import('@/types').FeatureType = 'point'

    if (entity.position) {
      type = 'point'
      const cart = entity.position.getValue(Cesium.JulianDate.now())
      if (cart) {
        const carto = Cesium.Cartographic.fromCartesian(cart)
        coords = [[Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]]
      }
    } else if (entity.polyline?.positions) {
      type = 'polyline'
      const positions = entity.polyline.positions.getValue(Cesium.JulianDate.now()) as Cesium.Cartesian3[]
      coords = positions.map((p) => {
        const carto = Cesium.Cartographic.fromCartesian(p)
        return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)] as [number, number]
      })
    } else if (entity.polygon?.hierarchy) {
      type = 'polygon'
      const hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()) as Cesium.PolygonHierarchy
      coords = hierarchy.positions.map((p) => {
        const carto = Cesium.Cartographic.fromCartesian(p)
        return [Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)] as [number, number]
      })
    }

    // 编辑期间禁用相机控制
    const ssc = this.viewer.scene.screenSpaceCameraController
    const savedEnableInputs = ssc.enableInputs
    ssc.enableInputs = false

    // 悬停吸附提示点（蓝色底白色边框）
    const hoverHandle = this.viewer.entities.add({
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#00aaff'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        show: false,
      },
    })

    let isDragging = false
    let dragIndex = -1
    let snapMode: 'vertex' | 'edge' | null = null
    let snapIndex = -1
    let snapSeg = -1
    let snapT = 0

    const isClosedPolygon = type === 'polygon'
      && coords.length > 1
      && coords[0][0] === coords[coords.length - 1][0]
      && coords[0][1] === coords[coords.length - 1][1]

    let currentVertexCount = type === 'polygon'
      ? (isClosedPolygon ? coords.length - 1 : coords.length)
      : coords.length

    const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas)

    // 更新悬停提示点位置与吸附状态
    const updateHover = (px: number, py: number) => {
      if (type === 'point') {
        const pos = Cesium.Cartesian3.fromDegrees(coords[0][0], coords[0][1])
        const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer!.scene, pos, new Cesium.Cartesian2())
        if (!screenPos) {
          hoverHandle.point!.show = new Cesium.ConstantProperty(false)
          snapMode = null
          return
        }
        const dist = Math.sqrt((px - screenPos.x) ** 2 + (py - screenPos.y) ** 2)
        if (dist < 10) {
          hoverHandle.position = new Cesium.ConstantPositionProperty(pos)
          hoverHandle.point!.show = new Cesium.ConstantProperty(true)
          snapMode = 'vertex'
          snapIndex = 0
        } else {
          hoverHandle.point!.show = new Cesium.ConstantProperty(false)
          snapMode = null
        }
        return
      }

      // 先检测顶点吸附
      let bestVertexDist = Infinity
      let bestVertexIdx = -1
      for (let i = 0; i < currentVertexCount; i++) {
        const pos = Cesium.Cartesian3.fromDegrees(coords[i][0], coords[i][1])
        const sp = Cesium.SceneTransforms.worldToWindowCoordinates(this.viewer!.scene, pos, new Cesium.Cartesian2())
        if (!sp) continue
        const dist = Math.sqrt((px - sp.x) ** 2 + (py - sp.y) ** 2)
        if (dist < bestVertexDist) {
          bestVertexDist = dist
          bestVertexIdx = i
        }
      }

      if (bestVertexIdx >= 0 && bestVertexDist < 10) {
        const pos = Cesium.Cartesian3.fromDegrees(coords[bestVertexIdx][0], coords[bestVertexIdx][1])
        hoverHandle.position = new Cesium.ConstantPositionProperty(pos)
        hoverHandle.point!.show = new Cesium.ConstantProperty(true)
        snapMode = 'vertex'
        snapIndex = bestVertexIdx
        snapSeg = -1
        return
      }

      // 再检测边吸附
      const edgeCount = type === 'polygon' ? currentVertexCount : coords.length - 1
      let bestEdgeDist = Infinity
      let bestSeg = -1
      let bestT = 0

      for (let i = 0; i < edgeCount; i++) {
        const j = type === 'polygon' ? (i + 1) % currentVertexCount : i + 1
        const a = Cesium.Cartesian3.fromDegrees(coords[i][0], coords[i][1])
        const b = Cesium.Cartesian3.fromDegrees(coords[j][0], coords[j][1])
        const result = this.screenSpaceDistanceToSegment([px, py], a, b)
        if (result && result.distance < bestEdgeDist) {
          bestEdgeDist = result.distance
          bestSeg = i
          bestT = result.t
        }
      }

      if (bestSeg >= 0 && bestEdgeDist < 10) {
        const j = type === 'polygon' ? (bestSeg + 1) % currentVertexCount : bestSeg + 1
        const lon = coords[bestSeg][0] + (coords[j][0] - coords[bestSeg][0]) * bestT
        const lat = coords[bestSeg][1] + (coords[j][1] - coords[bestSeg][1]) * bestT
        const pos = Cesium.Cartesian3.fromDegrees(lon, lat)
        hoverHandle.position = new Cesium.ConstantPositionProperty(pos)
        hoverHandle.point!.show = new Cesium.ConstantProperty(true)
        snapMode = 'edge'
        snapSeg = bestSeg
        snapT = bestT
        snapIndex = -1
        return
      }

      // 无吸附
      hoverHandle.point!.show = new Cesium.ConstantProperty(false)
      snapMode = null
    }

    handler.setInputAction((_movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (snapMode === 'vertex') {
        isDragging = true
        dragIndex = snapIndex
      } else if (snapMode === 'edge') {
        const j = type === 'polygon' ? (snapSeg + 1) % currentVertexCount : snapSeg + 1
        const lon = coords[snapSeg][0] + (coords[j][0] - coords[snapSeg][0]) * snapT
        const lat = coords[snapSeg][1] + (coords[j][1] - coords[snapSeg][1]) * snapT
        const newCoord: [number, number] = [lon, lat]
        const insertIndex = snapSeg + 1
        coords.splice(insertIndex, 0, newCoord)
        CesiumDraw.updateEntityCoords(this.viewer, entity, coords)
        isDragging = true
        dragIndex = insertIndex
        if (type === 'polygon' && isClosedPolygon) {
          currentVertexCount = coords.length - 1
        } else {
          currentVertexCount = coords.length
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN)

    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (isDragging && dragIndex >= 0) {
        const cartesian = this.viewer!.camera.pickEllipsoid(
          movement.endPosition,
          this.viewer!.scene.globe.ellipsoid
        )
        if (!cartesian) return

        const carto = Cesium.Cartographic.fromCartesian(cartesian)
        coords[dragIndex] = [
          Cesium.Math.toDegrees(carto.longitude),
          Cesium.Math.toDegrees(carto.latitude),
        ]

        if (isClosedPolygon) {
          if (dragIndex === 0) {
            coords[coords.length - 1] = [coords[0][0], coords[0][1]]
          } else if (dragIndex === coords.length - 1) {
            coords[0] = [coords[coords.length - 1][0], coords[coords.length - 1][1]]
          }
        }

        hoverHandle.position = new Cesium.ConstantPositionProperty(cartesian)
        CesiumDraw.updateEntityCoords(this.viewer, entity, coords)
      } else {
        updateHover(movement.endPosition.x, movement.endPosition.y)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(() => {
      if (!isDragging) return
      isDragging = false

      this.overlayMgr.update(id, { coords })
      options?.onComplete?.({ id, type, coords })

      dragIndex = -1
    }, Cesium.ScreenSpaceEventType.LEFT_UP)
    // 1.销毁事件处理器
    // 2.移除临时entity
    // 3.恢复相机控制
    return () => {
      handler.destroy()
      this.viewer!.entities.remove(hoverHandle)
      if (this.viewer) {
        this.viewer.scene.screenSpaceCameraController.enableInputs = savedEnableInputs
      }
    }
  }

  pickAtPixel(pixel: [number, number]): PickResult[] {
    if (!this.viewer) return []
    const cartesian2 = new Cesium.Cartesian2(pixel[0], pixel[1])
    const pickedObjects = this.viewer.scene.drillPick(cartesian2)
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

  showPopup(options: PopupOptions): void {
    const id = options.id ?? `sdk-popup-${Date.now()}`
    const opts = { ...options, id }
    super.showPopup(opts)
    CesiumPopup.show(this.viewer, {
      ...opts,
      onClose: () => {
        super.hidePopup(id)
        options.onClose?.()
      },
    })
  }

  hidePopup(id: string): void {
    super.hidePopup(id)
    CesiumPopup.hide(this.viewer, id)
  }

  clearPopups(): void {
    super.clearPopups()
    CesiumPopup.clear(this.viewer)
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
