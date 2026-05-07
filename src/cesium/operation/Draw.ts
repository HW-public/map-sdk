import * as Cesium from 'cesium'
import type {FeatureInfo, FeatureType, DrawOptions} from '@/types'

const ENTITY_TAG = '__sdkDraw'
const TEMP_POLYLINE_ID = '__sdkDraw_temp_polyline'
const TEMP_POLYGON_ID = '__sdkDraw_temp_polygon'
const VERTEX_PREFIX = '__sdkDraw_vertex_'
const CURSOR_ID = '__sdkDraw_cursor'

interface ActiveDraw {
    handler: Cesium.ScreenSpaceEventHandler
    coords: [number, number][]
    cursor?: [number, number]
    type: FeatureType
    vertexIds: string[]
}

/** 当前活跃的绘制映射：viewer → ActiveDraw */
const activeDraws: WeakMap<Cesium.Viewer, ActiveDraw> = new WeakMap<Cesium.Viewer, ActiveDraw>()

function resolveStyle(style: Record<string, unknown> | undefined) {
    const fill: Cesium.Color = Cesium.Color.fromCssColorString((style?.fill as string) || 'rgba(255,0,0,0.2)')
    const stroke: Cesium.Color = Cesium.Color.fromCssColorString((style?.stroke as string) || '#ff0000')
    const strokeWidth: number = (style?.strokeWidth as number) || 2
    const pointColor : Cesium.Color= Cesium.Color.fromCssColorString((style?.pointColor as string) || '#ff0000')
    const radius : number= (style?.radius as number) || 6
    return {fill, stroke, strokeWidth, pointColor, radius}
}

function pickLonLat(viewer: Cesium.Viewer, position: Cesium.Cartesian2): [number, number] | undefined {
    const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid)
    if (!cartesian) return undefined
    const cartographic: Cesium.Cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)]
}

/** 获取用于渲染的坐标（固定顶点 + 鼠标跟随点） */
function getRenderCoords(draw: ActiveDraw): [number, number][] {
    if (!draw.cursor || draw.coords.length === 0) return draw.coords
    return [...draw.coords, draw.cursor]
}

/** 移除所有由本模块创建的临时 entity */
function removeTempEntities(viewer: Cesium.Viewer, draw: ActiveDraw): void {
    viewer.entities.removeById(TEMP_POLYLINE_ID)
    viewer.entities.removeById(TEMP_POLYGON_ID)
    viewer.entities.removeById(CURSOR_ID)
    for (const id of draw.vertexIds) {
        viewer.entities.removeById(id)
    }
    draw.vertexIds = []
}

