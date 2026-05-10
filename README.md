# MapSDK 二三维地图 SDK

基于 Vite + TypeScript 构建的二三维一体化地图 SDK，2D 使用 OpenLayers，3D 使用 Cesium，**底图默认使用天地图**。

## 技术栈

- **构建工具**: Vite
- **语言**: TypeScript
- **运行环境**: Node.js >= 20.19.0
- **2D 引擎**: OpenLayers
- **3D 引擎**: Cesium
- **底图服务**: 天地图
- **插件**: vite-plugin-cesium

## 项目结构

```
src/
├── core/
│   ├── BaseMap.ts      # 抽象基类，定义 IMap 核心服务 + 功能方法默认实现
│   ├── MapSDK.ts       # SDK 入口，工厂模式 + 2D/3D 切换管理
│   └── index.ts        # core 模块导出
├── ol/
│   ├── OlMap.ts        # OpenLayers 2D 引擎实现
│   ├── layers/
│   │   └── addTianditu.ts  # OL 天地图图层加载模块
│   ├── operation/
│   │   ├── Draw.ts     # 点、线、面交互绘制
│   │   ├── Select.ts   # 点选、框选
│   │   ├── Edit.ts     # 要素编辑（Modify 交互）
│   │   └── index.ts
│   └── index.ts        # ol 模块导出
├── cesium/
│   ├── CesiumMap.ts    # Cesium 3D 引擎实现
│   ├── layers/
│   │   └── addTianditu.ts  # Cesium 天地图图层加载模块
│   ├── operation/
│   │   ├── Draw.ts     # 点、线、面交互绘制
│   │   ├── Select.ts   # 点选、框选
│   │   ├── Edit.ts     # 要素编辑（手动拖拽）
│   │   └── index.ts
│   └── index.ts        # cesium 模块导出
├── state/
│   ├── StateManager.ts # 地图状态、跨切换事件缓存
│   ├── LayerManager.ts # 图层记录与恢复
│   ├── OverlayManager.ts # 绘制要素记录与恢复（同 id 自动去重）
│   └── index.ts        # state 模块导出
├── examples/
│   ├── map.ts          # 地图初始化（top-level await）
│   ├── toolbar.ts      # 工具栏 UI 交互
│   ├── pick.ts         # 点选查询示例
│   ├── measure.ts      # 坐标转换 / 测距 / 测面
│   ├── navigate.ts     # 飞行定位示例
│   ├── draw.ts         # 交互绘制示例
│   ├── feature.ts      # 要素增删改查示例
│   ├── layer.ts        # 图层控制示例
│   └── popup.ts        # 弹窗示例
├── ui/
│   └── MapToggleBtn.ts # 2D/3D 切换按钮
├── types/
│   ├── map.ts          # MapType / MapConfig / MapEvent / MapState
│   ├── layer.ts        # LayerInfo / TiandituLayerInfo
│   ├── feature.ts      # FeatureType / FeatureInfo / DrawOptions
│   └── index.ts        # 统一导出 + SwitchToOptions / IMap
├── utils/
│   └── index.ts        # 通用工具函数
├── index.ts            # SDK 对外导出
└── main.ts             # 示例入口，聚合 examples/ 各模块
```

## 安装依赖

**要求 Node.js >= 20.19.0**

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

## 功能清单

### 已实现

