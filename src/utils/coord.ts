const PI = Math.PI
const X_PI = (PI * 3000.0) / 180.0
const A = 6378245.0
const EE = 0.00669342162296594323

function outOfChina(lon: number, lat: number): boolean {
  return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271
}

function transformLat(lon: number, lat: number): number {
  let ret =
    -100.0 +
    2.0 * lon +
    3.0 * lat +
    0.2 * lat * lat +
    0.1 * lon * lat +
    0.2 * Math.sqrt(Math.abs(lon))
  ret += ((20.0 * Math.sin(6.0 * lon * PI) + 20.0 * Math.sin(2.0 * lon * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

function transformLon(lon: number, lat: number): number {
  let ret =
    300.0 + lon + 2.0 * lat + 0.1 * lon * lon + 0.1 * lon * lat + 0.1 * Math.sqrt(Math.abs(lon))
  ret += ((20.0 * Math.sin(6.0 * lon * PI) + 20.0 * Math.sin(2.0 * lon * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lon * PI) + 40.0 * Math.sin((lon / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((lon / 12.0) * PI) + 300.0 * Math.sin((lon / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

/** WGS84 → GCJ-02（火星坐标系） */
export function wgs84ToGcj02(lon: number, lat: number): [number, number] {
  if (outOfChina(lon, lat)) return [lon, lat]
  let dLat = transformLat(lon - 105.0, lat - 35.0)
  let dLon = transformLon(lon - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLon = (dLon * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return [lon + dLon, lat + dLat]
}

/** GCJ-02 → WGS84（迭代法逼近） */
export function gcj02ToWgs84(lon: number, lat: number): [number, number] {
  if (outOfChina(lon, lat)) return [lon, lat]
  let wgsLon = lon
  let wgsLat = lat
  for (let i = 0; i < 5; i++) {
    const gcj = wgs84ToGcj02(wgsLon, wgsLat)
    const dLon = gcj[0] - lon
    const dLat = gcj[1] - lat
    wgsLon -= dLon
    wgsLat -= dLat
    if (Math.abs(dLon) < 1e-6 && Math.abs(dLat) < 1e-6) break
  }
  return [wgsLon, wgsLat]
}

/** GCJ-02 → BD-09（百度坐标系） */
export function gcj02ToBd09(lon: number, lat: number): [number, number] {
  const z = Math.sqrt(lon * lon + lat * lat) + 0.00002 * Math.sin(lat * X_PI)
  const theta = Math.atan2(lat, lon) + 0.000003 * Math.cos(lon * X_PI)
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006]
}

/** BD-09 → GCJ-02 */
export function bd09ToGcj02(lon: number, lat: number): [number, number] {
  const x = lon - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  return [z * Math.cos(theta), z * Math.sin(theta)]
}

/** WGS84 → BD-09 */
export function wgs84ToBd09(lon: number, lat: number): [number, number] {
  const gcj = wgs84ToGcj02(lon, lat)
  return gcj02ToBd09(gcj[0], gcj[1])
}

/** BD-09 → WGS84 */
export function bd09ToWgs84(lon: number, lat: number): [number, number] {
  const gcj = bd09ToGcj02(lon, lat)
  return gcj02ToWgs84(gcj[0], gcj[1])
}

/** 支持的坐标系 */
export type CoordSystem = 'wgs84' | 'gcj02' | 'bd09'

/**
 * 通用坐标转换。
 *
 * @param lon 经度
 * @param lat 纬度
 * @param from 源坐标系
 * @param to 目标坐标系
 * @returns [经度, 纬度]
 */
export function transform(
  lon: number,
  lat: number,
  from: CoordSystem,
  to: CoordSystem,
): [number, number] {
  if (from === to) return [lon, lat]

  switch (from) {
    case 'wgs84':
      switch (to) {
        case 'gcj02':
          return wgs84ToGcj02(lon, lat)
        case 'bd09':
          return wgs84ToBd09(lon, lat)
      }
      break
    case 'gcj02':
      switch (to) {
        case 'wgs84':
          return gcj02ToWgs84(lon, lat)
        case 'bd09':
          return gcj02ToBd09(lon, lat)
      }
      break
    case 'bd09':
      switch (to) {
        case 'wgs84':
          return bd09ToWgs84(lon, lat)
        case 'gcj02':
          return bd09ToGcj02(lon, lat)
      }
      break
  }
  return [lon, lat]
}

/**
 * 批量坐标转换。
 *
 * @param coords 坐标数组 [[lon, lat], ...]
 * @param from 源坐标系
 * @param to 目标坐标系
 * @returns 转换后的坐标数组
 */
export function transformCoords(
  coords: [number, number][],
  from: CoordSystem,
  to: CoordSystem,
): [number, number][] {
  return coords.map(([lon, lat]) => transform(lon, lat, from, to))
}
