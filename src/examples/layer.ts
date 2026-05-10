import { map } from './map'

// 移除天地图图层
document.getElementById('btn-remove-layer')!.addEventListener('click', () => {
  map.removeLayer('tianditu-1')
})

// 图层可见性/透明度
document.getElementById('btn-layer-hide')!.addEventListener('click', () => {
  map.setLayerVisible('tianditu-1', false)
})
document.getElementById('btn-layer-show')!.addEventListener('click', () => {
  map.setLayerVisible('tianditu-1', true)
})
document.getElementById('btn-layer-opacity-half')!.addEventListener('click', () => {
  map.setLayerOpacity('tianditu-1', 0.3)
})
document.getElementById('btn-layer-opacity-full')!.addEventListener('click', () => {
  map.setLayerOpacity('tianditu-1', 1)
})
