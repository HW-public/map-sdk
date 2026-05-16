import * as Cesium from 'cesium'
import { BaseMap } from '@/core/BaseMap'
import type { MapPlugin } from '@/core/Plugin'

/**
 * CesiumCameraControlPlugin — Cesium 3D 相机姿态控制插件。
 *
 * 提供 setPitch(degrees) / setHeading(degrees) 方法，
 * 控制相机俯仰角和方位角（单位：度）。
 * 仅对 Cesium 引擎生效；未安装时调用会抛错提示。
 */
export class CesiumCameraControlPlugin implements MapPlugin {
  readonly name = 'camera'
  readonly engine = '3d' as const

  install(map: BaseMap): void {
    const m = map as any
    const viewer = m.getViewer() as Cesium.Viewer

    m.setPitch = (degrees: number) => {
      const hpr = new Cesium.HeadingPitchRoll(
        viewer.camera.heading,
        Cesium.Math.toRadians(degrees),
        viewer.camera.roll
      )
      viewer.camera.setView({ orientation: hpr })
    }

    m.setHeading = (degrees: number) => {
      const hpr = new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(degrees),
        viewer.camera.pitch,
        viewer.camera.roll
      )
      viewer.camera.setView({ orientation: hpr })
    }
  }

  uninstall(map: BaseMap): void {
    const m = map as any
    delete m.setPitch
    delete m.setHeading
  }
}
