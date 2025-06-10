import { FT_ABS, FT_HYPOT, FT_Vector, PointerArray, RefValue } from "./math"

export const FT_MINIMUM_POOL_SIZE = 8192
export const FT_MAX_GRAY_SPANS = 256
export const ErrRaster_Invalid_Mode = -2
export const ErrRaster_Invalid_Outline = -1
export const ErrRaster_Invalid_Argument = -3
export const ErrRaster_Memory_Overflow = -4
export const ErrRaster_OutOfMemory = -6

const PIXEL_BITS = 8
const ONE_PIXEL = (1 << PIXEL_BITS)
const TRUNC = (x: number) => ((x) >> PIXEL_BITS)
const FRACT = (x: number) => ((x) & (ONE_PIXEL - 1))
const UPSCALE = (x: number) => ((x) * (ONE_PIXEL >> 6))
const DOWNSCALE = (x: number) => ((x) >> (PIXEL_BITS - 6))
const FT_DIV_MOD = (type: any, dividend: number, divisor: number, quotient: RefValue<number>, remainder: RefValue<number>) => {
    quotient.value = type(Math.floor(dividend / divisor));
    remainder.value = type(dividend % divisor);

    if (remainder.value < 0) {
        quotient.value--;
        remainder.value += type(divisor);
    }

}
type TCoord = long
type TPos = long
type TArea = long
type FT_PtrDist = int

export class FT_BBox {
    static default() {
        return new this()
    }
    xMin: FT_Pos = 0
    yMin: FT_Pos = 0
    xMax: FT_Pos = 0
    yMax: FT_Pos = 0
}
export class FT_Outline {
    static default() {
        return new this()
    }
    n_contours: int = 0;// 轮廓数量
    n_points: int = 0;// 路径向量数量
    points: FT_Vector[] = [];// 路径数据
    tags: char[] = [];// 表示每个点的类型
    contours: int[] = [];// 表示上一个轮廓的结束位置
    contours_flag: char[] = [];// 开放路径是1,闭合路径是0
    flags: int = 0;// 填充规则

    check() {
        let outline = this
        if (outline) {
            let n_points = outline.n_points;
            let n_contours = outline.n_contours;
            let end0, end;
            let n;

            if (n_points == 0 && n_contours == 0)
                return 0;
            if (n_points <= 0 || n_contours <= 0)
                return -1;
            end0 = end = -1;
            for (n = 0; n < n_contours; n++) {
                end = outline.contours[n];
                if (end <= end0 || end >= n_points)
                    return -1;
                end0 = end;
            }
            if (end != n_points - 1)
                return -1;
            return 0;
        }

        return -1;
    }
    getCBox(acbox: FT_BBox) {
        let xMin: FT_Pos = 0, yMin: FT_Pos = 0, xMax: FT_Pos = 0, yMax: FT_Pos = 0;
        let outline = this;
        if (outline && acbox) {
            if (outline.n_points == 0) {
                xMin = 0;
                yMin = 0;
                xMax = 0;
                yMax = 0;
            }
            else {
                let vec = PointerArray.from(outline.points);

                xMin = xMax = vec.value.x;
                yMin = yMax = vec.value.y;
                vec.next();
                for (; vec.curIndex < vec.length; vec.next()) {
                    let x: FT_Pos, y: FT_Pos;
                    x = vec.value.x;
                    if (x < xMin)
                        xMin = x;
                    if (x > xMax)
                        xMax = x;
                    y = vec.value.y;
                    if (y < yMin)
                        yMin = y;
                    if (y > yMax)
                        yMax = y;
                }
            }
            acbox.xMin = xMin;
            acbox.xMax = xMax;
            acbox.yMin = yMin;
            acbox.yMax = yMax;
        }
    }
    render(params: FT_Raster_Params) {

    }
};
export const FT_OUTLINE_NONE = 0x0
export const FT_OUTLINE_OWNER = 0x1
export const FT_OUTLINE_EVEN_ODD_FILL = 0x2
export const FT_OUTLINE_REVERSE_FILL = 0x4
export const FT_CURVE_TAG = (flag: number) => (flag & 3);
export const FT_CURVE_TAG_ON = 1
export const FT_CURVE_TAG_CONIC = 0
export const FT_CURVE_TAG_CUBIC = 2
export const FT_Curve_Tag_On = FT_CURVE_TAG_ON
export const FT_Curve_Tag_Conic = FT_CURVE_TAG_CONIC
export const FT_Curve_Tag_Cubic = FT_CURVE_TAG_CUBIC

export class TBand {
    min: TPos = 0
    max: TPos = 0
};


export type FT_SpanFunc = (count: int, spans: FT_Span[], user: any) => void
type FT_Raster_Span_Func = FT_SpanFunc
export const FT_RASTER_FLAG_DEFAULT = 0x0
export const FT_RASTER_FLAG_AA = 0x1
export const FT_RASTER_FLAG_DIRECT = 0x2
export const FT_RASTER_FLAG_CLIP = 0x4

