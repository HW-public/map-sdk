import type { MapEvent, MapState } from './map'
export type { MapType, MapConfig, MapEvent, MapState } from './map'
export type { LayerInfo, TiandituLayerInfo } from './layer'
export type { FeatureType, FeatureInfo, DrawOptions, PickResult, EditOptions, SelectMode, SelectOptions, SelectResult } from './feature'
export type { PopupOptions } from './popup'
export type { MeasureDistanceOptions, MeasureAreaOptions } from './measure'

export interface SwitchToOptions {
  state?: boolean
  layers?: boolean | string[]
  features?: boolean
  popups?: boolean
  events?: boolean
}

/**
 * IMap — 地图引擎的**核心服务接口**。
 *
 * 职责：定义所有引擎必须实现的**最基础能力**。
 * 包含：生命周期、视角控制（中心点/缩放/飞行）、事件、状态读写。
 *
 * 不包含（由 BaseMap 扩展提供）：
 * - 图层管理（addLayer / removeLayer / setLayerVisible）— 基类默认实现
 * - 绘制要素（addFeature / removeFeature）— 基类默认实现
 *
 * 不包含（由插件动态挂载）：
 * - 交互绘制（drawPoint / drawLine / drawPolygon）— DrawPlugin
 * - 要素编辑（editFeature）— EditPlugin
 * - 点选查询（pickAtPixel）— PickPlugin
 * - 测量（measureDistance / measureArea）— MeasurePlugin
 * - 信息弹窗（showPopup / hidePopup / clearPopups）— PopupPlugin
 */
export interface IMap {
  destroy(): void
  setCenter(lon: number, lat: number): void
  getCenter(): [number, number] | undefined
  setZoom(zoom: number): void
  getZoom(): number | undefined
  flyTo(lon: number, lat: number, zoom?: number): void
  on(event: string, callback: (e: MapEvent) => void): void
  off(event: string, callback: (e: MapEvent) => void): void
  getState(): MapState
  setState(state: Partial<MapState>): void
}
