import { BaseMap } from '@/core/BaseMap'
import type { MapPlugin } from '@/core/Plugin'

/**
 * OlCameraControlPlugin — 2D 模式下相机姿态控制的无操作占位插件。
 *
 * 3D 专属方法 setPitch / setHeading 在 2D 下无实际意义，
 * 此插件提供空实现并打印警告，避免用户调用时抛错。
 */
export class OlCameraControlPlugin implements MapPlugin {
  readonly name = 'camera'
  readonly engine = '2d' as const

  install(map: BaseMap): void {
    const m = map as any
    m.setPitch = (_degrees: number) => {
      console.warn('[map-sdk] setPitch is only available in 3D mode')
    }
    m.setHeading = (_degrees: number) => {
      console.warn('[map-sdk] setHeading is only available in 3D mode')
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    delete m.setPitch
    delete m.setHeading
  }
}