export class FT_Span {
    x: int = 0;              // 起始像素的 x 坐标
    len: int = 0;            // 像素段长度，从 x 开始向右延伸 len 像素
    y: int = 0;              // 当前 span 所在的 y 坐标（扫描线行号）
    coverage: uchar = 0;     // 灰度覆盖值（0-255），表示此 span 的覆盖程度
};
export class TCell {
    x: int = 0                // 当前 cell 的 x 坐标（整数像素位置）
    cover: int = 0            // 覆盖计数器（累加 y 子像素上的覆盖值）
    area: TArea = 0           // 面积累加器（用于精细抗锯齿灰度计算）
    next: TCell | null = null // 链表中的下一个 cell（用于冲突处理或 y-bucket 索引）

    copy(source: TCell) {
        this.x = source.x;
        this.cover = source.cover;
        this.area = source.area;
        this.next = source.next;
        return this
    }
    clone() {
        const cell = new TCell()
        cell.copy(this)
        return cell
    }
}

export class TWorker {
    ex: TCoord = 0;               // 当前点的 x 坐标（子像素精度）
    ey: TCoord = 0;               // 当前点的 y 坐标（子像素精度）

    min_ex: TPos = 0              // 所有轮廓点中的最小 x（边界框）
    max_ex: TPos = 0;             // 最大 x
    min_ey: TPos = 0              // 最小 y
    max_ey: TPos = 0;             // 最大 y

    count_ex: TPos = 0            // 扫描线宽度（x 像素数量）
    count_ey: TPos = 0;           // 扫描线高度（y 像素数量）

    area: TArea = 0;              // 当前正在处理的单元格的临时面积值
    cover: int = 0;               // 当前单元格的覆盖值

    invalid: int = 0;             // 标记某些内部状态是否失效（通常用于调试或跳过无效单元格）

    cells: TCell[] = [];          // 所有 cell 的缓冲区，用于构建覆盖图像
    max_cells: FT_PtrDist = 0;    // 最大允许的 cell 数量（缓冲区大小）
    num_cells: FT_PtrDist = 0;    // 当前已使用的 cell 数量

    x: TPos = 0                   // 逻辑处理用的当前像素 x 坐标
    y: TPos = 0;                  // 当前像素 y 坐标（整数）

    outline!: FT_Outline;         // 要扫描转换的轮廓路径
    clip_box!: FT_BBox;           // 可选裁剪框（bounding box）

    gray_spans: FT_Span[] = new Array(FT_MAX_GRAY_SPANS).fill(0).map(() => new FT_Span());
                                  // 缓存生成的灰度 span，用于最终输出或回调
    num_gray_spans: int = 0;      // 当前灰度 span 数量
    skip_spans: int = 0;          // 是否跳过 span 渲染（例如用于裁剪）

    render_span: FT_Raster_Span_Func | null = null;
                                  // 渲染 span 的回调函数（最终输出 span）

    render_span_data: any;        // 渲染 span 时附带的数据（例如目标缓冲区、上下文等）

    band_size: int = 0;           // 单个扫描带的高度（用于分带处理）
    band_shoot: int = 0;          // 当前处理的带偏移量

    // jump_buffer / buffer / buffer_size: 可能用于异常处理或优化分配，已注释

    ycells: (TCell | null)[] = [];// 每个 y 扫描线所对应的 cell 链表头指针
    ycount: TPos = 0;             // 当前 ycells 的总行数（即 scanline 数）
}


export class FT_Raster_Params {
    source: any;
    flags: int = 0;
    gray_spans: FT_SpanFunc | null = null;
    user: any;
    clip_box: FT_BBox = FT_BBox.default();
    constructor() {

    }
};

let currentWorker: TWorker | null = null
export function setCurrentWorker(worker: TWorker | null) {
    let prev = currentWorker
    currentWorker = worker;
    return prev
}

function gray_init_cells(buffer: any, byte_size: float64) {
    let ras = currentWorker!
    ras.ycells = [];
    ras.cells = [];
    ras.max_cells = 0;
    ras.num_cells = 0;
    ras.area = 0;
    ras.cover = 0;
    ras.invalid = 1;
}

function gray_compute_cbox() {
    const ras = currentWorker!
    let outline = ras.outline;
    let points = outline.points, vec = points[0], vecIndex = 0;
    let limit = outline.n_points;

    if (outline.n_points <= 0) {
        ras.min_ex = ras.max_ex = 0;
        ras.min_ey = ras.max_ey = 0;
        return;
    }
    ras.min_ex = ras.max_ex = vec.x;
    ras.min_ey = ras.max_ey = vec.y;
    vecIndex++;
    for (; vecIndex < limit; vecIndex++) {
        vec = points[vecIndex]
        let x = vec.x;
        let y = vec.y;
        if (x < ras.min_ex)
            ras.min_ex = x;
        if (x > ras.max_ex)
            ras.max_ex = x;
        if (y < ras.min_ey)
            ras.min_ey = y;
        if (y > ras.max_ey)
            ras.max_ey = y;
    }
    ras.min_ex = ras.min_ex >> 6;
    ras.min_ey = ras.min_ey >> 6;
    ras.max_ex = (ras.max_ex + 63) >> 6;
    ras.max_ey = (ras.max_ey + 63) >> 6;
}

