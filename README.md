# MapSDK 二三维地图 SDK

基于 Vite + TypeScript 构建的二三维一体化地图 SDK，2D 使用 OpenLayers，3D 使用 Cesium，**底图默认使用天地图**。

## 技术栈

- **构建工具**: Vite
- **语言**: TypeScript
- **测试框架**: Vitest
- **运行环境**: Node.js >= 20.19.0
- **2D 引擎**: OpenLayers
- **3D 引擎**: Cesium
- **底图服务**: 天地图
- **构建插件**: vite-plugin-cesium

## 项目结构

```
src/
├── core/
│   ├── BaseMap.ts      # 抽象基类：IMap 核心服务 + 图层/要素基础功能 + 插件系统
│   ├── MapSDK.ts       # SDK 入口，工厂模式 + 2D/3D 切换管理
│   ├── Plugin.ts       # MapPlugin 接口定义
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
│   ├── plugins/
│   │   ├── OlDrawPlugin.ts           # OL 绘制插件
│   │   ├── OlEditPlugin.ts           # OL 编辑插件
│   │   ├── OlPickPlugin.ts           # OL 点选插件
│   │   ├── OlSelectPlugin.ts         # OL 选择插件（点选 / 框选）
│   │   ├── OlMeasurePlugin.ts        # OL 测量插件
│   │   ├── OlPopupPlugin.ts          # OL 弹窗插件
│   │   ├── OlFeatureRendererPlugin.ts # OL 要素渲染插件
│   │   ├── OlCameraControlPlugin.ts  # OL 相机控制占位插件（2D 下空操作 + 警告）

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
│   ├── plugins/
│   │   ├── CesiumDrawPlugin.ts           # Cesium 绘制插件
│   │   ├── CesiumEditPlugin.ts           # Cesium 编辑插件
│   │   ├── CesiumPickPlugin.ts           # Cesium 点选插件
│   │   ├── CesiumSelectPlugin.ts         # Cesium 选择插件（点选 / 框选）
│   │   ├── CesiumMeasurePlugin.ts        # Cesium 测量插件
│   │   ├── CesiumPopupPlugin.ts          # Cesium 弹窗插件
│   │   ├── CesiumFeatureRendererPlugin.ts # Cesium 要素渲染插件
│   │   ├── CesiumCameraControlPlugin.ts  # Cesium 相机姿态控制插件

│   │   └── index.ts
│   └── index.ts        # cesium 模块导出
├── state/
│   ├── StateManager.ts # 地图状态、跨切换事件缓存
│   ├── LayerManager.ts # 图层记录与恢复
│   ├── OverlayManager.ts # 绘制要素记录与恢复（同 id 自动去重）
│   ├── PopupManager.ts # 弹窗记录与恢复
│   └── index.ts        # state 模块导出
├── types/
│   ├── map.ts          # MapType / MapConfig / MapEvent / MapState
│   ├── layer.ts        # LayerInfo / TiandituLayerInfo
│   ├── feature.ts      # FeatureType / FeatureInfo / DrawOptions
│   ├── popup.ts        # PopupOptions
│   ├── measure.ts      # MeasureDistanceOptions / MeasureAreaOptions
│   └── index.ts        # 统一类型导出 + IMap / SwitchToOptions
├── utils/
│   └── index.ts        # 坐标转换、距离/面积计算等通用工具
├── examples/
│   ├── map.ts          # 地图初始化（top-level await）
│   ├── toolbar.ts      # 工具栏 UI 交互
│   ├── pick.ts         # 点选查询示例
│   ├── measure.ts      # 坐标转换 / 测距 / 测面
│   ├── navigate.ts     # 飞行定位示例
│   ├── draw.ts         # 交互绘制示例
│   ├── feature.ts      # 要素增删改查示例
│   ├── layer.ts        # 图层控制示例
│   ├── popup.ts        # 弹窗示例
│   └── camera.ts       # 3D 相机姿态控制示例

├── ui/
│   ├── ToggleButtonPluginBase.ts # 切换按钮抽象基类（name / isToggleButton / onToggle 解析由基类处理）
│   ├── ToggleButtonPlugin.ts     # 默认切换按钮：文本按钮
│   └── CustomTogglePlugin.ts     # 备选切换按钮：胶囊滑块 + 玻璃质感
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
3. 获取 Key 后通过 `map.addTiandituLayer(key)` 加载底图

## 功能清单

### 已实现

| 模块 | 功能 | 说明 |
|------|------|------|
| 核心 | 地图初始化 | 支持 `2d` / `3d` / `both` 三种模式 |
| 核心 | 2D/3D 引擎切换 | `switchTo()` 自动同步视角、图层、要素、事件 |
| 核心 | 视角控制 | setCenter / getCenter / setZoom / getZoom / flyTo / getState / setState |
| 核心 | 事件系统 | click / dblclick / rightclick / mousemove，跨切换持久化 |
| 图层 | 天地图底图 | `addTiandituLayer(key, id)` 加载影像底图 + 注记，必须指定 ID |
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
| 交互 | 距离测量 | `measureDistance()` 交互式量测两点间球面距离，单位可选 m/km/miles/nmi |
| 交互 | 面积测量 | `measureArea()` 交互式量测多边形球面面积，单位可选 m²/km²/hectare/亩 |
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
| ~~框选查询~~ | ~~拉框选择范围内的要素，计划通过 `SelectPlugin` 实现~~ ✅ 已完成 | P2 |

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

map.addTiandituLayer('YOUR_TIANDITU_KEY', 'tdt-layer')
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

map.addTiandituLayer('YOUR_TIANDITU_KEY', 'tdt-layer')
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

map.addTiandituLayer('YOUR_TIANDITU_KEY', 'tdt-layer')

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
map.addTiandituLayer('YOUR_TIANDITU_KEY', 'tdt-layer')

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

### 13. 交互式测量

启动交互式量测，鼠标点击采集顶点，双击结束。结果通过回调返回。

```typescript
// 距离测量
const stopDistance = map.measureDistance({
  unit: 'km',
  onComplete: (result) => {
    console.log('总距离:', result.value, result.unit) // → 总距离: 1.234 km
  },
})

