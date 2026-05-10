import { map } from './map'

// 添加点要素
document.getElementById('btn-add-feature-point')!.addEventListener('click', () => {
  map.addFeature({
    type: 'point',
    id: 'point-1',
    coords: [[104.0668, 30.5728]],
    style: { pointColor: '#ff0000', radius: 4 },
  })
  map.flyTo(104.0668, 30.5728, 12)
})

// 添加线要素
document.getElementById('btn-add-feature-line')!.addEventListener('click', () => {
  map.addFeature({
    type: 'polyline',
    id: 'line-1',
    coords: [
      [104.0568, 30.5628],
      [104.0668, 30.5728],
      [104.0768, 30.5828],
    ],
    style: { stroke: '#00aaff', strokeWidth: 3 },
  })
  map.flyTo(104.0668, 30.5728, 12)
})

// 添加面要素
document.getElementById('btn-add-feature-polygon')!.addEventListener('click', () => {
  map.addFeature({
    type: 'polygon',
    id: 'polygon-1',
    coords: [
      [104.0568, 30.5728],
      [104.0668, 30.5828],
      [104.0768, 30.5728],
      [104.0668, 30.5628],
      [104.0568, 30.5728],
    ],
    style: { fill: 'rgba(0, 170, 255, 0.2)', stroke: '#00aaff', strokeWidth: 2 },
  })
  map.flyTo(104.0668, 30.5728, 12)
})

// 更新要素样式
document.getElementById('btn-update-feature')!.addEventListener('click', () => {
  map.updateFeature('point-1', { pointColor: '#00ff00', radius: 8 })
  map.updateFeature('line-1', { stroke: '#ff0000', strokeWidth: 5 })
  map.updateFeature('polygon-1', { fill: 'rgba(255, 0, 0, 0.3)', stroke: '#ff0000', strokeWidth: 3 })
})

// 编辑面要素
let stopEdit: (() => void) | null = null
document.getElementById('btn-edit-feature')!.addEventListener('click', () => {
  const btn = document.getElementById('btn-edit-feature')!
  if (stopEdit) {
    stopEdit()
    stopEdit = null
    btn.textContent = '编辑要素'
    btn.style.background = ''
    return
  }
  btn.textContent = '结束编辑'
  btn.style.background = '#10b981'
  stopEdit = map.editFeature('polygon-1', {
    onComplete: (feature) => {
      console.log('编辑完成:', feature)
    },
  })
})

// 移除单个要素
document.getElementById('btn-remove-feature')!.addEventListener('click', () => {
  console.log('全部要素', map.getOverlayManager())
  map.removeFeature('point-1')
  map.removeFeature('line-1')
  map.removeFeature('polygon-1')
  console.log('剩余要素', map.getOverlayManager())
})

// 清除所有要素
document.getElementById('btn-clear-features')!.addEventListener('click', () => {
  map.clearFeatures()
})
