import { BaseMap, MapSDK } from '@/core'

const TIANDITU_KEY = 'dd92b4607cb0aadfc5e615028e99968e'

const sdk: MapSDK = new MapSDK()
const map: BaseMap = await sdk.init({
  type: 'both',
  container: 'map-single',
  center: [104.0668, 30.5728],
  zoom: 12,
})
map.loadTianditu(TIANDITU_KEY, 'tianditu-1')

export { map, sdk }