// 面积测量
const stopArea = map.measureArea({
  unit: 'mu',
  onComplete: (result) => {
    console.log('总面积:', result.value, result.unit) // → 总面积: 12.5 mu
  },
})

// 主动取消
stopDistance()
stopArea()
```

**支持的单位**：

| 类型 | 可选值 |
|------|--------|
| 距离 | `'m'`（默认） / `'km'` / `'miles'` / `'nmi'` |
| 面积 | `'m2'`（默认） / `'km2'` / `'hectare'` / `'mu'` |

> 测量功能由 `OlMeasurePlugin` / `CesiumMeasurePlugin` 提供。如不需要，可通过 `map.unuse('measure')` 卸载。

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

地图实例的能力按三个层次划分：**核心服务（abstract）**、**基础功能（基类默认实现）**、**可选扩展（由插件提供）**。

**1. 核心服务（IMap，所有引擎必须实现）**

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

**2. 基础功能（BaseMap 默认实现，引擎 override 渲染部分）**

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| addLayer | `layer: LayerInfo` | `void` | 添加图层（自动记录 + 触发渲染） |
| addTiandituLayer | `key: string, id: string` | `void` | 加载天地图底图 |
| removeLayer | `id: string` | `void` | 根据 ID 移除指定图层 |
| setLayerVisible | `id, visible` | `void` | 设置图层可见性 |
| setLayerOpacity | `id, opacity` | `void` | 设置图层透明度（0~1） |
| addFeature | `feature: FeatureInfo` | `void` | 添加绘制要素（同 id 自动覆盖） |
| removeFeature | `id: string` | `void` | 根据 ID 移除指定要素 |
| updateFeature | `id, style` | `void` | 更新指定要素样式 |
| clearFeatures | - | `void` | 清除所有绘制要素 |

**3. 可选扩展（由插件动态挂载，未安装时调用会抛错）**

| 方法 | 提供方 | 返回值 | 说明 |
|------|--------|--------|------|
| drawPoint | `*DrawPlugin` | `() => void` | 交互式绘制点，返回取消函数 |
| drawLine | `*DrawPlugin` | `() => void` | 交互式绘制线，点击加点、双击结束 |
| drawPolygon | `*DrawPlugin` | `() => void` | 交互式绘制面，点击加点、双击结束 |
| stopDraw | `*DrawPlugin` | `void` | 终止当前交互式绘制 |
| pickAtPixel | `*PickPlugin` | `PickResult[]` | 根据屏幕像素拾取要素 |
| enableSelect | `*SelectPlugin` | `() => void` | 启用点选或框选模式，返回取消函数 |
| editFeature | `*EditPlugin` | `() => void` | 交互式编辑要素，返回取消函数 |
| measureDistance | `*MeasurePlugin` | `() => void` | 交互式距离测量，返回取消函数 |
| measureArea | `*MeasurePlugin` | `() => void` | 交互式面积测量，返回取消函数 |
| showPopup | `*PopupPlugin` | `void` | 显示信息弹窗 |
| hidePopup | `*PopupPlugin` | `void` | 隐藏指定弹窗 |
| clearPopups | `*PopupPlugin` | `void` | 清除所有弹窗 |

> 默认情况下引擎子类已通过 `getDefaultPlugins()` 自动安装所有插件，无需手动 `use()`。如果你想精简体积，可以在 `init()` 后调用 `map.unuse('draw')` 等卸载不需要的插件。

**4. 插件管理**

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| use | `plugin: MapPlugin` | `BaseMap` | 注册插件，同名会先卸载旧实例；`isToggleButton=true` 的插件在单引擎模式下自动跳过 |
| unuse | `name: string` | `BaseMap` | 卸载指定插件 |
| getPlugins | - | `MapPlugin[]` | 获取已安装的所有插件 |

**5. 实例查询 / 标记**

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| getContainer | - | `HTMLElement` | 获取地图所挂载的 DOM 容器，供插件挂载 UI 元素 |
| isBothMode | - | `boolean` | 当前实例是否由 MapSDK 在 `both` 模式下创建 |
| markBothMode | `value: boolean` | `void` | 由 MapSDK 内部调用，标记 both 模式；用户代码无需调用 |

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

### 14. 距离 / 面积计算（工具函数）

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

### 插件系统

SDK 采用 **核心 + 插件** 架构。`BaseMap` 只保留 IMap 核心服务和图层/要素基础功能，**绘制、编辑、点选、测量、弹窗** 等交互能力均通过插件动态挂载。

**插件接口**

```typescript
// src/core/Plugin.ts
export interface MapPlugin {
  readonly name: string
  install(map: BaseMap): void
  uninstall?(map: BaseMap): void
  /** 插件适用的引擎类型。未指定时默认为 'both'，表示所有引擎通用。 */
  readonly engine?: '2d' | '3d' | 'both'
}

