export type MapType = '2d' | '3d' | 'both'

export interface MapConfig {
  container: string | HTMLElement
  center?: [number, number]
  zoom?: number
  type: MapType
}

export interface MapEvent {
  type: string
  coordinate: [number, number]
  pixel: [number, number]
}

export interface MapState {
  center: [number, number]
  zoom: number
}