/** 为顶点添加小圆点标记 */
function addVertexMarker(viewer: Cesium.Viewer, lon: number, lat: number, style: ReturnType<typeof resolveStyle>, draw: ActiveDraw): void {
    const id = `${VERTEX_PREFIX}${draw.vertexIds.length}`
    draw.vertexIds.push(id)
    viewer.entities.add({
        id,
        position: Cesium.Cartesian3.fromDegrees(lon, lat),
        point: {
            pixelSize: style.radius,
            color: style.pointColor,
            outlineColor: style.stroke,
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
    })
}

/** 更新光标跟随点位置 */
function updateCursor(viewer: Cesium.Viewer, coord: [number, number], style: ReturnType<typeof resolveStyle>): void {
    let entity = viewer.entities.getById(CURSOR_ID)
    if (entity) {
        entity.position = new Cesium.ConstantPositionProperty(
            Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
        )
    } else {
        viewer.entities.add({
            id: CURSOR_ID,
            position: Cesium.Cartesian3.fromDegrees(coord[0], coord[1]),
            point: {
                pixelSize: style.radius + 2,
                color: style.pointColor.withAlpha(0.5),
                outlineColor: style.stroke,
                outlineWidth: 1,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
            },
        })
    }
}

/** 同步临时 polyline：使用 CallbackProperty 动态更新 */
function syncTempPolyline(viewer: Cesium.Viewer, style: ReturnType<typeof resolveStyle>): void {
    if (viewer.entities.getById(TEMP_POLYLINE_ID)) return
    viewer.entities.add({
        id: TEMP_POLYLINE_ID,
        polyline: {
            positions: new Cesium.CallbackProperty(() => {
                const d = activeDraws.get(viewer)
                if (!d) return []
                const coords = getRenderCoords(d)
                if (coords.length < 2) return []
                return Cesium.Cartesian3.fromDegreesArray(
                    coords.flatMap(([lon, lat]) => [lon, lat])
                )
            }, false),
            material: style.stroke,
            width: style.strokeWidth,
            clampToGround: true,
        },
    })
}

/** 同步临时 polygon：使用 CallbackProperty 动态更新 */
function syncTempPolygon(viewer: Cesium.Viewer, style: ReturnType<typeof resolveStyle>): void {
    if (viewer.entities.getById(TEMP_POLYGON_ID)) return
    viewer.entities.add({
        id: TEMP_POLYGON_ID,
        polygon: {
            hierarchy: new Cesium.CallbackProperty(() => {
                const d = activeDraws.get(viewer)
                if (!d) return new Cesium.PolygonHierarchy([])
                const coords = getRenderCoords(d)
                if (coords.length < 3) return new Cesium.PolygonHierarchy([])
                return new Cesium.PolygonHierarchy(
                    Cesium.Cartesian3.fromDegreesArray(
                        coords.flatMap(([lon, lat]) => [lon, lat])
                    )
                )
            }, false),
            height: 0,
            material: style.fill,
            outline: true,
            outlineColor: style.stroke,
            outlineWidth: style.strokeWidth,
        },
    })
}

/** 完成绘制：清理临时 entity，创建最终 entity，销毁 handler */
function finishDraw(viewer: Cesium.Viewer, draw: ActiveDraw, style: ReturnType<typeof resolveStyle>): void {
    draw.handler.destroy()
    removeTempEntities(viewer, draw)
    activeDraws.delete(viewer)

    const {coords, type} = draw
    if (coords.length === 0) return

    switch (type) {
        case 'point': {
            const [lon, lat] = coords[0]
            viewer.entities.add({
                point: {
                    pixelSize: style.radius,
                    color: style.pointColor,
                    outlineColor: style.stroke,
                    outlineWidth: 1,
                },
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                properties: {[ENTITY_TAG]: true},
            })
            break
        }
        case 'polyline': {
            if (coords.length < 2) return
            viewer.entities.add({
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(
                        coords.flatMap(([lon, lat]) => [lon, lat])
                    ),
                    material: style.stroke,
                    width: style.strokeWidth,
                    clampToGround: true,
                },
                properties: {[ENTITY_TAG]: true},
            })
            break
        }
        case 'polygon': {
            if (coords.length < 3) return
            const ring = [...coords]
            if (ring.length > 2 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
                ring.push(ring[0])
            }
            viewer.entities.add({
                polygon: {
                    hierarchy: new Cesium.PolygonHierarchy(
                        Cesium.Cartesian3.fromDegreesArray(ring.flatMap(([lon, lat]) => [lon, lat]))
                    ),
                    height: 0,
                    material: style.fill,
                    outline: true,
                    outlineColor: style.stroke,
                    outlineWidth: style.strokeWidth,
                },
                properties: {[ENTITY_TAG]: true},
            })
            break
        }
    }
}

/**
 * Cesium 绘制操作。
 *
 * 职责：在 Cesium Viewer 上实际绘制点、线、面等实体。
 */