function gray_find_cell(): TCell {
    const ras = currentWorker!

    let x = ras.ex;

    if (x > ras.count_ex) {
        x = ras.count_ex;
    }

    let prev: TCell | null = null
    let cell: TCell | null = ras.ycells[ras.ey];
    // 找到比当前x大的cell
    while (cell) {
        if (cell.x > x) {
            break;
        }
        if (cell!.x == x) {
            return cell!
        }
        prev = cell;
        cell = cell!.next;
    }

    // 保证从x排序（从小到大）
    let newCell = ras.cells[ras.num_cells]
    if (!newCell) {
        newCell = ras.cells[ras.num_cells] = new TCell()
    }
    ras.num_cells++
    newCell.x = x;
    newCell.area = 0;
    newCell.cover = 0;
    newCell.next = cell
    if (prev === null) {
        ras.ycells[ras.ey] = newCell;
    } else {
        prev.next = newCell
    }
    return newCell;
}
function gray_record_cell() {
    const ras = currentWorker!
    if (ras.area | ras.cover) {
        let cell = gray_find_cell();
        cell.area += ras.area;
        cell.cover += ras.cover;
    }
}
function gray_set_cell(ex: TCoord, ey: TCoord) {
    let ras = currentWorker!
    ey -= ras.min_ey;
    if (ex > ras.max_ex) {
        ex = ras.max_ex;
    }
    ex -= ras.min_ex;
    if (ex < 0) {
        ex = -1;
    }
    if (ex != ras.ex || ey != ras.ey) {
        if (!ras.invalid) {
            gray_record_cell();
        }
        ras.area = 0;
        ras.cover = 0;
        ras.ex = ex;
        ras.ey = ey;
    }
    ras.invalid = Number(ey >= ras.count_ey || ex >= ras.count_ex);
}

function gray_start_cell(ex: TCoord, ey: TCoord) {
    let ras = currentWorker!
    if (ex > ras.max_ex)
        ex = (ras.max_ex);
    if (ex < ras.min_ex)
        ex = (ras.min_ex - 1);
    ras.area = 0;
    ras.cover = 0;
    ras.ex = ex - ras.min_ex;
    ras.ey = ey - ras.min_ey;
    ras.invalid = 0;
    gray_set_cell(ex, ey);
}


