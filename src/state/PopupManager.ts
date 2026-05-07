import type { PopupOptions } from '@/types'

export class PopupManager {
  private popups: PopupOptions[] = []

  add(options: PopupOptions): void {
    if (options.id) {
      this.popups = this.popups.filter((p) => p.id !== options.id)
    }
    this.popups.push(options)
  }

  remove(id: string): void {
    this.popups = this.popups.filter((p) => p.id !== id)
  }

  getAll(): PopupOptions[] {
    return [...this.popups]
  }

  restore(popups: PopupOptions[]): void {
    this.popups = [...popups]
  }

  clear(): void {
    this.popups = []
  }
}
