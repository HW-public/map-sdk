import { map } from './map'

let disableSelect: (() => void) | null = null

// 点选模式
function enablePointSelect(): void {
  disableSelect?.()
  disableSelect = map.enableSelect({
    mode: 'point',
    onSelect: (features) => {
      if (features.length === 0) {
        console.log('点选：未选中任何要素')
        return
      }
      const f = features[0]
      console.log('点选选中:', f.id, f.type)
      map.showPopup({
        id: 'popup-select',
        content: `<strong>点选结果</strong><br>ID: ${f.id ?? '无'}<br>类型: ${f.type}`,
        position: f.coords[0],
      })
    },
  })
}

// 框选模式
function enableBoxSelect(): void {
  disableSelect?.()
  disableSelect = map.enableSelect({
    mode: 'box',
    onSelect: (features) => {
      console.log('框选选中:', features.length, '个要素')
      if (features.length > 0) {
        map.showPopup({
          id: 'popup-select',
          content: `<strong>框选结果</strong><br>共选中 ${features.length} 个要素`,
          position: features[0].coords[0],
        })
      }
    },
  })
}

// 绑定按钮
const btnPoint = document.getElementById('btn-select-point')
const btnBox = document.getElementById('btn-select-box')
const btnStop = document.getElementById('btn-select-stop')

btnPoint?.addEventListener('click', () => {
  enablePointSelect()
  btnPoint.textContent = '点选（已启用）'
  btnBox && (btnBox.textContent = '框选')
})

btnBox?.addEventListener('click', () => {
  enableBoxSelect()
  btnBox.textContent = '框选（已启用）'
  btnPoint && (btnPoint.textContent = '点选')
})

btnStop?.addEventListener('click', () => {
  disableSelect?.()
  disableSelect = null
  if (btnPoint) btnPoint.textContent = '点选'
  if (btnBox) btnBox.textContent = '框选'
  console.log('选择模式已停止')
})