function gray_render_scanline(ey: TCoord, x1: TPos, y1: TCoord, x2: TPos, y2: TCoord) {
    let ras = currentWorker!
    let ex1, ex2, fx1 = 0, fx2 = 0, first, dy, delta = 0, mod = 0;
    let p, dx;
    let incr;

    ex1 = TRUNC(x1);
    ex2 = TRUNC(x2);
    if (y1 == y2) {
        gray_set_cell(ex2, ey);
        return;
    }
    fx1 = FRACT(x1);
    fx2 = FRACT(x2);
    if (ex1 == ex2) {
        return End()
    }
    dx = x2 - x1;
    dy = y2 - y1;
    if (dx > 0) {
        p = (ONE_PIXEL - fx1) * dy;
        first = ONE_PIXEL;
        incr = 1;
    }
    else {
        p = fx1 * dy;
        first = 0;
        incr = -1;
        dx = -dx;
    }
    let deltaRef = RefValue.from(delta)
    let modRef = RefValue.from(mod)
    FT_DIV_MOD(Number, p, dx, deltaRef, modRef);
    delta = deltaRef.value
    mod = modRef.value
    ras.area += (fx1 + first) * delta;
    ras.cover += delta;
    y1 += delta;
    ex1 += incr;
    gray_set_cell(ex1, ey);
    if (ex1 != ex2) {
        let lift = RefValue.from(0), rem = RefValue.from(0);
        p = ONE_PIXEL * dy;
        FT_DIV_MOD(Number, p, dx, lift, rem);
        do {
            delta = lift.value;
            mod += rem.value;
            if (mod >= dx) {
                mod -= dx;
                delta++;
            }
            ras.area += (ONE_PIXEL * delta);
            ras.cover += delta;
            y1 += delta;
            ex1 += incr;
            gray_set_cell(ex1, ey);
        } while (ex1 != ex2);
    }
    fx1 = ONE_PIXEL - first;

    function End() {
        dy = y2 - y1;
        ras.area += ((fx1 + fx2) * dy);
        ras.cover += dy;
    }
    End()
}
function gray_render_line(to_x: TPos, to_y: TPos) {
    let ras = currentWorker!
    let ey1 = 0, ey2 = 0, fy1 = 0, fy2 = 0, first = 0, delta = RefValue.from(0), mod = RefValue.from(0);
    let p, dx, dy, x, x2;
    let incr;

    ey1 = TRUNC(ras.y);
    ey2 = TRUNC(to_y);
    if ((ey1 >= ras.max_ey && ey2 >= ras.max_ey) || (ey1 < ras.min_ey && ey2 < ras.min_ey))
        return End()
    fy1 = FRACT(ras.y);
    fy2 = FRACT(to_y);
    if (ey1 == ey2) {
        gray_render_scanline(ey1, ras.x, fy1, to_x, fy2);
        return End();
    }
    dx = to_x - ras.x;
    dy = to_y - ras.y;
    if (dx == 0) {
        let ex = TRUNC(ras.x);
        let two_fx = FRACT(ras.x) << 1;
        let area, max_ey1;

        if (dy > 0) {
            first = ONE_PIXEL;
        }
        else {
            first = 0;
        }
        delta.value = first - fy1;
        ras.area += two_fx * delta.value;
        ras.cover += delta.value;
        delta.value = first + first - ONE_PIXEL;
        area = two_fx * delta.value;
        max_ey1 = ras.count_ey + ras.min_ey;
        if (dy < 0) {
            if (ey1 > max_ey1) {
                ey1 = (max_ey1 > ey2) ? max_ey1 : ey2;
                gray_set_cell(ex, ey1);
            }
            else {
                ey1--;
                gray_set_cell(ex, ey1);
            }
            while (ey1 > ey2 && ey1 >= ras.min_ey) {
                ras.area += area;
                ras.cover += delta.value;
                ey1--;

                gray_set_cell(ex, ey1);
            }
            if (ey1 != ey2) {
                ey1 = ey2;
                gray_set_cell(ex, ey1);
            }
        }
        else {
            if (ey1 < ras.min_ey) {
                ey1 = (ras.min_ey < ey2) ? ras.min_ey : ey2;
                gray_set_cell(ex, ey1);
            }
            else {
                ey1++;
                gray_set_cell(ex, ey1);
            }
            while (ey1 < ey2 && ey1 < max_ey1) {
                ras.area += area;
                ras.cover += delta.value;
                ey1++;

                gray_set_cell(ex, ey1);
            }
            if (ey1 != ey2) {
                ey1 = ey2;
                gray_set_cell(ex, ey1);
            }
        }
        delta.value = (fy2 - ONE_PIXEL + first);
        ras.area += two_fx * delta.value;
        ras.cover += delta.value;
        return End();
    }
    if (dy > 0) {
        p = (ONE_PIXEL - fy1) * dx;
        first = ONE_PIXEL;
        incr = 1;
    }
    else {
        p = fy1 * dx;
        first = 0;
        incr = -1;
        dy = -dy;
    }
    FT_DIV_MOD(Number, p, dy, delta, mod);
    x = ras.x + delta.value;
    gray_render_scanline(ey1, ras.x, fy1, x, first);
    ey1 += incr;
    gray_set_cell(TRUNC(x), ey1);
    if (ey1 != ey2) {
        let lift = RefValue.from(0), rem = RefValue.from(0);
        p = ONE_PIXEL * dx;
        FT_DIV_MOD(Number, p, dy, lift, rem);
        do {
            delta.value = lift.value;
            mod.value += rem.value;
            if (mod.value >= dy) {
                mod.value -= dy;
                delta.value++;
            }
            x2 = x + delta.value;
            gray_render_scanline(ey1, x, ONE_PIXEL - first, x2, first);
            x = x2;
            ey1 += incr;
            gray_set_cell(TRUNC(x), ey1);
        } while (ey1 != ey2);
    }
    gray_render_scanline(ey1, x, ONE_PIXEL - first, to_x, fy2);
    function End() {
        ras.x = to_x;
        ras.y = to_y;
    }
    End()
}

function gray_split_conic(base: PointerArray<FT_Vector>) {
    let a, b;

    base.get(4).x = base.get(2).x;
    b = base.get(1).x;
    a = base.get(3).x = (base.get(2).x + b) / 2;
    b = base.get(1).x = (base.get(0).x + b) / 2;
    base.get(2).x = (a + b) / 2;

    base.get(4).y = base.get(2).y;
    b = base.get(1).y;
    a = base.get(3).y = (base.get(2).y + b) / 2;
    b = base.get(1).y = (base.get(0).y + b) / 2;
    base.get(2).y = (a + b) / 2;
}

function gray_render_conic(control: FT_Vector, to: FT_Vector) {
    let ras = currentWorker!;
    let bez_stack = new Array(16 * 2 + 1).fill(0).map(() => new FT_Vector());
    let arc = PointerArray.from(bez_stack);
    let dx, dy;
    let draw, split;

    arc.get(0).x = UPSCALE(to.x);
    arc.get(0).y = UPSCALE(to.y);
    arc.get(1).x = UPSCALE(control.x);
    arc.get(1).y = UPSCALE(control.y);
    arc.get(2).x = ras.x;
    arc.get(2).y = ras.y;

    if ((TRUNC(arc.get(0).y) >= ras.max_ey &&
        TRUNC(arc.get(1).y) >= ras.max_ey &&
        TRUNC(arc.get(2).y) >= ras.max_ey) || (TRUNC(arc.get(0).y) < ras.min_ey &&
            TRUNC(arc.get(1).y) < ras.min_ey &&
            TRUNC(arc.get(2).y) < ras.min_ey)) {
        ras.x = arc.get(0).x;
        ras.y = arc.get(0).y;
        return;
    }
    dx = FT_ABS(arc.get(2).x + arc.get(0).x - 2 * arc.get(1).x);
    dy = FT_ABS(arc.get(2).y + arc.get(0).y - 2 * arc.get(1).y);
    if (dx < dy) {
        dx = dy;
    }
    draw = 1;
    while (dx > ONE_PIXEL / 4) {
        dx >>= 2;
        draw <<= 1;
    }
    do {
        split = 1;
        while ((draw & split) == 0) {
            gray_split_conic(arc);
            arc.next(2);
            split <<= 1;
        }
        gray_render_line(arc.get(0).x, arc.get(0).y);
        arc.prev(2)
    } while (--draw);
}

