import { map } from './map'

// 绘制点
document.getElementById('btn-draw-point')!.addEventListener('click', () => {
  map.drawPoint({
    style: { pointColor: '#ff0000', radius: 4 },
    onComplete: (feature) => console.log('绘制点完成:', feature),
  })
})

// 绘制线
document.getElementById('btn-draw-line')!.addEventListener('click', () => {
  map.drawLine({
    style: { stroke: '#00aaff', strokeWidth: 3 },
    onComplete: (feature) => console.log('绘制线完成:', feature),
  })
})

// 绘制面
document.getElementById('btn-draw-polygon')!.addEventListener('click', () => {
  map.drawPolygon({
    style: { fill: 'rgba(255,0,213,0.46)', stroke: '#00aaff', strokeWidth: 2 },
    onComplete: (feature) => console.log('绘制面完成:', feature),
  })
})
