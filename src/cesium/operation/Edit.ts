import * as Cesium from 'cesium'
import type { EditOptions, FeatureType } from '@/types'
import { CesiumDraw } from './Draw'

export class CesiumEdit {
  static startEdit(
    viewer: Cesium.Viewer,
    overlayMgr: { update(id: string, data: { coords: [number, number][] }): void },
    id: string,
    options?: EditOptions,
  ): () => void {
    const entity = viewer.entities.getById(id)
    if (!entity) return () => {}

    // 提取当前坐标和类型
    let coords: [number, number][] = []
    let type: FeatureType = 'point'

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
    const ssc = viewer.scene.screenSpaceCameraController
    const savedEnableInputs = ssc.enableInputs
    ssc.enableInputs = false

    // 悬停吸附提示点（蓝色底白色边框）
    const hoverHandle = viewer.entities.add({
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

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)

    // 更新悬停提示点位置与吸附状态
    const updateHover = (px: number, py: number) => {
      if (type === 'point') {
        const pos = Cesium.Cartesian3.fromDegrees(coords[0][0], coords[0][1])
        const screenPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, pos, new Cesium.Cartesian2())
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
        const sp = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, pos, new Cesium.Cartesian2())
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
        const result = CesiumEdit.screenSpaceDistanceToSegment(viewer, [px, py], a, b)
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

    const onPointerDown = (e: PointerEvent) => {
      const hasMod = e.altKey || e.getModifierState('Alt') || e.shiftKey || e.getModifierState('Shift')
      if (hasMod && snapMode === 'vertex') {
        if (type === 'point') return
        const minCount = type === 'polygon' ? 3 : 2
        if (currentVertexCount <= minCount) return
        coords.splice(snapIndex, 1)
        if (isClosedPolygon) {
          coords[coords.length - 1] = [coords[0][0], coords[0][1]]
        }
        CesiumDraw.updateEntityCoords(viewer, entity, coords)
        if (type === 'polygon' && isClosedPolygon) {
          currentVertexCount = coords.length - 1
        } else {
          currentVertexCount = coords.length
        }
        hoverHandle.point!.show = new Cesium.ConstantProperty(false)
        snapMode = null
        e.stopImmediatePropagation()
        e.preventDefault()
      }
    }
    window.addEventListener('pointerdown', onPointerDown, true)

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
        CesiumDraw.updateEntityCoords(viewer, entity, coords)
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
        const cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
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
        CesiumDraw.updateEntityCoords(viewer, entity, coords)
      } else {
        updateHover(movement.endPosition.x, movement.endPosition.y)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    handler.setInputAction(() => {
      if (!isDragging) return
      isDragging = false

      overlayMgr.update(id, { coords })
      options?.onComplete?.({ id, type, coords })

      dragIndex = -1
    }, Cesium.ScreenSpaceEventType.LEFT_UP)

    // 右键点击已吸附的顶点进行删除
    handler.setInputAction((_movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      if (snapMode !== 'vertex') return
      if (type === 'point') return
      const minCount = type === 'polygon' ? 3 : 2
      if (currentVertexCount <= minCount) return

      coords.splice(snapIndex, 1)
      if (isClosedPolygon) {
        coords[coords.length - 1] = [coords[0][0], coords[0][1]]
      }
      CesiumDraw.updateEntityCoords(viewer, entity, coords)

      if (type === 'polygon' && isClosedPolygon) {
        currentVertexCount = coords.length - 1
      } else {
        currentVertexCount = coords.length
      }

      hoverHandle.point!.show = new Cesium.ConstantProperty(false)
      snapMode = null
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    return () => {
      handler.destroy()
      viewer.entities.remove(hoverHandle)
      window.removeEventListener('pointerdown', onPointerDown, true)
      if (viewer) {
        viewer.scene.screenSpaceCameraController.enableInputs = savedEnableInputs
      }
    }
  }

  /** 计算屏幕像素点到三维线段在屏幕投影的距离与投影比例 t（0~1） */
  private static screenSpaceDistanceToSegment(
    viewer: Cesium.Viewer,
    px: [number, number],
    a: Cesium.Cartesian3,
    b: Cesium.Cartesian3,
  ): { distance: number; t: number } | undefined {
    const va = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, a, new Cesium.Cartesian2())
    const vb = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, b, new Cesium.Cartesian2())
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
}
