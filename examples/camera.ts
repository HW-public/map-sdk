import { map } from './map'

// 俯视 45°
document.getElementById('btn-pitch-down')!.addEventListener('click', () => {
  map.setPitch!(-45)
  console.log('俯仰角已设置为 -45°（俯视）')
})

// 恢复水平视角
document.getElementById('btn-pitch-level')!.addEventListener('click', () => {
  map.setPitch!(0)
  console.log('俯仰角已设置为 0°（水平）')
})

// 方位角朝东
document.getElementById('btn-heading-east')!.addEventListener('click', () => {
  map.setHeading!(90)
  console.log('方位角已设置为 90°（朝东）')
})
