import { map } from './map'

// 显示弹窗
document.getElementById('btn-show-popup')!.addEventListener('click', () => {
  map.showPopup({
    id: 'popup-1',
    content: '<strong>成都市</strong><br>经度: 104.0668<br>纬度: 30.5728',
    position: [104.0668, 30.5728],
    onClose: () => console.log('弹窗已关闭'),
  })
})

// 清除所有弹窗
document.getElementById('btn-clear-popups')!.addEventListener('click', () => {
  map.clearPopups()
})
