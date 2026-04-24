import { getElement } from '@/utils'

type ToggleType = '2d' | '3d'

export class MapToggleBtn {
  private btn: HTMLElement | null = null
  private readonly onToggle: (type: ToggleType) => void

  constructor(
    container: string | HTMLElement,
    onToggle: (type: ToggleType) => void
  ) {
    this.onToggle = onToggle
    const el = getElement(container)

    const btn = document.createElement('div')
    btn.className = 'map-toggle-btn'
    btn.textContent = '3D'

    btn.addEventListener('click', () => {
      const currentIs2d = this.btn?.textContent === '3D'
      this.onToggle(currentIs2d ? '3d' : '2d')
    })

    el.appendChild(btn)
    this.btn = btn
  }

  updateText(currentType: ToggleType): void {
    if (this.btn) {
      this.btn.textContent = currentType === '2d' ? '3D' : '2D'
    }
  }

  destroy(): void {
    if (this.btn) {
      this.btn.remove()
      this.btn = null
    }
  }
}