function gray_split_cubic(base: PointerArray<FT_Vector>) {
    let a, b, c, d;

    base.get(6).x = base.get(3).x;
    c = base.get(1).x;
    d = base.get(2).x;
    base.get(1).x = a = (base.get(0).x + c) / 2;
    base.get(5).x = b = (base.get(3).x + d) / 2;
    c = (c + d) / 2;
    base.get(2).x = a = (a + c) / 2;
    base.get(4).x = b = (b + c) / 2;
    base.get(3).x = (a + b) / 2;

    base.get(6).y = base.get(3).y;
    c = base.get(1).y;
    d = base.get(2).y;
    base.get(1).y = a = (base.get(0).y + c) / 2;
    base.get(5).y = b = (base.get(3).y + d) / 2;
    c = (c + d) / 2;
    base.get(2).y = a = (a + c) / 2;
    base.get(4).y = b = (b + c) / 2;
    base.get(3).y = (a + b) / 2;
}

function gray_render_cubic(control1: FT_Vector, control2: FT_Vector, to: FT_Vector) {
    const ras = currentWorker!;
    let bez_stack = new Array(16 * 3 + 1).fill(0).map(() => new FT_Vector());
    let arc = PointerArray.from(bez_stack);
    let dx, dy, dx_, dy_;
    let dx1, dy1, dx2, dy2;
    let L, s, s_limit;

    arc.get(0).x = UPSCALE(to.x);
    arc.get(0).y = UPSCALE(to.y);
    arc.get(1).x = UPSCALE(control2.x);
    arc.get(1).y = UPSCALE(control2.y);
    arc.get(2).x = UPSCALE(control1.x);
    arc.get(2).y = UPSCALE(control1.y);
    arc.get(3).x = ras.x;
    arc.get(3).y = ras.y;

    if ((TRUNC(arc.get(0).y) >= ras.max_ey &&
        TRUNC(arc.get(1).y) >= ras.max_ey &&
        TRUNC(arc.get(2).y) >= ras.max_ey &&
        TRUNC(arc.get(3).y) >= ras.max_ey) || (TRUNC(arc.get(0).y) < ras.min_ey &&
            TRUNC(arc.get(1).y) < ras.min_ey &&
            TRUNC(arc.get(2).y) < ras.min_ey &&
            TRUNC(arc.get(3).y) < ras.min_ey)) {
        ras.x = arc.get(0).x;
        ras.y = arc.get(0).y;
        return;
    }
    for (; ;) {
        dx = dx_ = arc.get(3).x - arc.get(0).x;
        dy = dy_ = arc.get(3).y - arc.get(0).y;
        L = FT_HYPOT(dx_, dy_);
        if (L >= (1 << 23)) {
            Split()
            continue
        }
        s_limit = L * (ONE_PIXEL / 6);
        dx1 = arc.get(1).x - arc.get(0).x;
        dy1 = arc.get(1).y - arc.get(0).y;
        s = FT_ABS(dy * dx1 - dx * dy1);
        if (s > s_limit) {
            Split()
            continue
        }
        dx2 = arc.get(2).x - arc.get(0).x;
        dy2 = arc.get(2).y - arc.get(0).y;
        s = FT_ABS(dy * dx2 - dx * dy2);
        if (s > s_limit) {
            Split()
            continue
        }
        if (dx1 * (dx1 - dx) + dy1 * (dy1 - dy) > 0 || dx2 * (dx2 - dx) + dy2 * (dy2 - dy) > 0) {
            Split()
            continue
        }
        gray_render_line(arc.get(0).x, arc.get(0).y);
        if (arc.curIndex <= 0) {
            return;
        }
        arc.prev(3);

    }
    function Split() {
        gray_split_cubic(arc);
        arc.next(3)
    }
}

function gray_move_to(to: FT_Vector) {
    let ras = currentWorker!
    let x, y;

    if (!ras.invalid) {
        gray_record_cell();
    }
    x = UPSCALE(to.x);
    y = UPSCALE(to.y);
    gray_start_cell(TRUNC(x), TRUNC(y));
    ras.x = x;
    ras.y = y;
    return 0;
}