| 模块 | 功能 | 说明 |
|------|------|------|
| 核心 | 地图初始化 | 支持 `2d` / `3d` / `both` 三种模式 |
| 核心 | 2D/3D 引擎切换 | `switchTo()` 自动同步视角、图层、要素、事件 |
| 核心 | 视角控制 | setCenter / getCenter / setZoom / getZoom / flyTo / getState / setState |
| 核心 | 事件系统 | click / dblclick / rightclick / mousemove，跨切换持久化 |
| 图层 | 天地图底图 | `loadTianditu(key, id)` 加载影像底图 + 注记，必须指定 ID |
| 图层 | 图层移除 | `removeLayer(id)` 按 ID 移除指定图层（含天地图多层同步） |
| 图层 | 图层显示/隐藏控制 | `setLayerVisible(id, boolean)` 按 ID 控制图层可见性 |
| 图层 | 图层透明度设置 | `setLayerOpacity(id, 0~1)` 按 ID 动态调节透明度 |
| 图层 | 跨切换图层恢复 | 切换 2D/3D 时自动重放图层记录，并恢复可见性/透明度状态 |
| 要素 | 要素添加 | `addFeature()` 支持点、线、面，同 ID 自动覆盖去重 |
| 要素 | 要素移除 | `removeFeature(id)` 按 ID 移除指定要素 |
| 要素 | 清除要素 | `clearFeatures()` 清空所有绘制要素 |
| 要素 | 交互式绘制 | `drawPoint` / `drawLine` / `drawPolygon` / `stopDraw`，完成后自动入库 |
| 要素 | 要素样式动态更新 | `updateFeature(id, style)` 不重新创建要素，2D/3D 实时生效 |
| 覆盖物 | 信息弹窗（Popup） | `showPopup` / `hidePopup` / `clearPopups`，支持 HTML 内容，跨 2D/3D 切换自动恢复 |
| 工具 | 坐标转换 | WGS84 / GCJ-02 / BD-09 互转，支持单点和批量转换 |
| 工具 | 距离 / 面积计算 | 球面距离、折线长度、多边形面积，支持 m/km/miles/亩等单位 |
| 交互 | 点选查询 | `pickAtPixel(pixel)` 点击地图拾取点/线/面要素，返回 ID/类型/坐标/样式 |
| 交互 | 要素编辑 | `editFeature(id)` 拖拽顶点、点击边插入、右键/Alt/Shift+点击删除，返回取消函数 |
| 要素 | 跨切换要素恢复 | 切换 2D/3D 时自动重放 OverlayManager 记录 |

### 待实现

#### 核心能力

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 地图截图 / 导出 | 导出当前视口为 PNG/JPG，含要素和底图 | P2 |

#### 图层

| 功能 | 说明 | 优先级 |
|------|------|--------|
| WMS / WFS / WMTS 图层 | 标准 OGC 服务图层接入 | P2 |
| GeoJSON 图层 | 加载本地 / 远程 GeoJSON 数据 | P2 |
| 热力图 | 基于点密度的热力渲染 | P3 |
| 更多底图 | 高德、OSM、必应、Mapbox 等 | P3 |

#### 要素与覆盖物

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 点聚合（MarkerCluster） | 海量点自动聚合，支持缩放级别自适应 | P2 |
| 文本 / 图标标注 | Marker + Label 组合标注 | P2 |
| 轨迹回放 | 按时间轴回放移动轨迹，支持速度控制 | P3 |

#### 交互与查询

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 框选查询 | 拉框选择范围内的要素 | P2 |
| 测量工具 | 测距（线段累加）、测面（多边形面积） | P2 |

#### 分析与服务

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 路径规划 | 驾车 / 步行 / 骑行导航，对接第三方服务 | P3 |
| 地理编码 / 逆地理编码 | 地址 ↔ 坐标互转，对接天地图 / 高德 API | P3 |
| 缓冲区分析 | 以点/线/面为中心生成指定半径缓冲区 | P3 |

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

map.loadTianditu('YOUR_TIANDITU_KEY', 'tdt-layer')
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

map.loadTianditu('YOUR_TIANDITU_KEY', 'tdt-layer')
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

map.loadTianditu('YOUR_TIANDITU_KEY', 'tdt-layer')

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

### 6. 图层操作

```typescript
// 加载天地图底图（必须指定图层 ID）
map.loadTianditu('YOUR_TIANDITU_KEY', 'tdt-layer')

// 根据 ID 移除指定图层
map.removeLayer('tdt-layer')

// 控制图层可见性
map.setLayerVisible('tdt-layer', false) // 隐藏
map.setLayerVisible('tdt-layer', true)  // 显示

// 控制图层透明度（0 ~ 1）
map.setLayerOpacity('tdt-layer', 0.5) // 半透明
map.setLayerOpacity('tdt-layer', 1)   // 完全 opaque
```

### 7. 添加绘制要素

```typescript
map.addFeature({
  type: 'point',
  id: 'beijing',
  coords: [[116.3974, 39.9093]],
  style: { pointColor: '#ff0000', radius: 6 },
})

map.addFeature({
  type: 'polyline',
  id: 'shanghai-line',
  coords: [
    [116.3974, 39.9093],
    [121.4737, 31.2304],
  ],
  style: { stroke: '#00aaff', strokeWidth: 3 },
})

map.addFeature({
  type: 'polygon',
  id: 'test-polygon',
  coords: [
    [116.3874, 39.8993],
    [116.3974, 39.9193],
    [116.4074, 39.8993],
    [116.3874, 39.8993],
  ],
  style: { fill: 'rgba(0, 170, 255, 0.2)', stroke: '#00aaff', strokeWidth: 2 },
})

// 根据 ID 移除指定要素
map.removeFeature('beijing')

// 清除所有绘制要素
map.clearFeatures()
```

