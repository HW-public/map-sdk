import { BaseMap, MapSDK } from '@/core'
import { CustomTogglePlugin } from '@/ui'

const sdk: MapSDK = new MapSDK()
const map: BaseMap = await sdk.init({
  type: 'both',
  container: 'map-single',
  center: [104.0668, 30.5728],
  zoom: 12,
})
// name 与默认按钮相同，map.use 会自动卸载默认实现
// onToggle 由 MapSDK 自动注入，无需显式传入
map.use(new CustomTogglePlugin())
export { map, sdk }
