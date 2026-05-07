import {BaseMap, MapSDK} from '@/core'
import { transform } from '@/utils'

const TIANDITU_KEY = 'dd92b4607cb0aadfc5e615028e99968e'

const sdk: MapSDK = new MapSDK()
// 默认 both 模式（SDK 内部自动挂载 2D/3D 切换按钮）
const map: BaseMap = await sdk.init({
    type: 'both',
    container: 'map-single',
    center: [104.0668, 30.5728],
    zoom: 12
})
map.loadTianditu(TIANDITU_KEY, 'tianditu-1')

// 分类按钮展开/收起
document.querySelectorAll('.group-label').forEach((label) => {
    label.addEventListener('click', (e) => {
        const group = (e.currentTarget as HTMLElement).dataset.group
        const content = document.querySelector(`.group-content[data-group="${group}"]`)
        if (!content) return
        const isShow = content.classList.contains('show')
        // 先收起所有
        document.querySelectorAll('.group-content').forEach((el) => el.classList.remove('show'))
        document.querySelectorAll('.group-label').forEach((el) => el.classList.remove('active'))
        // 再展开当前（如果之前没展开）
        if (!isShow) {
            content.classList.add('show')
            ;(e.currentTarget as HTMLElement).classList.add('active')
        }
    })
})
// 点击 toolbar 外部收起
document.addEventListener('click', (e) => {
    const toolbar = document.querySelector('.toolbar')
    if (toolbar && !toolbar.contains(e.target as Node)) {
        document.querySelectorAll('.group-content').forEach((el) => el.classList.remove('show'))
        document.querySelectorAll('.group-label').forEach((el) => el.classList.remove('active'))
    }
})

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
// 更新要素样式
document.getElementById('btn-update-feature')!.addEventListener('click', () => {
    map.updateFeature('point-1', { pointColor: '#00ff00', radius: 8 })
    map.updateFeature('line-1', { stroke: '#ff0000', strokeWidth: 5 })
    map.updateFeature('polygon-1', { fill: 'rgba(255, 0, 0, 0.3)', stroke: '#ff0000', strokeWidth: 3 })
})
// 移除单个要素
document.getElementById('btn-remove-feature')!.addEventListener('click', () => {
    console.log('全部要素',map.getOverlayManager());
    map.removeFeature('point-1')
    map.removeFeature('line-1')
    map.removeFeature('polygon-1')
    console.log('剩余要素',map.getOverlayManager());
})
// 清除所有要素
document.getElementById('btn-clear-features')!.addEventListener('click', () => {
    map.clearFeatures()
})
// 移除天地图图层
document.getElementById('btn-remove-layer')!.addEventListener('click', () => {
    map.removeLayer('tianditu-1')
})
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