### 8. 交互式绘制

```typescript
// 交互式绘制点（单击完成）
map.drawPoint({
  style: { pointColor: '#ff0000', radius: 6 },
  onComplete: (feature) => console.log('绘制点完成:', feature),
})

// 交互式绘制线（点击加点、双击结束）
map.drawLine({
  style: { stroke: '#00aaff', strokeWidth: 3 },
  onComplete: (feature) => console.log('绘制线完成:', feature),
})

// 交互式绘制面（点击加点、双击结束）
map.drawPolygon({
  style: { fill: 'rgba(0, 170, 255, 0.2)', stroke: '#00aaff', strokeWidth: 2 },
  onComplete: (feature) => console.log('绘制面完成:', feature),
})

// 终止当前绘制
map.stopDraw()
```

> **注意**：交互式绘制完成后，要素会自动进入 `OverlayManager`，切换 2D/3D 时会自动恢复，无需手动调用 `addFeature`。

### 9. 信息弹窗

```typescript
// 显示弹窗
map.showPopup({
  id: 'popup-1',
  content: '<strong>成都市</strong><br>经度: 104.0668<br>纬度: 30.5728',
  position: [104.0668, 30.5728],
  onClose: () => console.log('弹窗已关闭'),
})

// 隐藏指定弹窗
map.hidePopup('popup-1')

// 清除所有弹窗
map.clearPopups()
```

### 10. 坐标转换

SDK 内置 WGS84 / GCJ-02 / BD-09 三种坐标系互转工具，适用于国内多源地图数据融合场景。

```typescript
import { transform, transformCoords } from 'map-sdk'

// 单点转换：WGS84 → GCJ-02（火星坐标系）
const [lon, lat] = transform(104.0668, 30.5728, 'wgs84', 'gcj02')

// 单点转换：GCJ-02 → WGS84
const [wgsLon, wgsLat] = transform(104.0668, 30.5728, 'gcj02', 'wgs84')

// 单点转换：WGS84 → BD-09（百度坐标系）
const [bdLon, bdLat] = transform(104.0668, 30.5728, 'wgs84', 'bd09')

// 批量转换
const coords = [
  [104.0668, 30.5728],
  [116.3974, 39.9093],
]
const gcjCoords = transformCoords(coords, 'wgs84', 'gcj02')
```

**坐标系说明：**

| 坐标系 | 别名 | 使用方 |
|--------|------|--------|
| WGS84 | GPS 坐标 | 天地图、国际标准 |
| GCJ-02 | 火星坐标 | 高德、腾讯、谷歌中国 |
| BD-09 | 百度坐标 | 百度地图 |

### 11. 点选查询

点击地图拾取点、线、面要素，返回要素的 ID、类型、坐标和样式信息。

```typescript
// 在 click 事件中调用 pickAtPixel
sdk.on('click', (e) => {
  const results = map.pickAtPixel(e.pixel)
  if (results.length > 0) {
    const feature = results[0]
    console.log('拾取到:', feature.id, feature.type)
  }
})
```

**PickResult 结构：**

| 属性 | 类型 | 说明 |
|------|------|------|
| id | `string` | 要素 ID（可能为空） |
| type | `'point' \| 'polyline' \| 'polygon'` | 要素类型 |
| coords | `[number, number][]` | 地理坐标数组 |
| style | `Record<string, unknown>` | 要素样式 |

### 12. 要素编辑

启动交互式编辑模式，拖拽顶点调整形状，点击边插入新顶点，右键或 Alt/Shift+点击删除顶点。编辑完成后自动更新 `OverlayManager` 中的坐标记录。

```typescript
// 启动编辑
const stopEdit = map.editFeature('polygon-1', {
  onComplete: (feature) => console.log('编辑完成:', feature),
})

// 退出编辑模式
stopEdit()
```

**交互说明（2D/3D 统一）**：

| 操作 | 方式 | 说明 |
|------|------|------|
| 拖拽顶点 | 左键按住并移动 | 鼠标移到顶点（2D 高亮 / 3D 显示蓝色提示点）后按住拖拽 |
| 插入顶点 | 左键点击边 | 鼠标移到边上（2D 自动高亮边 / 3D 显示边上提示点）后单击，在投影位置插入新顶点 |
| 删除顶点 | 右键单击顶点 | 吸附到顶点后右键单击删除 |
| 删除顶点 | Alt + 左键单击顶点 | 吸附到顶点后按住 Alt 并单击删除 |
| 删除顶点 | Shift + 左键单击顶点 | 吸附到顶点后按住 Shift 并单击删除 |

