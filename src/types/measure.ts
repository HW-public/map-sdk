export interface MeasureDistanceOptions {
  unit?: 'm' | 'km' | 'miles' | 'nmi'
  onComplete?: (distance: number, coords: [number, number][]) => void
}

export interface MeasureAreaOptions {
  unit?: 'm2' | 'km2' | 'hectare' | 'mu'
  onComplete?: (area: number, coords: [number, number][]) => void
}
