# MapSDK 二三维地图 SDK

基于 Vite + TypeScript 构建的二三维一体化地图 SDK，2D 使用 OpenLayers，3D 使用 Cesium，**底图默认使用天地图**。

## 技术栈

- **构建工具**: Vite
- **语言**: TypeScript
- **运行环境**: Node.js >= 18.0.0
- **2D 引擎**: OpenLayers
- **3D 引擎**: Cesium
- **底图服务**: 天地图
- **插件**: vite-plugin-cesium

## 项目结构

```
src/
├── core/
│   ├── BaseMap.ts      # 抽象基类，实现 IMap / IMapLayers / IMapOverlays
│   ├── MapSDK.ts       # SDK 入口，工厂模式 + 2D/3D 切换管理
│   └── index.ts        # core 模块导出
├── ol/
│   ├── OlMap.ts        # OpenLayers 2D 引擎实现
│   ├── layers/
│   │   └── addTianditu.ts  # OL 天地图图层加载
│   ├── operation/
│   │   ├── Draw.ts     # 点、线、面绘制
│   │   ├── Select.ts   # 点选、框选
│   │   └── index.ts
│   ├── utils.ts        # OL 工具函数
│   └── index.ts        # ol 模块导出
├── cesium/
│   ├── CesiumMap.ts    # Cesium 3D 引擎实现
│   ├── layers/
│   │   └── addTianditu.ts  # Cesium 天地图图层加载
│   ├── operation/
│   │   ├── Draw.ts     # 点、线、面绘制
│   │   ├── Select.ts   # 点选、框选
│   │   └── index.ts
│   ├── utils.ts        # Cesium 工具函数
│   └── index.ts        # cesium 模块导出
├── state/
│   ├── StateManager.ts # 地图状态、跨切换事件缓存
│   ├── LayerManager.ts # 图层记录与恢复
│   ├── OverlayManager.ts # 绘制要素记录与恢复
│   └── index.ts        # state 模块导出
├── ui/
│   └── MapToggleBtn.ts # 2D/3D 切换按钮
├── types/
│   └── index.ts        # TypeScript 类型定义
├── utils/
│   └── index.ts        # 通用工具函数
├── index.ts            # SDK 对外导出
└── main.ts             # 示例页面入口
```

## 安装依赖

**要求 Node.js >= 18.0.0**

```bash
npm install
```

## 开发启动

```bash
npm run dev
```

服务默认启动在 http://localhost:3000

## 生产构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

## 申请天地图 Key

本 SDK 使用天地图作为底图，**使用前需要先申请 Key**。

