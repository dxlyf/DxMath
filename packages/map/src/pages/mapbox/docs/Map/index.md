# Map

## 构造参数
---

# 📌 Mapbox GL JS 构造函数参数说明（中文）

| 参数名                            | 类型                                        | 默认值                                 | 中文说明                                                                   |
| ------------------------------ | ----------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `accessToken`                  | `string`                                  | `null`                              | 指定 accessToken，若不设置则使用 `mapboxgl.accessToken` 中的值。                     |
| `antialias`                    | `boolean`                                 | `false`                             | 是否启用 MSAA 抗锯齿，默认关闭以优化性能。                                               |
| `attributionControl`           | `boolean`                                 | `true`                              | 是否添加地图右下角的 Attribution 控件。                                             |
| `bearing`                      | `number`                                  | `0`                                 | 初始地图方向，以北为基准逆时针角度（单位：度）。                                               |
| `bearingSnap`                  | `number`                                  | `7`                                 | 当旋转接近正北角度（小于该值）时自动对齐至北方。                                               |
| `bounds`                       | `LngLatBoundsLike`                        | `null`                              | 初始显示范围（优先于 `center` 和 `zoom`）。                                         |
| `boxZoom`                      | `boolean`                                 | `true`                              | 是否启用框选放大交互（Box Zoom）。                                                  |
| `center`                       | `LngLatLike`                              | `[0, 0]`                            | 初始地图中心点，格式为 `[经度, 纬度]`（注意顺序）。                                          |
| `clickTolerance`               | `number`                                  | `3`                                 | 用户点击过程中鼠标可移动的最大像素值，否则视为拖动。                                             |
| `collectResourceTiming`        | `boolean`                                 | `false`                             | 是否收集 GeoJSON/矢量瓦片加载的性能数据。                                              |
| `config`                       | `Object`                                  | `null`                              | 样式片段的初始配置，key 为 fragment ID，value 为配置对象。                               |
| `container`                    | `HTMLElement \| string`                   | 必填                                  | 用于渲染地图的 DOM 元素或其 `id`。元素不能包含子元素。                                       |
| `cooperativeGestures`          | `boolean?`                                | -                                   | 启用协同手势：滚轮缩放需按 `Ctrl/⌘`，触控需两指拖动。                                        |
| `crossSourceCollisions`        | `boolean`                                 | `true`                              | 是否允许来自不同数据源的符号碰撞检测。                                                    |
| `customAttribution`            | `string \| string[]`                      | `null`                              | 自定义版权信息，仅在启用 `attributionControl` 时有效。                                 |
| `doubleClickZoom`              | `boolean`                                 | `true`                              | 是否启用双击放大交互。                                                            |
| `dragPan`                      | `boolean \| Object`                       | `true`                              | 是否启用拖动地图交互，可传入配置对象。                                                    |
| `dragRotate`                   | `boolean`                                 | `true`                              | 是否启用按住右键/ctrl 拖动旋转地图的交互。                                               |
| `fadeDuration`                 | `number`                                  | `300`                               | 符号图层淡入淡出动画时长（毫秒），不影响样式变化动画。                                            |
| `failIfMajorPerformanceCaveat` | `boolean`                                 | `false`                             | 若性能严重下降（如使用软件渲染器）则初始化失败。                                               |
| `fitBoundsOptions`             | `Object`                                  | `null`                              | 设置初始 bounds 时使用的 `fitBounds` 配置项。                                      |
| `hash`                         | `boolean \| string`                       | `false`                             | 是否将地图状态同步到 URL Hash。支持传入 key 前缀。                                       |
| `interactive`                  | `boolean`                                 | `true`                              | 是否响应鼠标、触摸和键盘事件。设为 false 可禁用所有交互。                                       |
| `keyboard`                     | `boolean`                                 | `true`                              | 是否启用键盘快捷操作。                                                            |
| `language`                     | `"auto" \| string \| string[]`            | `null`                              | 地图语言，支持 BCP-47 语言代码或 `auto` 自动识别。                                      |
| `locale`                       | `Object`                                  | `null`                              | UI 文本本地化表，可指定所有或部分 UI 字符串。                                             |
| `localFontFamily`              | `string`                                  | `null`                              | 指定 CSS 字体名称，用于本地渲染所有 glyph 字形。                                         |
| `localIdeographFontFamily`     | `string`                                  | `'sans-serif'`                      | 指定用于本地渲染 CJK/韩文/假名的字体族，节省远程请求。设为 `false` 则使用样式字体设置。                    |
| `logoPosition`                 | `string`                                  | `'bottom-left'`                     | 设置 Mapbox logo 的位置：`top-left/top-right/bottom-left/bottom-right`。      |
| `maxBounds`                    | `LngLatBoundsLike`                        | `null`                              | 限制地图只能在指定范围内平移。                                                        |
| `maxPitch`                     | `number`                                  | `85`                                | 最大倾斜角（单位：度）。                                                           |
| `maxTileCacheSize`             | `number`                                  | `null`                              | 最大瓦片缓存数，未设置时自动根据视口调整。                                                  |
| `maxZoom`                      | `number`                                  | `22`                                | 最大缩放级别（0–24）。                                                          |
| `minPitch`                     | `number`                                  | `0`                                 | 最小倾斜角。                                                                 |
| `minTileCacheSize`             | `number`                                  | `null`                              | 最小瓦片缓存数，影响大屏幕设备缓存策略。                                                   |
| `minZoom`                      | `number`                                  | `0`                                 | 最小缩放级别。                                                                |
| `performanceMetricsCollection` | `boolean`                                 | `true`                              | 是否收集性能指标（上传给 Mapbox）。                                                  |
| `pitch`                        | `number`                                  | `0`                                 | 初始倾斜角（0–85°），默认垂直俯视。                                                   |
| `pitchRotateKey`               | `"Control" \| "Alt" \| "Shift" \| "Meta"` | `'Control'`                         | 设置用于控制倾斜/旋转的键盘修饰键。                                                     |
| `pitchWithRotate`              | `boolean`                                 | `true`                              | 是否允许通过拖动同时控制倾斜与旋转。                                                     |
| `preserveDrawingBuffer`        | `boolean`                                 | `false`                             | 是否保留 WebGL 缓冲区，可用于导出 PNG 图片。                                           |
| `projection`                   | `ProjectionSpecification`                 | `'mercator'`                        | 设置地图投影方式。支持 `mercator`、`globe`、`equalEarth`、`naturalEarth`、`albers` 等。 |
| `refreshExpiredTiles`          | `boolean`                                 | `true`                              | 是否在瓦片 HTTP 缓存过期后尝试重新请求。                                                |
| `renderWorldCopies`            | `boolean`                                 | `true`                              | 是否渲染地图左右重复世界副本（跨经度 ±180°）。                                             |
| `respectPrefersReducedMotion`  | `boolean`                                 | `true`                              | 是否根据用户浏览器设置（如“减少动画”）来降低动画量。                                            |
| `scrollZoom`                   | `boolean \| Object`                       | `true`                              | 是否启用滚轮缩放，可传配置对象。                                                       |
| `spriteFormat`                 | `"raster" \| "icon_set" \| "auto"`        | `'auto'`                            | 图标精灵格式，自动选择矢量或栅格。                                                      |
| `style`                        | `Object \| string`                        | `'mapbox://styles/mapbox/standard'` | 地图样式，可以是 URL（如 mapbox://）或符合规范的 JSON 对象。                               |
| `testMode`                     | `boolean`                                 | `false`                             | 测试模式下忽略 token 错误，用于单元测试等。                                              |
| `touchPitch`                   | `boolean \| Object`                       | `true`                              | 是否启用触摸倾斜交互（两指向上滑动）。                                                    |
| `touchZoomRotate`              | `boolean \| Object`                       | `true`                              | 是否启用双指缩放和旋转交互。                                                         |
| `trackResize`                  | `boolean`                                 | `true`                              | 是否在浏览器窗口变化时自动调整地图尺寸。                                                   |
| `transformRequest`             | `RequestTransformFunction`                | `null`                              | 在发起外部请求前回调，可自定义 url、headers、跨域参数等。                                     |
| `worldview`                    | `string`                                  | `null`                              | 设置地缘政治视角（Worldview），影响争议边界显示。                                          |
| `zoom`                         | `number`                                  | `0`                                 | 初始缩放级别。                                                                |

---

如果你还需要我将其做成 `.md` 文件或添加示例代码，请告诉我，我可以直接生成文件内容 ✅