> **保护限制**：线至少保留 2 个顶点，面至少保留 3 个顶点，点不支持删除。
> - 2D 使用 OpenLayers `Modify` 交互 + 右键/contextmenu 事件
> - 3D 使用 hover-snap 模式：鼠标移入时动态显示蓝色提示点，靠近顶点吸附、靠近边投影
> - 编辑完成后，2D/3D 切换时坐标会自动恢复

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

所有地图实例均实现此接口，包含**核心服务**与**功能方法**：

**核心服务**

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

**功能方法**

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| loadTianditu | `key: string, id: string` | `void` | 加载天地图底图（需指定图层 ID） |
| addFeature | `feature: FeatureInfo` | `void` | 添加绘制要素（同 id 会自动覆盖旧要素） |
| removeFeature | `id: string` | `void` | 根据 ID 移除指定要素 |
| clearFeatures | - | `void` | 清除所有绘制要素 |
| removeLayer | `id: string` | `void` | 根据 ID 移除指定图层 |
| setLayerVisible | `id: string, visible: boolean` | `void` | 设置图层可见性 |
| setLayerOpacity | `id: string, opacity: number` | `void` | 设置图层透明度（0~1） |
| drawPoint | `options?: DrawOptions` | `() => void` | 交互式绘制点，返回取消函数 |
| drawLine | `options?: DrawOptions` | `() => void` | 交互式绘制线，点击加点、双击结束 |
| drawPolygon | `options?: DrawOptions` | `() => void` | 交互式绘制面，点击加点、双击结束 |
| stopDraw | - | `void` | 终止当前交互式绘制 |
| pickAtPixel | `pixel: [number, number]` | `PickResult[]` | 根据屏幕坐标拾取要素 |
| editFeature | `id: string, options?: EditOptions` | `() => void` | 交互式编辑要素，返回取消函数 |
| showPopup | `options: PopupOptions` | `void` | 显示信息弹窗 |
| hidePopup | `id: string` | `void` | 隐藏指定弹窗 |
| clearPopups | - | `void` | 清除所有弹窗 |

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

### PopupOptions

弹窗配置接口：

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | `string` | 否 | 弹窗唯一标识，不传则自动生成 |
| content | `string \| HTMLElement` | 是 | 弹窗内容，支持 HTML 字符串或 DOM 元素 |
| position | `[number, number]` | 是 | 弹窗锚点位置 [经度, 纬度] |
| offset | `[number, number]` | 否 | 像素偏移 [x, y]，默认 `[0, -10]` |
| onClose | `() => void` | 否 | 关闭按钮点击回调 |

### SwitchToOptions

引擎切换时的同步控制选项：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| state | `boolean` | `true` | 是否同步地图状态（中心点、缩放） |
| layers | `boolean \| string[]` | `true` | 是否同步图层。`true` 全部同步，`string[]` 按类型过滤 |
| features | `boolean` | `true` | 是否同步绘制要素 |
| events | `boolean` | `true` | 是否同步跨切换事件监听 |
| popups | `boolean` | `true` | 是否同步弹窗状态 |

### 坐标转换

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| transform | `lon, lat, from, to` | `[number, number]` | 单点坐标转换 |
| transformCoords | `coords[], from, to` | `[number, number][]` | 批量坐标转换 |

### 距离 / 面积计算

| 函数 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| distance | `p1, p2, unit?` | `number` | 两点球面距离 |
| lineLength | `coords[], unit?` | `number` | 折线总长度 |
| polygonArea | `coords[], unit?` | `number` | 球面多边形面积 |

**CoordSystem 类型：** `'wgs84' | 'gcj02' | 'bd09'`

### 13. 距离 / 面积计算

SDK 内置球面距离和面积计算工具，不依赖具体地图引擎，可直接用于测量分析。

```typescript
import { distance, lineLength, polygonArea } from 'map-sdk'

// 两点距离（默认米）
const d = distance([104.0668, 30.5728], [116.3974, 39.9093])

// 两点距离（公里）
const dKm = distance([104.0668, 30.5728], [116.3974, 39.9093], 'km')

// 折线总长度
const len = lineLength([
  [104.0568, 30.5628],
  [104.0668, 30.5728],
  [104.0768, 30.5828],
], 'km')

// 多边形面积（默认平方米）
const a = polygonArea([
  [104.0568, 30.5728],
  [104.0668, 30.5828],
  [104.0768, 30.5728],
  [104.0668, 30.5628],
  [104.0568, 30.5728],
])

// 多边形面积（亩）
const aMu = polygonArea(coords, 'mu')
```

