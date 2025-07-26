import {Color} from '../image/Color'
import {Gradient} from '../image/Gradient'
import {Pattern} from '../image/Pattern'

export enum PaintStyle{
    Fill,
    Ftroke,
    FillAndStroke
}
type FillStyle = string|Color | Gradient | Pattern;
type StrokeStyle = string|Color | Gradient | Pattern;

export interface DisplayableStyle{
    lineWidth?:number; // 默认值1
    lineCap?:CanvasLineCap; // 默认值butt
    lineJoin?:CanvasLineJoin; // 默认值miter
    miterLimit?:number; // 默认值10
    fillStyle?:FillStyle|null // 默认值'#000'
    strokeStyle?:StrokeStyle|null
}
export interface DisplayableProps{

    style?: DisplayableStyle
    /***
     * 决定绘画在哪层 Canvas 中。Canvas 分层是一种常见的优化手段。
     * 我们可以把一些图形变化频繁（例如有动画）的组件设置成一个单独的 zlevel。
     * 需要注意的是过多的 Canvas 会引起内存开销的增大，
     * 在手机端上需要谨慎使用以防崩溃。zlevel 大的 Canvas 会放在 zlevel 小的 Canvas 的上面
     */
    zlevel?: number 
    // 控制图形的前后顺序。z 值小的图形会被 z 值大的图形覆盖。z 相比 zlevel 优先级更低，而且不会创建新的 Canvas。
    z?: number 
    z2?: number //	与 z 类似，优先级比 z 更低。

    //默认为false，是否开启裁剪。开启后，绘制时会先进行一次裁剪判断，如果当前图形不在视口裁剪区域中则不进行绘制。这样可以提高绘制的效率。
    culling?: boolean 

    // TODO list all cursors
    cursor?: string // 默认为'default', 鼠标悬停时显示的样式，例如：'pointer'

    rectHover?: boolean // 默认为false，当鼠标移动到图形上时，矩形区域会自动加上热点进行触发（参见`rectHover`）

    progressive?: boolean // 默认为false，是否使用渐进式渲染。渐进式渲染适用于大规模的绘制点和高配合比的场景。在启用后，绘制会是这样的过程：将同级的图形分成多个批次进行渲染，但是从图形外部往图形内部渲染，且每个批次的元素数量都不会超过一定的

    incremental?: boolean // 默认为false，是否开启增量渲染。增量渲染适用于数据时常更新的场景。在启用后，每次绘制前会做一次增量检查，增量检查通过后会只对变化的部分进行绘制。增量检查的依据是上次绘制结果的bounding box和本次绘制结果的bounding box的比较。

    ignoreCoarsePointer?: boolean //是否忽略增加响应范围。默认情况下，在移动设备上，为了提高用户体验，可点击元素的响应范围会被扩大处理。如果某些元素不希望扩大响应范围，则应设为 true。

    batch?: boolean
    invisible?: boolean //图形是否不可见，为 true 时不绘制图形，但是仍能触发鼠标事件。
}