```

**默认安装的插件**

OlMap 和 CesiumMap 在 `init()` 末尾通过 `getDefaultPlugins()` 自动安装：

| 插件 | OL 实现 | Cesium 实现 | 提供方法 |
|------|---------|-------------|----------|
| Layer — Tianditu | `OlTiandituLayerPlugin` | `CesiumTiandituLayerPlugin` | `addTiandituLayer(key, id)` / `addLayer` |
| FeatureRenderer | `OlFeatureRendererPlugin` | `CesiumFeatureRendererPlugin` | `addFeature` / `removeFeature` / `updateFeature` / `clearFeatures` |
| Draw | `OlDrawPlugin` | `CesiumDrawPlugin` | `drawPoint` / `drawLine` / `drawPolygon` / `stopDraw` |
| Edit | `OlEditPlugin` | `CesiumEditPlugin` | `editFeature` |
| Pick | `OlPickPlugin` | `CesiumPickPlugin` | `pickAtPixel` |
| Select | `OlSelectPlugin` | `CesiumSelectPlugin` | `enableSelect({ mode, onSelect })` |
| Measure | `OlMeasurePlugin` | `CesiumMeasurePlugin` | `measureDistance` / `measureArea` |
| Popup | `OlPopupPlugin` | `CesiumPopupPlugin` | `showPopup` / `hidePopup` / `clearPopups` |

**MapSDK 在 `both` 模式下额外安装的 UI 插件**

| 插件 | 实现 | 触发条件 | 说明 |
|------|------|----------|------|
| ToggleButton | `ToggleButtonPlugin` | `init({ type: 'both' })` | 在容器右上角挂载 2D/3D 切换按钮，跨引擎切换持久存在；如不需要可调用 `map.unuse('toggle-button')` |
| ToggleButton（备选） | `CustomTogglePlugin` | 用户手动 `use` | 内置的胶囊滑块样式切换按钮，玻璃质感、激活态滑动渐变；同名替换默认实现；`onToggle` 可选（MapSDK 自动注入） |
| ToggleButton（自定义） | 继承 `ToggleButtonPluginBase` | 用户手动 `use` | 自定义切换按钮基类，封装 `name` / `isToggleButton` / `onToggle` 解析 / `updateToggleButton` 挂载，子类只需实现三个 UI 方法 |

> `isToggleButton = true` 是切换按钮插件的约定标记：单引擎模式（`init({type:'2d'\|'3d'})`）下 `BaseMap.use()` 会自动跳过带此标记的插件，避免渲染出"按了之后状态不一致"的假按钮。该标记取代了早期硬编码的 `name === 'toggle-button'` 判断。

**按需卸载/重新安装**

```typescript
// 卸载点选插件，调用 pickAtPixel 会抛错
map.unuse('pick')

