import { map } from './map'
import { transform, distance, polygonArea } from '@/utils'

// 坐标转换测试
document.getElementById('btn-coord')!.addEventListener('click', () => {
  const wgs = [104.0668, 30.5728] as [number, number]
  const gcj = transform(wgs[0], wgs[1], 'wgs84', 'gcj02')
  const bd = transform(wgs[0], wgs[1], 'wgs84', 'bd09')
  map.showPopup({
    id: 'popup-coord',
    content: `<strong>坐标转换（成都市）</strong><br>WGS84: ${wgs[0].toFixed(4)}, ${wgs[1].toFixed(4)}<br>GCJ-02: ${gcj[0].toFixed(4)}, ${gcj[1].toFixed(4)}<br>BD-09: ${bd[0].toFixed(4)}, ${bd[1].toFixed(4)}`,
    position: wgs,
  })
})

// 测距：成都 → 北京
document.getElementById('btn-distance')!.addEventListener('click', () => {
  const chengdu: [number, number] = [104.0668, 30.5728]
  const beijing: [number, number] = [116.3974, 39.9093]
  const d = distance(chengdu, beijing, 'km')
  map.showPopup({
    id: 'popup-dist',
    content: `<strong>测距结果</strong><br>成都 → 北京<br>距离: ${d.toFixed(2)} km`,
    position: chengdu,
  })
})

// 测面：示例多边形面积
document.getElementById('btn-area')!.addEventListener('click', () => {
  const coords: [number, number][] = [
    [104.0568, 30.5728],
    [104.0668, 30.5828],
    [104.0768, 30.5728],
    [104.0668, 30.5628],
    [104.0568, 30.5728],
  ]
  const area = polygonArea(coords, 'mu')
  map.showPopup({
    id: 'popup-area',
    content: `<strong>测面结果</strong><br>示例多边形<br>面积: ${area.toFixed(2)} 亩`,
    position: [104.0668, 30.5728],
  })
})
