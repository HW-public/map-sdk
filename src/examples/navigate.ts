import { map } from './map'

// 飞行到指定位置
document.getElementById('btn-fly')!.addEventListener('click', () => {
  const targets = [
    [116.3974, 39.9093],
    [121.4737, 31.2304],
    [113.2644, 23.1291],
    [120.1551, 30.2741],
  ] as [number, number][]
  const idx = Math.floor(Math.random() * targets.length)
  const [lon, lat] = targets[idx]
  map.flyTo(lon, lat, 12)
})
