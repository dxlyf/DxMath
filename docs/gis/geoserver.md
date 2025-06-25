**GeoServer** 是一个开源的服务器软件，用于在 web 上发布地理空间数据。它支持多种标准，如 WMS（Web Map Service）、WFS（Web Feature Service）、WCS（Web Coverage Service）等，可与 WebGIS 前端（如 OpenLayers、Leaflet、Mapbox）集成，常用于建设地图服务平台、发布矢量或栅格数据。

---

## ✅ 一、GeoServer 能做什么？

| 能力     | 说明                                        |
| ------ | ----------------------------------------- |
| 发布地图服务 | 支持栅格数据（GeoTIFF）、矢量数据（Shapefile、PostGIS 等） |
| 空间查询   | 提供 WFS 支持，通过属性/空间过滤查询要素                   |
| 渲染样式   | 使用 SLD、CSS 等方式配置图层样式                      |
| 支持标准   | OGC 标准支持广泛，如 WMS/WFS/WCS/WPS              |
| 扩展能力   | 可通过插件支持 GeoWebCache（切片服务）、安全认证、多时态等       |

---

## 🚀 二、快速开始使用 GeoServer

### 1. 安装 GeoServer

* 官网下载：[https://geoserver.org/](https://geoserver.org/)
* 支持 Windows / Mac / Linux
* 下载 ZIP / WAR 包或使用 Docker 安装：

```bash
docker run -d -p 8080:8080 -v geoserver_data:/opt/geoserver/data_dir \
  -e GEOSERVER_ADMIN_PASSWORD=geoserver \
  kartoza/geoserver
```

访问：[http://localhost:8080/geoserver](http://localhost:8080/geoserver)
默认账号密码：

* 用户名：`admin`
* 密码：`geoserver`

---

### 2. 上传并发布数据

#### ➤ 添加数据存储（Data Store）

例如上传 Shapefile：

1. 登录后台 → “数据 → 存储 → 添加新的数据存储”
2. 类型选“Shapefile”
3. 填写工作空间、名称、上传文件路径
4. 保存

#### ➤ 发布图层（Layer）

1. 点击“发布图层”
2. 配置图层名称、坐标系（建议设为 EPSG:3857 或 EPSG:4326）
3. 保存即可发布

---

### 3. 使用地图服务

#### ➤ 获取 WMS 地图服务

```bash
http://localhost:8080/geoserver/工作空间/wms?service=WMS&request=GetMap&layers=图层名&...
```

#### ➤ 获取 WFS 要素服务

```bash
http://localhost:8080/geoserver/工作空间/wfs?service=WFS&request=GetFeature&typeName=图层名
```

---

## 🛠️ 三、常见数据支持类型

| 类型    | 格式                                             |
| ----- | ---------------------------------------------- |
| 栅格数据  | GeoTIFF、ArcGrid、JPEG、PNG                       |
| 矢量数据  | Shapefile、GeoJSON、PostGIS、Oracle Spatial、MySQL |
| 服务数据源 | WMS/WFS/WCS、WMS Cascading                      |

---

## 🌐 四、如何结合前端使用

例如在 **OpenLayers** 中使用 WMS 服务：

```js
new ol.layer.Tile({
  source: new ol.source.TileWMS({
    url: 'http://localhost:8080/geoserver/工作空间/wms',
    params: {
      'LAYERS': '图层名',
      'TILED': true,
    },
    serverType: 'geoserver',
  })
})
```

---

## 🧩 五、扩展插件推荐

| 插件          | 功能             |
| ----------- | -------------- |
| GeoWebCache | 自动生成并缓存瓦片      |
| WPS 插件      | 发布空间分析服务       |
| CSW 插件      | 元数据搜索服务        |
| Security 插件 | 支持基于角色、图层的访问控制 |

---

## 📘 六、学习资料推荐

* 官网文档：[https://docs.geoserver.org/](https://docs.geoserver.org/)
* 中文教程：[https://www.osgeo.cn/geoserver](https://www.osgeo.cn/geoserver)
* GitHub 源码：[https://github.com/geoserver/geoserver](https://github.com/geoserver/geoserver)

---

如你有具体场景，比如「如何发布 GeoTIFF」、「如何前端加载某个图层」，可以继续告诉我，我给你示例。



GeoServer 本身不**生成地图数据**，它的作用是**发布已有的地理空间数据**。因此，GeoServer 的地图数据通常来自以下几个主要来源：

---

## 🗂️ 一、来自文件数据（矢量 / 栅格）

### ✅ 矢量数据（Vector Data）

这些是具有空间特征（点、线、多边形）的数据，常见格式：

| 格式                   | 描述                                            |
| -------------------- | --------------------------------------------- |
| **Shapefile (.shp)** | 最常见的矢量格式之一，包含多个关联文件（.shp, .shx, .dbf, .prj 等） |
| **GeoJSON**          | JSON 格式表示的地理数据，轻量，便于 web 前端使用                 |
| **GML / KML**        | XML 格式的地理数据                                   |
| **CSV**              | 如果包含经纬度字段，也可以发布为点图层                           |

👉 通常来源：

* 政府开放平台（如：中国地理信息公共服务平台）
* 自己通过 QGIS、ArcGIS 制作或处理
* 从第三方项目导出（如 OpenStreetMap、OSM 数据）

---

### ✅ 栅格数据（Raster Data）

这些是图像型地理数据，例如卫星图、DEM、影像图等：

| 格式                        | 描述                       |
| ------------------------- | ------------------------ |
| **GeoTIFF**               | TIFF 图像格式，包含地理坐标信息       |
| **JPEG/PNG + world file** | 配套 .jgw 或 .pgw 文件以记录地理信息 |
| **ArcGrid**               | Esri 栅格格式                |

👉 来源：

* 遥感影像（如 Landsat、Sentinel）
* DEM 高程数据（如 SRTM 数据）
* 自己通过 QGIS 生成的栅格输出

---

## 🗃️ 二、来自数据库

GeoServer 可直接连接空间数据库，从中读取和发布数据。

| 数据库                    | 要求                                         |
| ---------------------- | ------------------------------------------ |
| **PostGIS**            | PostgreSQL + GIS 扩展，GeoServer 最常配合使用的空间数据库 |
| **Oracle Spatial**     | Oracle 的空间数据库功能                            |
| **MySQL / MariaDB**    | 限制较多，不是主要选择                                |
| **SQL Server Spatial** | 支持空间扩展的 SQL Server                         |

👉 适合：

* 多用户编辑、动态数据更新
* WebGIS 系统后台数据管理
* 数据量大，适合做空间查询

---

## 🌍 三、来自远程地图服务（级联）

GeoServer 还可以作为中间层去**转发其他地图服务**（如 ArcGIS Server、其他 GeoServer、WMS 服务等），这叫：

* **WMS Cascading**（级联服务）
* **WFS / WCS 级联服务**

例如你已有外部的 WMS 图层地址，可以在 GeoServer 中引入，统一管理和样式控制。

---

## 🔄 四、动态生成或加工的数据

* 利用 GeoServer 插件或 WPS（Web Processing Service）处理服务，动态生成地图图层
* 例如：缓冲区分析、裁剪、叠加分析后生成的新图层

---

## 📦 总结：GeoServer 的地图数据来源

| 来源类型 | 示例                                |
| ---- | --------------------------------- |
| 本地文件 | Shapefile、GeoTIFF、GeoJSON、KML、CSV |
| 数据库  | PostGIS、Oracle Spatial、SQL Server |
| 远程服务 | 其他 WMS/WFS/WCS 服务（级联）             |
| 生成数据 | 通过 QGIS 处理，或 GeoServer WPS 插件动态生成 |

---

如果你手头没有数据，我可以推荐一些**免费数据下载平台**和**演示数据**，要看哪个方向（中国行政区、全球地形、交通、卫星图等）？
