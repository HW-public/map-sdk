export function buildTiandituUrls(key: string, layer: string): string[] {
  return ['0', '1', '2', '3', '4', '5', '6', '7'].map(
    (s) =>
      `https://t${s}.tianditu.gov.cn/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${key}`
  )
}
