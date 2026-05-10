import { map, sdk } from './map'

let isPickMode = false
document.getElementById('btn-pick')!.addEventListener('click', () => {
  isPickMode = !isPickMode
  const btn = document.getElementById('btn-pick')!
  btn.textContent = isPickMode ? '退出查询' : '点选查询'
  btn.style.background = isPickMode ? '#10b981' : ''
})

sdk.on('click', (e) => {
  if (!isPickMode) return
  const results = map.pickAtPixel(e.pixel)
  if (results.length > 0) {
    const r = results[0]
    map.showPopup({
      id: 'popup-pick',
      content: `<strong>拾取到要素</strong><br>ID: ${r.id ?? '无'}<br>类型: ${r.type}`,
      position: e.coordinate,
    })
  }
})