// 重新安装
import { OlPickPlugin } from 'map-sdk/ol/plugins'
map.use(new OlPickPlugin())

// 链式调用
map.unuse('measure').unuse('edit')

// 查看当前已安装的插件
console.log(map.getPlugins().map(p => p.name))
// → ['layer-tianditu', 'draw', 'edit', 'pick', 'measure', 'popup']
```

**编写自定义插件**

```typescript
import type { MapPlugin, BaseMap } from 'map-sdk'

class MyPlugin implements MapPlugin {
  readonly name = 'my'

  install(map: BaseMap): void {
    // 动态挂载方法到 map 实例
    ;(map as any).myMethod = () => {
      console.log('Hello from my plugin')
    }
  }

  uninstall(map: BaseMap): void {
    delete (map as any).myMethod
  }
}

map.use(new MyPlugin())
;(map as any).myMethod() // → "Hello from my plugin"
```

**编写自定义切换按钮插件**

如需替换默认切换按钮（如改用自家 UI 库、Vue/React 组件、不同视觉风格），继承 `ToggleButtonPluginBase` 即可：

```typescript
import { ToggleButtonPluginBase, type ToggleType } from 'map-sdk'
import type { BaseMap } from 'map-sdk'

class MyToggleButtonPlugin extends ToggleButtonPluginBase {
  private el: HTMLElement | null = null

  protected onInstall(map: BaseMap) {
    if (!this.el) {                               // ① install 必须幂等：迁移到新引擎时只重挂方法
      this.el = document.createElement('button')
      this.el.textContent = '切换到 3D'
      this.el.onclick = () => this.triggerToggle() // 基类提供的 triggerToggle() 自动处理切换
      map.getContainer().appendChild(this.el)
    }
  }

  protected onUninstall(_map: BaseMap) {
    this.el?.remove()
    this.el = null
  }

  protected onUpdateState(type: ToggleType) {     // ② SDK 切换后调用，同步按钮视觉状态
    this.el!.textContent = type === '2d' ? '切换到 3D' : '切换到 2D'
  }
}

const map = await sdk.init({ type: 'both', container: 'map', ... })
map.use(new MyToggleButtonPlugin())                // onToggle 由 MapSDK 自动注入，无需显式传入
```

基类 `ToggleButtonPluginBase` 已统一处理：
- `name = 'toggle-button'` — 同名替换默认实现
- `isToggleButton = true` — 单引擎模式下自动跳过
- `onToggle` 延迟解析 — 构造不传时 fallback 到 `map.switchTo`
- `updateToggleButton` 挂载/卸载 — SDK 调用以同步按钮状态

子类只需实现三个纯 UI 方法：`onInstall`、`onUninstall`、`onUpdateState`。

**引擎切换时的插件迁移**

`MapSDK.switchTo()` 会自动把当前实例的插件迁移到新引擎实例上。迁移时，声明了 `engine` 的插件会按目标引擎过滤（`engine='2d'` 的插件不会迁移到 3D，`engine='3d'` 的不会迁移到 2D），通用插件（未声明或 `'both'`）则自由迁移。所以切换 2D/3D 时无需重新 `use()`。

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

**3. 编写图层插件并注册**

为 2D 和 3D 各写一个 `LayerTypePlugin`，通过 `registerLayerType` 注册渲染器：

```typescript
// src/ol/plugins/OlWmsLayerPlugin.ts
import type { BaseMap, MapPlugin } from 'map-sdk'
import type { LayerInfo, WmsLayerInfo } from 'map-sdk'
import { addWms } from '@/ol/layers/addWms'

export class OlWmsLayerPlugin implements MapPlugin {
  readonly name = 'layer-wms'

  install(map: BaseMap): void {
    map.registerLayerType('wms', (m, layer) => {
      const olMap = (m as any).getOlMap() as import('ol').Map | null
      addWms(olMap, (layer as WmsLayerInfo).url, (layer as WmsLayerInfo).layers)
    })
  }

  uninstall(_map: BaseMap): void {}
}
```

```typescript
// src/cesium/plugins/CesiumWmsLayerPlugin.ts
import type { BaseMap, MapPlugin } from 'map-sdk'
import type { LayerInfo, WmsLayerInfo } from 'map-sdk'
import { addWms } from '@/cesium/layers/addWms'

export class CesiumWmsLayerPlugin implements MapPlugin {
  readonly name = 'layer-wms'

  install(map: BaseMap): void {
    map.registerLayerType('wms', (m, layer) => {
      const viewer = (m as any).getViewer() as import('cesium').Viewer | null
      addWms(viewer, (layer as WmsLayerInfo).url, (layer as WmsLayerInfo).layers)
    })
  }

