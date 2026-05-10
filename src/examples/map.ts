import { BaseMap, MapSDK } from '@/core'

const sdk: MapSDK = new MapSDK()
const map: BaseMap = await sdk.init({
  type: 'both',
  container: 'map-single',
  center: [104.0668, 30.5728],
  zoom: 12,
})

export { map, sdk }