function gray_hline(x: TCoord, y: TCoord, area: TPos, acount: int) {
    let ras = currentWorker!
    let coverage;

    coverage = Number(BigInt(area) >> (BigInt(PIXEL_BITS) * 2n + 1n - 8n));
    if (coverage < 0)
        coverage = -coverage;
    if (ras.outline.flags & FT_OUTLINE_EVEN_ODD_FILL) {
        coverage &= 511;
        if (coverage > 256) {
            coverage = 512 - coverage;
        }
        else if (coverage == 256) {
            coverage = 255;
        }
    }
    else {
        if (coverage >= 256) {
            coverage = 255;
        }
    }
    y += ras.min_ey;
    x += ras.min_ex;
    if (x >= (1 << 23)) {
        x = (1 << 23) - 1;
    }
    if (y >= (1 << 23)) {
        y = (1 << 23) - 1;
    }
    if (coverage) {

        let count;
        let skip;
        count = ras.num_gray_spans;
        let span = PointerArray.from(ras.gray_spans).move(count - 1)
        //ras.gray_spans[count - 1];
        if (count > 0 && span.value.y == y && span.value.x + span.value.len == x && span.value.coverage == coverage) {
            span.value.len = span.value.len + acount;
            return;
        }
        if (count >= FT_MAX_GRAY_SPANS) {
            if (ras.render_span && count > ras.skip_spans) {
                skip = ras.skip_spans > 0 ? ras.skip_spans : 0;
                ras.render_span!(ras.num_gray_spans - skip,
                    ras.gray_spans.slice(skip),
                    ras.render_span_data);
            }
            ras.skip_spans -= ras.num_gray_spans;
            ras.num_gray_spans = 0;
            span = PointerArray.from(ras.gray_spans);
        }
        else {
            span.next();
        }
        span.value.x = x;
        span.value.len = acount;
        span.value.y = y;
        span.value.coverage = coverage;
        ras.num_gray_spans++;
    }
}

function gray_sweep() {
    let ras = currentWorker!
    let yindex;

    if (ras.num_cells == 0) {
        return;
    }
    for (yindex = 0; yindex < ras.ycells.length; yindex++) {
        if (!ras.ycells[yindex]) {
            continue
        }
        let cell: null | TCell = ras.ycells[yindex];
        let cover = 0;
        let x = 0;

        for (; cell != null; cell = cell.next) {
            let area;
            if (cell.x > x && cover != 0) {
                gray_hline(x, yindex, cover * (ONE_PIXEL * 2), cell.x - x);
            }
            cover += cell.cover;
            area = cover * (ONE_PIXEL * 2) - cell.area;
            if (area != 0 && cell.x >= 0) {
                gray_hline(cell.x, yindex, area, 1);
            }
            x = cell.x + 1;
        }
        if (ras.count_ex > x && cover != 0) {
            gray_hline(x, yindex, cover * (ONE_PIXEL * 2), ras.count_ex - x);
        }
    }
}
const SCALED = (x: number) => x
function FT_Outline_Decompose(outline: FT_Outline) {

    let v_last = FT_Vector.default();
    let v_control = FT_Vector.default();
    let v_start = FT_Vector.default();
    let point;
    let limit;
    let tags;
    let n;
    let first;
    let error;
    let tag;

    if (!outline) {
        return ErrRaster_Invalid_Outline;
    }
    first = 0;
    forOuter:
    for (n = 0; n < outline.n_contours; n++) {
        let last;
        last = outline.contours[n];
        if (last < 0) {
            return ErrRaster_Invalid_Outline;
        }
        limit = PointerArray.from(outline.points).move(last) as PointerArray<FT_Vector>;
        v_start = outline.points[first];
        v_start.x = SCALED(v_start.x);
        v_start.y = SCALED(v_start.y);
        v_last = outline.points[last];
        v_last.x = SCALED(v_last.x);
        v_last.y = SCALED(v_last.y);
        v_control = v_start;
        point = PointerArray.from(outline.points).move(first) as PointerArray<FT_Vector>;
        tags = PointerArray.from(outline.tags).move(first) as PointerArray<number>;
        tag = FT_CURVE_TAG(tags.get(0));
        if (tag == FT_CURVE_TAG_CUBIC) {
            return ErrRaster_Invalid_Outline;
        }
        if (tag == FT_CURVE_TAG_CONIC) {
            if (FT_CURVE_TAG(outline.tags[last]) == FT_CURVE_TAG_ON) {
                v_start = v_last;
                limit.prev();
            }
            else {
                v_start.x = (v_start.x + v_last.x) / 2;
                v_start.y = (v_start.y + v_last.y) / 2;
                v_last = v_start;
            }
            point.prev();
            tags.prev();
        }
        error = gray_move_to(v_start);
        if (error) {
            return error;
        }
        oneWhile:
        while (point.curIndex < limit.curIndex) {
            point.next();
            tags.next();
            tag = FT_CURVE_TAG(tags.get(0));
            switch (tag) {
                case FT_CURVE_TAG_ON:
                    {
                        let vec = FT_Vector.default();
                        vec.x = SCALED(point.value.x);
                        vec.y = SCALED(point.value.y);
                        gray_render_line(UPSCALE(vec.x), UPSCALE(vec.y));
                        continue;
                    }
                case FT_CURVE_TAG_CONIC:
                    {
                        v_control.x = SCALED(point.value.x);
                        v_control.y = SCALED(point.value.y);
                        while (point.curIndex < limit.curIndex) {
                            let vec = FT_Vector.default();
                            let v_middle = FT_Vector.default();
                            point.next();
                            tags.next();
                            tag = FT_CURVE_TAG(tags.get(0));
                            vec.x = SCALED(point.value.x);
                            vec.y = SCALED(point.value.y);
                            if (tag == FT_CURVE_TAG_ON) {
                                gray_render_conic(v_control, vec);
                                continue;
                            }
                            if (tag != FT_CURVE_TAG_CONIC) {
                                return ErrRaster_Invalid_Outline;
                            }
                            v_middle.x = (v_control.x + vec.x) / 2;
                            v_middle.y = (v_control.y + vec.y) / 2;
                            gray_render_conic(v_control, v_middle);
                            v_control = vec;
                        }
                        gray_render_conic(v_control, v_start);
                        first = last + 1;
                        continue forOuter
                    }
                default:
                    {
                        let vec1 = FT_Vector.default(), vec2 = FT_Vector.default();
                        if (point.curIndex + 1 > limit.curIndex ||
                            FT_CURVE_TAG(tags.get(1)) != FT_CURVE_TAG_CUBIC) {
                            return ErrRaster_Invalid_Outline;
                        }
                        point.next(2);
                        tags.next(2);
                        vec1.x = SCALED(point.get(-2).x);
                        vec1.y = SCALED(point.get(-2).y);
                        vec2.x = SCALED(point.get(-1).x);
                        vec2.y = SCALED(point.get(-1).y);
                        if (point.curIndex <= limit.curIndex) {
                            let vec = FT_Vector.default();
                            vec.x = SCALED(point.value.x);
                            vec.y = SCALED(point.value.y);
                            gray_render_cubic(vec1, vec2, vec);
                            continue;
                        }
                        gray_render_cubic(vec1, vec2, v_start);
                        first = last + 1;
                        continue forOuter
                    }
            }
        }
        gray_render_line(UPSCALE(v_start.x), UPSCALE(v_start.y));

        first = last + 1;
    }
    return 0;
}
function gray_convert_glyph_inner() {
    let ras = currentWorker!
    let error = 0;

    error = FT_Outline_Decompose(ras.outline);
    if (!ras.invalid) {
        gray_record_cell();
    }
    return error;
}

