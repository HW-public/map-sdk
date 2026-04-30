import {BaseMap, MapSDK} from '@/core'

const TIANDITU_KEY = 'dd92b4607cb0aadfc5e615028e99968e'

const sdk: MapSDK = new MapSDK()
// 默认 both 模式（SDK 内部自动挂载 2D/3D 切换按钮）
const map: BaseMap = await sdk.init({
    type: 'both',
    container: 'map-single',
    center: [104.0668, 30.5728],
    zoom: 12
})
map.loadTianditu(TIANDITU_KEY)
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
    console.log(map)
    map.flyTo(lon, lat, 12)
})
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
        style: { fill: 'rgba(0, 170, 255, 0.2)', stroke: '#00aaff', strokeWidth: 2 },
        onComplete: (feature) => console.log('绘制面完成:', feature),
    })
})
// 添加点要素
document.getElementById('btn-add-feature-point')!.addEventListener('click', () => {
    map.addFeature({
        type: 'point',
        id: 'point-1',
        coords: [[104.0668, 30.5728]],
        style: { pointColor: '#ff0000', radius: 4 }
    })
    map.flyTo(104.0668, 30.5728, 12)
})
// 添加线要素
document.getElementById('btn-add-feature-line')!.addEventListener('click', () => {
    map.addFeature({
        type: 'polyline',
        id: 'line-1',
        coords: [[104.0568, 30.5628], [104.0668, 30.5728], [104.0768, 30.5828]],
        style: { stroke: '#00aaff', strokeWidth: 3 }
    })
    map.flyTo(104.0668, 30.5728, 12)
})
// 添加面要素
document.getElementById('btn-add-feature-polygon')!.addEventListener('click', () => {
    map.addFeature({
        type: 'polygon',
        id: 'polygon-1',
        coords: [[104.0568, 30.5728], [104.0668, 30.5828], [104.0768, 30.5728], [104.0668, 30.5628], [104.0568, 30.5728]],
        style: { fill: 'rgba(0, 170, 255, 0.2)', stroke: '#00aaff', strokeWidth: 2 }
    })
    map.flyTo(104.0668, 30.5728, 12)
})