**支持的单位：**

| 类型 | 单位值 | 说明 |
|------|--------|------|
| 长度 | `'m'` | 米（默认） |
| 长度 | `'km'` | 公里 |
| 长度 | `'miles'` | 英里 |
| 长度 | `'nmi'` | 海里 |
| 面积 | `'m2'` | 平方米（默认） |
| 面积 | `'km2'` | 平方公里 |
| 面积 | `'hectare'` | 公顷 |
| 面积 | `'mu'` | 亩 |

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

### 添加新的图层类型

SDK 采用 **统一入口 + switch 分发** 的图层扩展模式。新增一种图层类型只需三步：

**1. 定义图层类型信息**

在 `src/types/layer.ts` 中定义新的类型接口：

```typescript
export interface WmsLayerInfo extends LayerInfo {
  type: 'wms'
  url: string
  layers: string
}
```

**2. 创建引擎渲染模块**

为 2D 和 3D 各添加一个独立的加载模块：

```typescript
// src/ol/layers/addWms.ts
import type { Map } from 'ol'
import TileLayer from 'ol/layer/Tile'
import TileWMS from 'ol/source/TileWMS'

export function addWms(map: Map, url: string, layers: string) {
  map.addLayer(new TileLayer({
    source: new TileWMS({ url, params: { LAYERS: layers } }),
  }))
}
```

```typescript
// src/cesium/layers/addWms.ts
import * as Cesium from 'cesium'

export function addWms(viewer: Cesium.Viewer, url: string, layers: string) {
  viewer.imageryLayers.addImageryProvider(
    new Cesium.WebMapServiceImageryProvider({ url, layers })
  )
}
```

**3. 在引擎中注册 case**

在 `OlMap.loadLayer` 和 `CesiumMap.loadLayer` 各加一行 `case`：

```typescript
// src/ol/OlMap.ts
import { addWms } from './layers/addWms'

protected loadLayer(layer: LayerInfo): void {
  switch (layer.type) {
    case 'tianditu':
      addTianditu(this.map, { key: (layer as TiandituLayerInfo).key })
      break
    case 'wms':
      addWms(this.map, (layer as WmsLayerInfo).url, (layer as WmsLayerInfo).layers)
      break
  }
}
```

`BaseMap`、`restoreLayers`、`LayerManager` 均不需要修改。

### 添加自定义 3D 实体

如需在 Cesium 实例上直接操作，可通过 `instanceof` 获取原生 Viewer：

```typescript
const current = sdk.getMap()
if (current instanceof CesiumMap) {
  const viewer = current.getViewer()
  viewer?.entities.add({
    position: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 0),
    point: { pixelSize: 10, color: Cesium.Color.RED },
  })
}
```

## 注意事项

1. **天地图 Key**：使用前必须申请天地图 Key，并通过 `map.loadTianditu(key, id)` 加载底图，否则底图无法加载。加载时必须指定图层 ID，便于后续 `removeLayer` 管理。
2. **体积优化**：Cesium 资源较大，建议按需加载或配置 CDN。
3. **跨域**：天地图瓦片服务支持 CORS，已配置 `crossOrigin: 'anonymous'`。
4. **事件持久化**：在 `both` 模式下，建议通过 `sdk.on()` / `sdk.off()` 注册事件，切换引擎后会自动重新绑定；直接调用 `map.on()` 的事件在切换后会失效。
5. **Cesium off**：Cesium 引擎的 `off()` 当前为无操作（handler 未做跟踪回收），切换引擎时会通过销毁实例自动释放。OpenLayers 端的 `off()` 已正常实现。
6. **同 id 去重**：`addFeature` 传入的 `feature.id` 若与已有要素重复，会自动覆盖旧要素（OverlayManager、2D 矢量层、3D entity 三层同步去重）。`loadTianditu` 传入的 `id` 若与已有图层重复，也会自动覆盖旧图层记录。
7. **交互式绘制自动同步**：`drawPoint` / `drawLine` / `drawPolygon` 完成后，要素会自动进入 `OverlayManager`，2D/3D 切换时无需额外处理即可恢复。