export class CesiumDraw {
    /**
     * 开始交互式绘制。
     *
     * 点击地图添加点，双击结束绘制。
     * 同一时刻同一 Viewer 只能有一个绘制交互在进行。
     *
     * @param viewer - Cesium Viewer 实例
     * @param type - 绘制类型：point（单击完成）、polyline / polygon（点击加点、双击结束）
     * @param options - 可选回调和样式
     * @returns 取消函数，调用后可终止当前绘制
     */
    static startDraw(viewer: Cesium.Viewer | null, type: FeatureType, options?: DrawOptions): () => void {
        if (!viewer) return () => {
        }
        // 先停止已有的绘制交互
        CesiumDraw.stopDraw(viewer)
        const style = resolveStyle(options?.style)
        const draw: ActiveDraw = {
            handler: new Cesium.ScreenSpaceEventHandler(viewer.canvas),
            coords: [],
            type,
            vertexIds: [],
        }
        activeDraws.set(viewer, draw)
        let lastClickTime = 0
        // 鼠标移动：更新光标跟随点和临时图形
        draw.handler.setInputAction((move: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
            const coord = pickLonLat(viewer, move.endPosition)
            if (!coord) return
            draw.cursor = coord
            updateCursor(viewer, coord, style)
            if (type === 'polyline' || type === 'polygon') {
                syncTempPolyline(viewer, style)
            }
            if (type === 'polygon') {
                syncTempPolygon(viewer, style)
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        // 点击添加点（过滤掉双击的第二下）
        draw.handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
            const now = Date.now()
            const delta = now - lastClickTime
            lastClickTime = now
            // 如果两次点击间隔 < 300ms，视为双击的第二下，忽略
            if (delta < 300) return
            const coord = pickLonLat(viewer, click.position)
            if (!coord) return
            draw.coords.push(coord)
            draw.cursor = undefined // 点击后重置跟随，等待下一次 MOUSE_MOVE
            options?.onChange?.([...draw.coords])
            // 如果是点类型，单击即完成
            if (type === 'point') {
                finishDraw(viewer, draw, style)
                options?.onComplete?.({type: 'point', coords: draw.coords, style: options?.style})
                return
            }
            // 添加顶点标记（小圆点）
            addVertexMarker(viewer, coord[0], coord[1], style, draw)
            // 确保临时 entity 已创建（CallbackProperty 会自动跟随后续鼠标移动）
            if (type === 'polyline' || type === 'polygon') {
                syncTempPolyline(viewer, style)
            }
            if (type === 'polygon') {
                syncTempPolygon(viewer, style)
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        // 双击结束绘制
        draw.handler.setInputAction(() => {
            lastClickTime = 0
            if (type === 'point') return // 点类型已在单击时完成
            finishDraw(viewer, draw, style)
            options?.onComplete?.({type, coords: [...draw.coords], style: options?.style})
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
        return () => CesiumDraw.stopDraw(viewer)
    }

    /**
     * 停止当前进行中的交互式绘制。
     *
     * @param viewer - Cesium Viewer 实例
     */
    static stopDraw(viewer: Cesium.Viewer | null): void {
        if (!viewer) return
        const draw = activeDraws.get(viewer)
        if (draw) {
            draw.handler.destroy()
            removeTempEntities(viewer, draw)
            activeDraws.delete(viewer)
        }
    }

    /**
     * 在 Viewer 上添加一个绘制实体（非交互式，直接绘制）。
     *
     * @param viewer - Cesium Viewer 实例
     * @param feature - 要素描述信息
     */
    static addFeature(viewer: Cesium.Viewer | null, feature: FeatureInfo): void {
        if (!viewer || !feature.coords.length) return

        if (feature.id) {
            const existing = viewer.entities.getById(feature.id)
            if (existing) viewer.entities.remove(existing)
        }

        const style = resolveStyle(feature.style)

        switch (feature.type) {
            case 'point': {
                const [lon, lat] = feature.coords[0]
                viewer.entities.add({
                    id: feature.id ?? undefined,
                    position: Cesium.Cartesian3.fromDegrees(lon, lat),
                    point: {
                        pixelSize: style.radius,
                        color: style.pointColor,
                        outlineColor: style.stroke,
                        outlineWidth: 1,
                    },
                    properties: {[ENTITY_TAG]: true},
                })
                break
            }

            case 'polyline': {
                viewer.entities.add({
                    id: feature.id ?? undefined,
                    polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArray(
                            feature.coords.flatMap(([lon, lat]) => [lon, lat])
                        ),
                        material: style.stroke,
                        width: style.strokeWidth,
                    },
                    properties: {[ENTITY_TAG]: true},
                })
                break
            }

            case 'polygon': {
                const ring = [...feature.coords]
                if (ring.length > 2 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
                    ring.push(ring[0])
                }
                viewer.entities.add({
                    id: feature.id ?? undefined,
                    polygon: {
                        hierarchy: new Cesium.PolygonHierarchy(
                            Cesium.Cartesian3.fromDegreesArray(ring.flatMap(([lon, lat]) => [lon, lat]))
                        ),
                        height: 0,
                        material: style.fill,
                        outline: true,
                        outlineColor: style.stroke,
                        outlineWidth: style.strokeWidth,
                    },
                    properties: {[ENTITY_TAG]: true},
                })
                break
            }
        }
    }

    /**
     * 根据 ID 移除指定实体。
     *
     * @param viewer - Cesium Viewer 实例
     * @param id - 实体 ID
     */
    static removeFeature(viewer: Cesium.Viewer | null, id: string): void {
        if (!viewer) return
        viewer.entities.removeById(id)
    }

    /**
     * 清除所有绘制实体。
     *
     * @param viewer - Cesium Viewer 实例
     */
    static clearFeatures(viewer: Cesium.Viewer | null): void {
        if (!viewer) return
        const toRemove: string[] = []
        viewer.entities.values.forEach((entity) => {
            if (entity.properties?.[ENTITY_TAG]?.getValue()) {
                if (entity.id) toRemove.push(entity.id)
            }
        })
        toRemove.forEach((id) => viewer.entities.removeById(id))
    }
}