function gray_convert_glyph() {
    const ras = currentWorker!
    let bands: TBand[] = new Array(40).fill(0).map(() => new TBand());
    let band;
    let n, num_bands;
    let min, max, max_y;
    let clip;
    let skip;

    ras.num_gray_spans = 0;
    gray_compute_cbox();
    clip = ras.clip_box;
    if (ras.max_ex <= clip.xMin || ras.min_ex >= clip.xMax || ras.max_ey <= clip.yMin || ras.min_ey >= clip.yMax) {
        return 0;
    }
    if (ras.min_ex < clip.xMin) {
        ras.min_ex = clip.xMin;
    }
    if (ras.min_ey < clip.yMin) {
        ras.min_ey = clip.yMin;
    }
    if (ras.max_ex > clip.xMax) {
        ras.max_ex = clip.xMax;
    }
    if (ras.max_ey > clip.yMax) {
        ras.max_ey = clip.yMax;
    }
    ras.count_ex = ras.max_ex - ras.min_ex;
    ras.count_ey = ras.max_ey - ras.min_ey;
    // 分块处理
    num_bands = Math.trunc((ras.max_ey - ras.min_ey) / ras.band_size);
    if (num_bands == 0) {
        num_bands = 1;
    }
    if (num_bands >= 39) {
        num_bands = 39;
    }
    ras.band_shoot = 0;
    min = ras.min_ey;
    max_y = ras.max_ey;

    // for (n = 0; n < num_bands; n++, min = max) {
    //     max = min + ras.band_size;
    //     if (n == num_bands - 1 || max > max_y) {
    //         max = max_y;
    //     }
    //     bands[0].min = min;
    //     bands[0].max = max;
    //     band = PointerArray.from(bands);
    //     const sizeofPCell = 8//sizeof(PCell)
    //     while (band.curIndex >= 0) {
    //         let bottom, top, middle;
    //         let error;
    //         {
    //             let cells_max;
    //             let yindex;
    //             let cell_start, cell_end, cell_mod;
    //             ras.ycells = [];
    //             ras.ycount = band.value.max - band.value.min;
    //            //  cell_start = ras.ycount;
    //             //  cell_mod = cell_start;
    //             // if(cell_mod > 0)
    //             //    cell_start += sizeof(TCell) - cell_mod;
    //             //   cell_end = ras.buffer_size;
    //             // cell_end -= cell_end % sizeof(TCell);
    //             // cells_max = (PCell)((char*)ras.buffer + cell_end);
    //             ras.cells = []
    //             //(PCell)((char*)ras.buffer + cell_start);
    //             // if (ras.cells >= cells_max) {
    //             //     bottom = band.value.min;
    //             //     top = band.value.max;
    //             //     middle = bottom + ((top - bottom) >> 1);
    //             //     if (middle == bottom) {
    //             //         return ErrRaster_OutOfMemory;
    //             //     }
    //             //     if (bottom - top >= ras.band_size) {
    //             //         ras.band_shoot++;
    //             //     }
    //             //     band.get(1).min = bottom;
    //             //     band.get(1).max = middle;
    //             //     band.get(0).min = middle;
    //             //     band.get(0).max = top;
    //             //     band.next();
    //             //     break
    //             // }
    //            // ras.max_cells = (cells_max - ras.cells);
    //             // if (ras.max_cells < 2) {
    //             //     bottom = band.value.min;
    //             //     top = band.value.max;
    //             //     middle = bottom + ((top - bottom) >> 1);
    //             //     if (middle == bottom) {
    //             //         return ErrRaster_OutOfMemory;
    //             //     }
    //             //     if (bottom - top >= ras.band_size) {
    //             //         ras.band_shoot++;
    //             //     }
    //             //     band.get(1).min = bottom;
    //             //     band.get(1).max = middle;
    //             //     band.get(0).min = middle;
    //             //     band.get(0).max = top;
    //             //     band.next();
    //             //     break
    //             // }
    //             for (yindex = 0; yindex < ras.ycount; yindex++)
    //             {
    //                 ras.ycells[yindex] = null;
    //             }
    //         }
    //         ras.num_cells = 0;
    //         ras.invalid = 1;
    //         ras.min_ey = band.value.min;
    //         ras.max_ey = band.value.max;
    //         ras.count_ey = band.value.max - band.value.min;
    //         error = gray_convert_glyph_inner();
    //         if (!error) {
    //             gray_sweep();
    //             band.prev();
    //             continue;
    //         }
    //         else if (error != ErrRaster_Memory_Overflow) {
    //             return 1;
    //         }

    //         bottom = band.value.min;
    //         top = band.value.max;
    //         middle = bottom + ((top - bottom) >> 1);
    //         if (middle == bottom) {
    //             return ErrRaster_OutOfMemory;
    //         }
    //         if (bottom - top >= ras.band_size) {
    //             ras.band_shoot++;
    //         }
    //         band.get(1).min = bottom;
    //         band.get(1).max = middle;
    //         band.get(0).min = middle;
    //         band.get(0).max = top;
    //         band.next();
    //     }
    // }

    let error = gray_convert_glyph_inner()
    gray_sweep()

    if (ras.render_span && ras.num_gray_spans > ras.skip_spans) {
        skip = ras.skip_spans > 0 ? ras.skip_spans : 0;
        ras.render_span(ras.num_gray_spans - skip,
            ras.gray_spans.slice(skip),
            ras.render_span_data);
    }
    ras.skip_spans -= ras.num_gray_spans;

    return 0;
}


