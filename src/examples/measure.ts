import { map } from './map'

// 交互式测距
let stopMeasureDist: (() => void) | null = null
document.getElementById('btn-distance')!.addEventListener('click', () => {
  if (stopMeasureDist) {
    stopMeasureDist()
    stopMeasureDist = null
    return
  }
  stopMeasureDist = map.measureDistance!({
    unit: 'km',
    onComplete: (dist, coords) => {
      map.showPopup({
        id: 'popup-measure-dist',
        content: `<strong>测距结果</strong><br>距离: ${dist.toFixed(2)} km`,
        position: coords[0],
      })
      stopMeasureDist = null
    },
  })
})

// 交互式测面
let stopMeasureArea: (() => void) | null = null
document.getElementById('btn-area')!.addEventListener('click', () => {
  if (stopMeasureArea) {
    stopMeasureArea()
    stopMeasureArea = null
    return
  }
  stopMeasureArea = map.measureArea!({
    unit: 'mu',
    onComplete: (area, coords) => {
      const center = coords[Math.floor(coords.length / 2)]
      map.showPopup({
        id: 'popup-measure-area',
        content: `<strong>测面结果</strong><br>面积: ${area.toFixed(2)} 亩`,
        position: center,
      })
      stopMeasureArea = null
    },
  })
})