1. 访问 [天地图控制台](https://console.tianditu.gov.cn/api/key)
2. 注册账号并创建应用
3. 获取 Key 后通过 `map.loadTianditu(key)` 加载底图

## 快速使用

### 1. 创建 2D 地图

```typescript
import { MapSDK } from '@/core/MapSDK'

const sdk = new MapSDK()
const map = await sdk.init({
  type: '2d',
  container: 'map-container',
  center: [116.3974, 39.9093],
  zoom: 12,
})

map.loadTianditu('YOUR_TIANDITU_KEY')
```

### 2. 创建 3D 地图

```typescript
import { MapSDK } from '@/core/MapSDK'

const sdk = new MapSDK()
const map = await sdk.init({
  type: '3d',
  container: 'map-container',
  center: [116.3974, 39.9093],
  zoom: 12,
})

map.loadTianditu('YOUR_TIANDITU_KEY')
```

### 3. 创建 2D/3D 切换地图（both 模式）

```typescript
import { MapSDK } from '@/core/MapSDK'

const sdk = new MapSDK()
const map = await sdk.init({
  type: 'both',
  container: 'map-container',
  center: [116.3974, 39.9093],
  zoom: 12,
})

map.loadTianditu('YOUR_TIANDITU_KEY')

// 点击右上角按钮可在 2D 与 3D 之间切换
// 切换时自动同步：视角、图层、绘制要素、事件监听
```

### 4. 手动切换引擎

```typescript
// 从 2D 切换到 3D（默认同步所有状态）
const map3d = await sdk.switchTo('3d')

// 只同步视角状态，不恢复图层和要素
const map3d = await sdk.switchTo('3d', {
  layers: false,
  features: false,
})

// 只同步天地图图层
const map3d = await sdk.switchTo('3d', {
  layers: ['tianditu'],
})
```

### 5. 地图操作

```typescript
// 设置中心点
map.setCenter(121.4737, 31.2304)

// 获取当前中心点
const center = map.getCenter()

// 设置缩放级别
map.setZoom(15)

// 获取当前缩放级别
const zoom = map.getZoom()

// 获取完整状态
const state = map.getState() // { center: [lon, lat], zoom: number }

// 恢复状态
map.setState({ center: [120.1551, 30.2741], zoom: 14 })

// 飞行定位（带动画）
map.flyTo(120.1551, 30.2741, 14)

// 事件监听（通过 SDK 注册可跨切换持久化）
sdk.on('click', (e) => {
  console.log('点击坐标:', e.coordinate)
})

// 解绑事件
sdk.off('click', handler)

// 销毁地图
sdk.destroy()
```

### 6. 添加绘制要素

```typescript
map.addFeature({
  type: 'point',
  coords: [[116.3974, 39.9093]],
  id: 'beijing',
  style: { color: '#ff0000' },
})

map.addFeature({
  type: 'polyline',
  coords: [
    [116.3974, 39.9093],
    [121.4737, 31.2304],
  ],
})

// 清除所有绘制要素
map.clearFeatures()
```

## API 文档

### MapConfig

地图初始化配置接口：

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| container | `string \| HTMLElement` | 是 | 容器 ID 或 DOM 元素 |
| type | `'2d' \| '3d' \| 'both'` | 是 | 地图类型 |
| center | `[number, number]` | 否 | 初始中心点 [lon, lat]，默认北京 |
| zoom | `number` | 否 | 初始缩放级别，默认 10 |

### IMap 接口

所有地图实例均实现此核心服务接口：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| destroy | - | `void` | 销毁地图 |
| setCenter | `lon, lat` | `void` | 设置中心点 |
| getCenter | - | `[number, number] \| undefined` | 获取中心点 |
| setZoom | `zoom` | `void` | 设置缩放级别 |
| getZoom | - | `number \| undefined` | 获取缩放级别 |
| flyTo | `lon, lat, zoom?` | `void` | 飞行定位 |
| on | `event, callback` | `void` | 绑定事件 |
| off | `event, callback` | `void` | 解绑事件 |
| getState | - | `MapState` | 获取当前状态 |
| setState | `state` | `void` | 恢复状态 |

### IMapLayers 接口

图层功能接口：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| loadTianditu | `key` | `void` | 加载天地图底图 |

### IMapOverlays 接口

绘制功能接口：

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| addFeature | `feature` | `void` | 添加绘制要素 |
| clearFeatures | - | `void` | 清除所有绘制要素 |

### MapEvent

地图事件对象：

| 属性 | 类型 | 说明 |
|------|------|------|
| type | `string` | 事件类型 |
| coordinate | `[number, number]` | 地理坐标 [lon, lat] |
| pixel | `[number, number]` | 屏幕像素坐标 |

### 支持的事件

| 事件 | 说明 |
|------|------|
| `click` | 左键单击 |
| `dblclick` | 左键双击 |
| `rightclick` | 右键单击 |
| `mousemove` | 鼠标移动 |

### MapSDK 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| init | `config` | `Promise<OlMap \| CesiumMap \| BaseMap>` | 初始化地图 |
| switchTo | `type, options?` | `Promise<OlMap \| CesiumMap>` | 切换引擎 |
| on | `event, callback` | `void` | 注册跨切换持久化事件 |
| off | `event, callback` | `void` | 注销跨切换持久化事件 |
| getMap | - | `BaseMap \| null` | 获取当前引擎实例 |
| destroy | - | `void` | 销毁 SDK 及引擎 |

### SwitchToOptions

引擎切换时的同步控制选项：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| state | `boolean` | `true` | 是否同步地图状态（中心点、缩放） |
| layers | `boolean \| string[]` | `true` | 是否同步图层。`true` 全部同步，`string[]` 按类型过滤 |
| features | `boolean` | `true` | 是否同步绘制要素 |
| events | `boolean` | `true` | 是否同步跨切换事件监听 |

## 底图说明

SDK 默认加载天地图 **影像底图 + 影像注记** 两层叠加：

| 图层 | 类型 | 用途 |
|------|------|------|
| img_w | 影像底图 | 卫星影像 |
| cia_w | 影像注记 | 道路、地名标注 |

如需切换为矢量底图，可修改 `src/ol/layers/addTianditu.ts` 和 `src/cesium/layers/addTianditu.ts` 中的图层代码：

- 矢量底图：`vec_w`
- 矢量注记：`cva_w`

## 扩展开发

### 添加自定义 2D 图层

```typescript
import { OlMap } from '@/ol/OlMap'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'

class CustomOlMap extends OlMap {
  addCustomLayer() {
    const olMap = this.getOlMap()
    if (!olMap) return
    olMap.addLayer(new TileLayer({
      source: new XYZ({
        url: 'https://example.com/tile/{z}/{x}/{y}.png'
      })
    }))
  }
}
```

### 添加自定义 3D 实体

```typescript
import { CesiumMap } from '@/cesium/CesiumMap'
import * as Cesium from 'cesium'

class CustomCesiumMap extends CesiumMap {
  addPoint(lon: number, lat: number) {
    const viewer = this.getViewer()
    if (!viewer) return
    viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
      }
    })
  }
}
```

## 注意事项

1. **天地图 Key**：使用前必须申请天地图 Key，并通过 `map.loadTianditu(key)` 加载底图，否则底图无法加载。
2. **体积优化**：Cesium 资源较大，建议按需加载或配置 CDN。
3. **跨域**：天地图瓦片服务支持 CORS，已配置 `crossOrigin: 'anonymous'`。
4. **事件持久化**：在 `both` 模式下，建议通过 `sdk.on()` / `sdk.off()` 注册事件，切换引擎后会自动重新绑定；直接调用 `map.on()` 的事件在切换后会失效。
5. **Cesium off**：Cesium 引擎的 `off()` 当前为无操作（handler 未做跟踪回收），切换引擎时会通过销毁实例自动释放。
