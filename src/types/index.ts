import type { MapEvent, MapState } from './map'
export type { MapType, MapConfig, MapEvent, MapState } from './map'
export type { LayerInfo, TiandituLayerInfo } from './layer'
export type { FeatureType, FeatureInfo, DrawOptions } from './feature'
export type { PopupOptions } from './popup'

export interface SwitchToOptions {
  state?: boolean
  layers?: boolean | string[]
  features?: boolean
  popups?: boolean
  events?: boolean
}

/**
 * IMap — 地图引擎的**服务接口**。
 *
 * 职责：定义引擎必须实现的**核心基础能力**。
 * 包含：生命周期、视角控制（中心点/缩放/飞行）、事件、状态读写。
 *
 * 不包含：图层加载、绘制要素、3D 独有方法。
 * 这些属于 IMapLayers / IMapOverlays 功能接口。
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