export function gray_raster_render(buffer: any, buffer_size: float64, params: FT_Raster_Params) {
    const outline = params.source as FT_Outline;
    const ras = currentWorker!
    if (outline == null)
        return ErrRaster_Invalid_Outline;
    if (outline.n_points == 0 || outline.n_contours <= 0)
        return 0;
    if (!outline.contours || !outline.points)
        return ErrRaster_Invalid_Outline;
    if (outline.n_points != outline.contours[outline.n_contours - 1] + 1)
        return ErrRaster_Invalid_Outline;
    if (!(params.flags & FT_RASTER_FLAG_AA))
        return ErrRaster_Invalid_Mode;
    if (!(params.flags & FT_RASTER_FLAG_DIRECT))
        return ErrRaster_Invalid_Mode;
    if (params.flags & FT_RASTER_FLAG_CLIP) {
        ras.clip_box = params.clip_box;
    }
    else {
        ras.clip_box.xMin = -(1 << 23);
        ras.clip_box.yMin = -(1 << 23);
        ras.clip_box.xMax = (1 << 23) - 1;
        ras.clip_box.yMax = (1 << 23) - 1;
    }
    gray_init_cells(buffer, buffer_size);
    ras.outline = outline;
    ras.num_cells = 0;
    ras.invalid = 1;
    ras.band_size = Math.trunc(buffer_size / (24 * 8));
    ras.render_span = params.gray_spans as FT_Raster_Span_Func;
    ras.render_span_data = params.user;
    return gray_convert_glyph();
}


export function FT_Raster_Render(params: FT_Raster_Params) {
    let stack = new Uint8Array(FT_MINIMUM_POOL_SIZE);
    let length = FT_MINIMUM_POOL_SIZE;

    let worker = new TWorker();
    worker.skip_spans = 0;
    setCurrentWorker(worker)
    let rendered_spans = 0;
    let error = gray_raster_render(stack, length, params);
    // while (error == ErrRaster_OutOfMemory) {
    //     if (worker.skip_spans < 0)
    //         rendered_spans += -worker.skip_spans;
    //     worker.skip_spans = rendered_spans;
    //     length *= 2;
    //     void * heap = malloc(length);
    //     error = gray_raster_render(& worker, heap, length, params);
    //     free(heap);
    // }
}