const PI = Math.PI
const R = 6371008.8

function toRad(deg: number): number {
  return (deg * PI) / 180.0
}

/**
 * 长度单位。
 *
 * - `m`：米
 * - `km`：公里
 * - `miles`：英里
 * - `nmi`：海里（nautical mile）
 */
export type LengthUnit = 'm' | 'km' | 'miles' | 'nmi'

/**
 * 面积单位。
 *
 * - `m2`：平方米
 * - `km2`：平方公里
 * - `hectare`：公顷
 * - `mu`：亩
 */
export type AreaUnit = 'm2' | 'km2' | 'hectare' | 'mu'

const LENGTH_FACTORS: Record<LengthUnit, number> = {
  m: 1,
  km: 1000,
  miles: 1609.344,
  nmi: 1852,
}

const AREA_FACTORS: Record<AreaUnit, number> = {
  m2: 1,
  km2: 1_000_000,
  hectare: 10_000,
  mu: 666.666_666_666_666,
}

function convertLength(meters: number, unit: LengthUnit): number {
  return meters / LENGTH_FACTORS[unit]
}

function convertArea(sqMeters: number, unit: AreaUnit): number {
  return sqMeters / AREA_FACTORS[unit]
}

/**
 * 计算两点间球面距离（Haversine 公式）。
 *
 * @param p1 起点 [lon, lat]
 * @param p2 终点 [lon, lat]
 * @param unit 输出单位，默认 'm'
 * @returns 距离值
 */
export function distance(
  p1: [number, number],
  p2: [number, number],
  unit: LengthUnit = 'm',
): number {
  const dLat = toRad(p2[1] - p1[1])
  const dLon = toRad(p2[0] - p1[0])
  const lat1 = toRad(p1[1])
  const lat2 = toRad(p2[1])

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const meters = R * c

  return convertLength(meters, unit)
}

/**
 * 计算折线总长度。
 *
 * @param coords 坐标点数组 [[lon, lat], ...]
 * @param unit 输出单位，默认 'm'
 * @returns 总长度
 */
export function lineLength(
  coords: [number, number][],
  unit: LengthUnit = 'm',
): number {
  if (coords.length < 2) return 0
  let meters = 0
  for (let i = 0; i < coords.length - 1; i++) {
    meters += distance(coords[i], coords[i + 1], 'm')
  }
  return convertLength(meters, unit)
}

/**
 * 计算球面多边形面积（基于球面 excess 算法）。
 *
 * 坐标顺序：顺时针或逆时针均可，首尾相同或不同均可。
 *
 * @param coords 多边形顶点数组 [[lon, lat], ...]
 * @param unit 输出单位，默认 'm2'
 * @returns 面积值（始终为正）
 */
export function polygonArea(
  coords: [number, number][],
  unit: AreaUnit = 'm2',
): number {
  const len = coords.length
  if (len < 3) return 0

  let area = 0
  for (let i = 0; i < len; i++) {
    let lowerIndex: number
    let middleIndex: number
    let upperIndex: number

    if (i === len - 2) {
      lowerIndex = len - 2
      middleIndex = len - 1
      upperIndex = 0
    } else if (i === len - 1) {
      lowerIndex = len - 1
      middleIndex = 0
      upperIndex = 1
    } else {
      lowerIndex = i
      middleIndex = i + 1
      upperIndex = i + 2
    }

    const p1 = coords[lowerIndex]
    const p2 = coords[middleIndex]
    const p3 = coords[upperIndex]

    area += (toRad(p3[0]) - toRad(p1[0])) * Math.sin(toRad(p2[1]))
  }

  const sqMeters = Math.abs((area * R * R) / 2)
  return convertArea(sqMeters, unit)
}