  uninstall(_map: BaseMap): void {}
}
```

引擎 `getDefaultPlugins()` 中追加即可，**无需修改 `BaseMap` 或 `restoreLayers`**。

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

### 插件化路线图

当前 SDK 的核心服务（生命周期、视角、事件）和基础功能（图层管理、要素记录）已固化在 `BaseMap` 中，**绘制、编辑、点选、测量、弹窗** 等交互能力均已插件化。以下是尚未插件化、但架构上适合提取为插件的功能：

#### 1. SelectPlugin（点选 / 框选）—— ✅ 已完成

已实现 `OlSelectPlugin` / `CesiumSelectPlugin`，通过 `enableSelect({ mode, onSelect })` 提供持续交互的点选和框选能力，返回取消函数。

#### 2. LayerTypePlugin（图层类型注册）—— ✅ 已完成

`BaseMap` 现已提供 `registerLayerType(type, renderer)`，`renderLayer` 从硬编码 `switch` 改为注册表分发。天地图渲染已提取为 `OlTiandituLayerPlugin` / `CesiumTiandituLayerPlugin`，随引擎默认安装。

新增图层类型（如 WMS）不再需要修改引擎源码，只需编写对应的 `LayerTypePlugin` 并在 `getDefaultPlugins()` 中追加即可：`BaseMap.addLayer()` 和 `restoreLayers()` 一行不动。详见上方「添加新的图层类型」示例。

> **PickPlugin 未来定位**：当前 `pickAtPixel` 用于像素级拾取矢量要素，与 `SelectPlugin` 的点选模式有功能重叠。后续计划将 `pickAtPixel` 改为**图层属性查询**（如 WMS GetFeatureInfo、服务端查询），方法名可能随之变化，与 `SelectPlugin` 形成明确分工：Select 负责前端交互选择，Pick 负责服务端图层属性查询。

#### 3. FeatureRendererPlugin（要素渲染）—— ✅ 已完成

`addFeature` / `removeFeature` / `updateFeature` / `clearFeatures` 的状态管理留在 `BaseMap`（`OverlayManager`），实际渲染逻辑已提取为 `OlFeatureRendererPlugin` / `CesiumFeatureRendererPlugin`：

- `map.unuse('feature')` 即可关闭矢量覆盖物渲染，回落到仅状态管理
- 插件安装时增强 `addFeature` 等方法（先调用 BaseMap 原型的状态管理，再渲染到引擎）
- 卸载时 delete 增强方法，自动回落到 BaseMap 默认实现

#### 4. CameraControlPlugin（3D 相机姿态）—— ✅ 已完成

已实现 `CesiumCameraControlPlugin`（3D 实际生效）和 `OlCameraControlPlugin`（2D 空操作 + 警告）。通过 `setPitch(degrees)` / `setHeading(degrees)` 控制相机俯仰角和方位角。2D 下调用会打印控制台警告而非抛错，用户代码可无条件调用。

```typescript
map.setPitch(-45)   // 3D 俯视 45°，2D 打印警告
map.setHeading(90)  // 3D 朝东，2D 打印警告
```

## 注意事项

1. **天地图 Key**：使用前必须申请天地图 Key，并通过 `map.addTiandituLayer(key, id)` 加载底图，否则底图无法加载。加载时必须指定图层 ID，便于后续 `removeLayer` 管理。
2. **体积优化**：Cesium 资源较大，建议按需加载或配置 CDN。
3. **跨域**：天地图瓦片服务支持 CORS，已配置 `crossOrigin: 'anonymous'`。
4. **事件持久化**：在 `both` 模式下，建议通过 `sdk.on()` / `sdk.off()` 注册事件，切换引擎后会自动重新绑定；直接调用 `map.on()` 的事件在切换后会失效。
5. **Cesium off**：Cesium 引擎的 `off()` 当前为无操作（handler 未做跟踪回收），切换引擎时会通过销毁实例自动释放。OpenLayers 端的 `off()` 已正常实现。
6. **同 id 去重**：`addFeature` 传入的 `feature.id` 若与已有要素重复，会自动覆盖旧要素（OverlayManager、2D 矢量层、3D entity 三层同步去重）。`addTiandituLayer` 传入的 `id` 若与已有图层重复，也会自动覆盖旧图层记录。
7. **交互式绘制自动同步**：`drawPoint` / `drawLine` / `drawPolygon` 完成后，要素会自动进入 `OverlayManager`，2D/3D 切换时无需额外处理即可恢复。
