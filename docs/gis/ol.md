OpenLayers 是一个模块化、高度面向对象的 WebGIS 引擎。它提供了大量“对象”（类），这些对象负责地图的各个方面：地图容器、视图、图层、图层源、要素、几何体、交互、控件、投影等。

---

## ✅ OpenLayers 核心对象体系结构总览

我们按功能分类列出常用对象（类）及其用途：

---

### 🗺️ 1. 地图核心对象（Map）

| 类名           | 用途                   |
| ------------ | -------------------- |
| `ol/Map`     | 地图核心对象，负责渲染、交互、图层管理等 |
| `ol/View`    | 地图视图控制器（中心点、缩放、旋转）   |
| `ol/Overlay` | 地图上的覆盖物（如弹窗、标注）      |

---

### 🧱 2. 图层（Layer）

| 类名                    | 图层类型   | 说明                  |
| --------------------- | ------ | ------------------- |
| `ol/layer/Tile`       | 瓦片图层   | 如 OSM、XYZ、WMTS 瓦片地图 |
| `ol/layer/Vector`     | 矢量图层   | 显示点、线、面要素（GeoJSON等） |
| `ol/layer/VectorTile` | 矢量瓦片图层 | 用于加载 `.pbf` 瓦片（MVT） |
| `ol/layer/Image`      | 图像图层   | WMS 服务、单张图像地图       |
| `ol/layer/Group`      | 图层组    | 分组管理多个图层            |

---

### 📦 3. 数据源（Source）

| 类名                     | 对应图层            | 用途                |
| ---------------------- | --------------- | ----------------- |
| `ol/source/OSM`        | TileLayer       | 加载 OpenStreetMap  |
| `ol/source/XYZ`        | TileLayer       | 加载通用 XYZ 格式瓦片     |
| `ol/source/WMTS`       | TileLayer       | 加载 WMTS 服务        |
| `ol/source/TileWMS`    | TileLayer       | 加载 WMS 图层         |
| `ol/source/Vector`     | VectorLayer     | 加载 GeoJSON、手动添加要素 |
| `ol/source/VectorTile` | VectorTileLayer | 加载矢量瓦片 `.pbf`     |
| `ol/source/ImageWMS`   | ImageLayer      | 加载图像形式的 WMS 服务    |

---

### 🧩 4. 要素和几何（Feature & Geometry）

| 类名                                                        | 说明                 |
| --------------------------------------------------------- | ------------------ |
| `ol/Feature`                                              | 地图上的一个图形对象（如点、线、面） |
| `ol/geom/Point`                                           | 点                  |
| `ol/geom/LineString`                                      | 折线                 |
| `ol/geom/Polygon`                                         | 多边形                |
| `ol/geom/MultiPoint` / `MultiLineString` / `MultiPolygon` | 多点/多线/多面           |
| `ol/geom/Circle`                                          | 圆形                 |
| `ol/geom/GeometryCollection`                              | 多几何集合              |

---

### 🎨 5. 样式系统（Style）

| 类名                | 用途      |
| ----------------- | ------- |
| `ol/style/Style`  | 统一的样式对象 |
| `ol/style/Fill`   | 填充颜色    |
| `ol/style/Stroke` | 边框线     |
| `ol/style/Icon`   | 图标（点图层） |
| `ol/style/Circle` | 圆形点     |
| `ol/style/Text`   | 文本标注    |

---

### 🧭 6. 投影与坐标转换（Proj）

| 类名                   | 用途                                  |
| -------------------- | ----------------------------------- |
| `ol/proj`            | 提供 `transform()`、`fromLonLat()` 等方法 |
| `ol/proj/Projection` | 投影定义（如 EPSG:3857）                   |

---

### 🖱️ 7. 交互系统（Interaction）

| 类名                         | 用途        |
| -------------------------- | --------- |
| `ol/interaction/Draw`      | 绘图（点、线、面） |
| `ol/interaction/Modify`    | 修改几何图形    |
| `ol/interaction/Select`    | 点击选择要素    |
| `ol/interaction/Translate` | 拖动要素      |
| `ol/interaction/Snap`      | 吸附辅助工具    |
| `ol/interaction/DragBox`   | 框选        |

---

### 🛠️ 8. 控件系统（Control）

| 类名                         | 用途      |
| -------------------------- | ------- |
| `ol/control/Zoom`          | 放大/缩小按钮 |
| `ol/control/MousePosition` | 显示鼠标坐标  |
| `ol/control/ScaleLine`     | 比例尺控件   |
| `ol/control/FullScreen`    | 全屏按钮    |
| `ol/control/OverviewMap`   | 鹰眼地图    |
| `ol/control/Attribution`   | 地图版权说明  |

---

### 📄 9. 格式解析（Format）

| 类名                  | 用途               |
| ------------------- | ---------------- |
| `ol/format/GeoJSON` | 读取/写入 GeoJSON 格式 |
| `ol/format/WKT`     | 支持 WKT 格式        |
| `ol/format/GML`     | 解析 GML 格式（OGC）   |
| `ol/format/MVT`     | 解析矢量瓦片格式（.pbf）   |

---

## 🧠 补充：使用关系图（简化）

```
Map
 ├─ View
 ├─ Layers[]
 │   └─ Source (XYZ / Vector / WMTS)
 │       └─ Features[]
 │           └─ Geometry (Point / Line / Polygon)
 ├─ Overlay
 ├─ Controls[]
 └─ Interactions[]
```

---

## ✅ 常用开发组合示例：

| 目标          | 常用类组合                                      |
| ----------- | ------------------------------------------ |
| 加载 OSM 瓦片地图 | `ol/Map` + `TileLayer` + `OSM`             |
| 加载 GeoJSON  | `VectorLayer` + `VectorSource` + `GeoJSON` |
| 自定义点图标      | `Feature` + `Point` + `Style` + `Icon`     |
| 绘制多边形       | `Draw` + `VectorLayer`                     |
| 加载 WMS 图层   | `ImageLayer` + `ImageWMS`                  |

---

## 📚 官方文档入口

* [OpenLayers API 文档](https://openlayers.org/en/latest/apidoc/)
* 示例代码仓库：[https://github.com/openlayers/openlayers/tree/main/examples](https://github.com/openlayers/openlayers/tree/main/examples)

---

如需我给你写一个实战案例，比如「加载 GeoJSON + 自定义图标 + 点击弹窗」，或「矢量瓦片加载 + 图层控制」，可以继续提问。也可以帮你梳理“常用对象的 React 封装方案”。
