// @ts-nocheck

import { PathBuilder } from '../../2d_raster/soft2d'
import { Vector2 } from '../../math/vec2'
import { clamp, divmod, fract } from '../../math/math'
import { drawBresenhamLineAntialias, drawDDALineAntialias } from './line'
type int26_6 = number
type int24_8 = number
class Int26_6 {
    static ONE = 1 << 6
    static MASK = (1 << 6) - 1
    static HALF = 1 << 5
    static SHIFT = 6
    static fromFloat(value: number) {
        return Math.floor(value * this.ONE)
    }
    static fromInt(value: int26_6) {
        return value << this.SHIFT
    }
    static toFloat(value: int26_6) {
        return value / this.ONE
    }
    static toRound(value: int26_6) {
        return (value + this.HALF) >> this.SHIFT
    }
    static toFloor(value: int26_6) {
        return (value) >> this.SHIFT
    }
    static toCeil(value: int26_6) {
        return (value + this.MASK) >> this.SHIFT
    }
    static round(value: int26_6) {
        return (value + this.HALF) & ~this.MASK
    }
    static floor(value: int26_6) {
        return value & ~this.MASK;
    }
    static ceil(value: int26_6) {
        return (value + this.MASK) & ~this.MASK
    }
    static fract(value: int26_6) {
        return value & this.MASK
    }

    static add(a: int26_6, b: int26_6) {
        return a + b
    }
    static sub(a: int26_6, b: int26_6) {
        return a - b
    }
    static mul_floor(a: int26_6, b: int26_6) {
        return (a * b) >> this.SHIFT
    }
    static div_floor(a: int26_6, b: int26_6) {
        return (a / b) << this.SHIFT
    }
    static mul_round(a: int26_6, b: int26_6) {
        return this.round(a * b) >> this.SHIFT
    }
    static div_round(a: int26_6, b: int26_6) {
        return this.round(a / b) << this.SHIFT
    }
}
class Int24_8 {
    static ONE = 1 << 8
    static MASK = (1 << 8) - 1
    static HALF = 1 << 7
    static SHIFT = 8
    static fromFloat(value: number) {
        return Math.round(value * this.ONE)
    }
    static fromInt(value: int24_8) {
        return value << this.SHIFT
    }
    static toFloat(value: int24_8) {
        return value / this.ONE
    }
    static toRound(value: int24_8) {
        return (value + this.HALF) >> this.SHIFT
    }
    static toFloor(value: int24_8) {
        return (value) >> this.SHIFT
    }
    static toCeil(value: int24_8) {
        return (value + this.MASK) >> this.SHIFT
    }
    static round(value: int24_8) {
        return (value + this.HALF) & ~this.MASK
    }
    static floor(value: int24_8) {
        return value & ~this.MASK;
    }
    static ceil(value: int24_8) {
        return (value + this.MASK) & ~this.MASK
    }
    static fract(value: int24_8) {
        return value & this.MASK
    }

    static add(a: int24_8, b: int24_8) {
        return a + b
    }
    static sub(a: int24_8, b: int24_8) {
        return a - b
    }
    static mul_floor(a: int24_8, b: int24_8) {
        return (a * b) >> this.SHIFT
    }
    static div_floor(a: int24_8, b: int24_8) {
        return Math.floor((a << this.SHIFT) / b)
    }
    static mul_round(a: int24_8, b: int24_8) {
        return this.round((a * b) >> this.SHIFT)
    }
    static div_round(a: int24_8, b: int24_8) {
        return this.fromFloat(a / b) << this.SHIFT
    }
}


type FillRule = "evenodd" | "nonzero"

type Span = {
    x: number
    len: number
    coverage: number
    y: number
}
type Cell = {
    x: number
    area: number
    cover: number
    next: Cell | null
}
type SetPixel = (x: number, y: number, cover: number) => void;
/**
 *  首先，我们注意到有几个主要函数：
  1. renderLine: 渲染从当前点到目标点的线段
  2. renderScanLine: 在一条扫描线（同一y坐标）上渲染水平线段的一部分
  3. hline: 实际绘制一个水平线段（跨度）
  4. sweep: 遍历所有单元格（cell）并生成最终的线段（spans）
 */
class Rasterizer {
    minY: number = 0
    maxY: number = 0
    minX: number = 0
    maxX: number = 0
    ex: number = 0
    ey: number = 0
    count_ex: number = 0
    count_ey: number = 0

    x: int24_8 = 0
    y: int24_8 = 0
    // 梯形面积的和：（上底+下底)*高度/2
    /***
     * (上底(256)+下底(256))*高度(256)))/512=256
     */
    area: number = 0 // 单元的面积
    // cover*512-area=实际覆盖面积
    // 实际面积/512=覆盖率
    cover: number = 0 // 单元的高度
    invalid: boolean = true //无效的
    spans: Span[] = []
    cells: Cell[] = []
    yCells: Cell[] = []
    fillRule: FillRule = 'nonzero'
    setPixel: SetPixel = () => { }
    constructor() {

    }

    moveTo(to: Vector2) {

        if (!this.invalid) {
            this.recordCell()
        }
        let x = to.x
        let y = to.y
        this.startCell(Int24_8.toFloor(x), Int24_8.toFloor(y))
        this.x = x
        this.y = y
        return 0
    }
    lineTo(to: Vector2) {
        let x = to.x
        let y = to.y
        this.renderLine(x, y)
    }


    /**
     * 渲染从当前点到目标点的线段
     * @param to_x 目标点x坐标 (24.8格式)
     * @param to_y 目标点y坐标 (24.8格式)
     */
    renderLine(to_x: int24_8, to_y: int24_8) {
        // 变量声明
        let ey1 = 0, ey2 = 0, fy1 = 0, fy2 = 0, first = 0, delta = 0, mod = 0;
        let p = 0, dx = 0, dy = 0, x = 0, x2 = 0;
        let incr = 0;

        // 提取起点和终点的整数部分和小数部分
        ey1 = Int24_8.toFloor(this.y);  // 起点y的整数部分
        ey2 = Int24_8.toFloor(to_y);    // 终点y的整数部分
        fy1 = Int24_8.fract(this.y);    // 起点y的小数部分 (0-255)
        fy2 = Int24_8.fract(to_y);      // 终点y的小数部分 (0-255)

        // 处理水平线段 (y坐标相同)
        if (ey1 == ey2) {
            // 直接渲染扫描线 fy1和fy2有可能相同
            this.renderScanLine(ey1, this.x, fy1, to_x, fy2);
            // 更新当前位置
            this.x = to_x;
            this.y = to_y;
            return;
        }

        // 计算x和y方向的增量
        dx = to_x - this.x;
        dy = to_y - this.y;

        // 处理垂直线段 (x坐标不变)
        if (dx == 0) {
            const ex = Int24_8.toFloor(this.x);  // x坐标的整数部分
            // 在hline中计算cover时，会除以512
            const two_fx = Int24_8.fract(this.x) << 1;  // 乘以2,用于通过面积计算覆盖度

            let area = 0, max_ey1 = 0;

            // 确定线段方向 (向上或向下)
            if (dy > 0) {
                first = Int24_8.ONE;  // 向下
            } else {
                first = 0;  // 向上
            }

            // 计算起始像素的覆盖面积
            delta = first - fy1;
            this.area += two_fx * delta;
            this.cover += delta;

            // 确定步进方向
            delta = dy > 0 ? Int24_8.ONE : -Int24_8.ONE;
            area = two_fx * delta;
            max_ey1 = this.count_ey + this.minY;  // 最大y坐标边界

            // 向下绘制垂直线段
            if (dy < 0) {
                // 边界检查
                if (ey1 > max_ey1) {
                    // 如果ey2在边界之外，ey1=ey2
                    ey1 = (max_ey1 > ey2) ? max_ey1 : ey2;// 检查max_ey1是否在ey1和ey2之间

                    this.setCell(ex, ey1);
                } else {
                    ey1--;
                    this.setCell(ex, ey1);
                }

                // 遍历所有像素
                while (ey1 > ey2 && ey1 >= this.minY) {
                    this.area += area;
                    this.cover += delta;
                    ey1--;
                    this.setCell(ex, ey1);
                }

                // 处理终点
                if (ey1 != ey2) {
                    ey1 = ey2;
                    this.setCell(ex, ey1);
                }
            }
            // 向上绘制垂直线段
            else {
                // 边界检查
                if (ey1 < this.minY) {
                    // 如果ey2在边界之外，ey1=ey2
                    ey1 = (this.minY < ey2) ? this.minY : ey2;// 检查minY是否在ey1和ey2之间
                    this.setCell(ex, ey1);
                } else {
                    ey1++;
                    this.setCell(ex, ey1);
                }

                // 遍历所有像素
                while (ey1 < ey2 && ey1 < max_ey1) {
                    this.area += area;
                    this.cover += delta;
                    ey1++;
                    this.setCell(ex, ey1);
                }

                // 处理终点
                if (ey1 != ey2) {
                    ey1 = ey2;
                    this.setCell(ex, ey1);
                }
            }

            // 计算结束像素的覆盖面积
            delta = dy > 0 ? fy2 : fy2 - Int24_8.ONE;
            this.area += two_fx * delta;
            this.cover += delta;

            // 更新当前位置
            this.x = to_x;
            this.y = to_y;
            return;
        }

        // 处理斜线段 (通用情况)
        // 确定线段方向 (向上或向下)
        if (dy > 0) {
           
            p = (Int24_8.ONE - fy1) * dx;  // 起始像素的面积
            first = Int24_8.ONE;  // 向下
            incr = 1;             // y增加方向
        } else {
            p = fy1 * dx;         // 起始像素的面积
            first = 0;            // 向上
            incr = -1;            // y减少方向
            dy = -dy;             // 使dy为正
        }

        // 计算初始步进量
         // (one-p0.y)*dx/dy 计算当前像素的x轴的步进增量
         // 根据直角三角形dx/dy 逆斜率，根据像y的高度计算x的宽度
         // 计算x的宽度
        [delta, mod] = divmod(p, dy);  // 整数除法和余数
        x = this.x + delta;// 下一个y的x轴交点

        // 渲染起始扫描线
        this.renderScanLine(ey1, this.x, fy1, x, first);
        ey1 += incr;
        this.setCell(Int24_8.toFloor(x), ey1);

        // 处理中间像素
        if (ey1 != ey2) {
            p = Int24_8.ONE * dx;  // 中间像素的面积

            // 计算中间像素的步进量
            let [lift, rem] = divmod(p, dy);

            do {
                delta = lift;
                mod += rem;

                // 处理余数累积
                if (mod >= dy) {
                    mod -= dy;
                    delta++;
                }

                x2 = x + delta;

                // 渲染中间扫描线
                this.renderScanLine(ey1, x, Int24_8.ONE - first, x2, first);

                x = x2;
                ey1 += incr;
                this.setCell(Int24_8.toFloor(x), ey1);
            } while (ey1 != ey2);
        }

        // 渲染结束扫描线
        this.renderScanLine(ey1, x, Int24_8.ONE - first, to_x, fy2);

        // 更新当前位置
        this.x = to_x;
        this.y = to_y;
    }

    /**
     * 渲染一条扫描线（同一y坐标上的水平线段）
     * @param ey 当前扫描线的y坐标（整数部分）
     * @param x1 起点x坐标 (24.8格式)
     * @param y1 起点y的小数部分
     * @param x2 终点x坐标 (24.8格式)
     * @param y2 终点y的小数部分
     */
    renderScanLine(ey: number, x1: int24_8, y1: number, x2: int24_8, y2: number) {
        let ex1 = 0, ex2 = 0, fx1 = 0, fx2 = 0, first, dy, delta = 0, mod = 0;
        let p = 0, dx = 0;
        let incr = 0;

        // 提取起点和终点的整数部分和小数部分
        ex1 = Int24_8.toFloor(x1);
        ex2 = Int24_8.toFloor(x2);

        // 处理完全水平的线段 (y1 == y2)
        if (y1 == y2) {
            this.setCell(ex2, ey);
            return;
        }

        fx1 = Int24_8.fract(x1);
        fx2 = Int24_8.fract(x2);

        // 处理同一列内的线段 (x坐标相同)
        if (ex1 == ex2) {
            dy = y2 - y1;
            // (上底+ 下底) × 高÷ 2 
            // 这里没有除以2
            this.area += (fx1 + fx2) * dy;  // 累加覆盖面积
            this.cover += dy;               // 累加覆盖值
            return;
        }

        // 计算x和y方向的增量
        dx = x2 - x1;
        dy = y2 - y1;

        // 确定线段方向 (从左到右或从右到左)
        if (dx > 0) {
            p = (Int24_8.ONE - fx1) * dy;  // 起始像素的面积
            first = Int24_8.ONE;            // 向右
            incr = 1;                      // x增加方向
        } else {
            p = fx1 * dy;                  // 起始像素的面积
            first = 0;                     // 向左
            incr = -1;                     // x减少方向
            dx = -dx;                      // 使dx为正
        }

        // 计算初始步进量
        // 计算y的高度
        [delta, mod] = divmod(p, dx);

        // 累加起始像素的覆盖面积
        this.area += (fx1 + first) * delta;
        this.cover += delta; 

        // 更新位置
        y1 += delta;// 下一个x的y轴交点
        ex1 += incr;
        this.setCell(ex1, ey);

        // 处理同一y像素的x轴中间像素
        if (ex1 !== ex2) {
            p = Int24_8.ONE * dy;  // 中间像素的面积

            // 计算中间像素的步进量
            let [lift, rem] = divmod(p, dx);

            do {
                delta = lift;
                mod += rem;

                // 处理余数累积
                if (mod >= dx) {
                    mod -= dx;
                    delta++;
                }

                // 累加中间像素的覆盖面积
                this.area += (Int24_8.ONE * delta);
                this.cover += delta;

                // 向y方高步进
                y1 += delta;
                ex1 += incr;
                this.setCell(ex1, ey);
            } while (ex1 != ex2);
        }

        // 处理结束像素
        fx1 = Int24_8.ONE - first;
        dy = y2 - y1;
        this.area += (fx1 + fx2) * dy;
        this.cover += dy;
    }

    /**
     * 生成水平线段（跨度）
     * @param x 起始x坐标（整数）
     * @param y 扫描线y坐标（整数）
     * @param area 覆盖面积值
     * @param acount 线段长度（像素数）
     */
    hline(x: number, y: number, area: number, acount: number) {
        // 计算覆盖率 (0-256范围)
        // 将面积值转换为实际的alpha值
        // 除以512,相当除以2,
        // 梯形的真实面积公式：(上底+ 下底) × 高÷ 2
        let coverage = Number(BigInt(area) >> (BigInt(Int24_8.SHIFT) * 2n + 1n - 8n));

        // 确保覆盖率为正数
        if (coverage < 0) {
            coverage = -coverage;
        }

        // 根据填充规则处理覆盖率
        if (this.fillRule === 'evenodd') {
            // 奇偶填充规则
            coverage &= 511;  // 相当于 mod 512
            if (coverage > 256) {
                coverage = 512 - coverage;
            } else if (coverage == 256) {
                coverage = 255;
            }
        } else {
            // 非零填充规则
            if (coverage >= 256) {
                coverage = 255;
            }
        }

        // 应用偏移量
        y += this.minY;
        x += this.minX;

        // 边界检查
        if (x >= (1 << 23)) {
            x = (1 << 23) - 1;
        }
        if (y >= (1 << 23)) {
            y = (1 << 23) - 1;
        }

        // 如果存在覆盖，则生成线段
        if (coverage) {
            const spans = this.spans;
            const last = spans[spans.length - 1];

            // 尝试合并相邻线段
            if (last &&
                last.x === x &&
                last.y === y &&
                last.x + last.len == x &&
                last.coverage == coverage) {
                last.len = last.len + acount;
                return;
            }

            // 创建新线段
            const span: Span = {
                x: x,
                len: acount,
                y: y,
                coverage: coverage
            };
            this.spans.push(span);
        }
    }

    /**
     * 扫描所有单元格并生成最终的水平线段
     */
    sweep() {
        // 遍历所有y坐标
        for (let yIndex = 0; yIndex < this.yCells.length; yIndex++) {
            let cell: Cell | null = this.yCells[yIndex];
            if (!cell) continue;

            let cover = 0, x = 0;

            // 遍历当前行的所有单元格
            for (; cell; cell = cell.next) {
                // 如果有覆盖且存在间隙，生成线段
                if (cell.x > x && cover !== 0) {
                    this.hline(x, yIndex, cover * (Int24_8.ONE * 2), cell.x - x);
                }

                // 累加覆盖值
                cover += cell.cover;

                // 计算当前单元格的覆盖面积
                // 当前覆盖面积-未覆盖面积=当前单元格的覆盖面积
                const area = cover * (Int24_8.ONE * 2) - cell.area;

                // 生成当前单元格的线段
                if (area != 0 && cell.x >= 0) {
                    this.hline(cell.x, yIndex, area, 1);
                }

                x = cell.x + 1;
            }

            // 处理行末剩余部分
            if (this.count_ex > x && cover != 0) {
                this.hline(x, yIndex, cover * (Int24_8.ONE * 2), this.count_ex - x);
            }
        }
    }
    startCell(ex: number, ey: number) {
        if (ex > this.maxX) {
            ex = this.maxX;
        }
        if (ex < this.minX) {
            ex = this.minX - 1;
        }
        this.area = 0
        this.cover = 0
        this.ex = ex - this.minX
        this.ey = ey - this.minY

        this.invalid = false // 设置为有效
        this.setCell(ex, ey)
    }
    // 记录上个cell,并将cell移动到当前
    setCell(ex: number, ey: number) {

        ey -= this.minY // 从边界开始

        // 设置最大边界范围
        if (ex > this.maxX) {
            ex = this.maxX
        }
        // 从边界开始
        ex -= this.minX
        // 判断是否无效
        if (ex < 0) {
            ex = -1;
            //ex=this.maxX
        }
        // 如果不是当前处理的像素，则重置当前像素的记录状态
        if (ex !== this.ex || ey !== this.ey) {
            // 如果有效,记录上个cell的像素点信息

            if (!this.invalid) {
                this.recordCell()
            }
            this.area = 0
            this.cover = 0
            this.ex = ex
            this.ey = ey

        }
        // 判断是否无效
        this.invalid = (ex >= this.count_ex || ey >= this.count_ey)

    }
    recordCell() {
        if (this.area !== 0 || this.cover !== 0) {
            let cell = this.findCell();
            // 累加面积和覆盖率
            cell.area += this.area;
            cell.cover += this.cover;
        }

    }
    findCell() {
        let x = this.ex
        if (x > this.count_ex) {
            x = this.count_ex
        }
        // 查找cell，如果没有则创建新的像素点,并按升序插入
        let cell = this.yCells[this.ey] as (Cell | null), prev: Cell | null = null
        while (cell) {
            if (cell.x == x) return cell
            if (cell.x > x) break
            prev = cell
            cell = cell.next
        }
        const newCell: Cell = {
            x: x,
            area: 0,
            cover: 0,
            next: cell || null
        }
        if (prev) {
            newCell.next = prev.next
            prev.next = newCell
        } else {
            this.yCells[this.ey] = newCell
        }
        return newCell

    }

    fillPath(path: PathBuilder) {
        let tmpPath = path.clone()
        tmpPath.points.forEach(d => {
            d.set(Int24_8.fromFloat(d.x), Int24_8.fromFloat(d.y))
        })
        const bounds = tmpPath.getBounds()

        this.minX = Int24_8.toFloor(bounds.min.x)
        this.minY = Int24_8.toFloor(bounds.min.y)
        this.maxX = Int24_8.toCeil(bounds.max.x)
        this.maxY = Int24_8.toCeil(bounds.max.y)

        this.count_ex = this.maxX - this.minX
        this.count_ey = this.maxY - this.minY


        tmpPath.visit({
            moveTo: d => {
                this.moveTo(d.p0)
            },
            lineTo: d => {
                this.lineTo(d.p0)
            },
            closePath: d => {
                if (d.lastMovePoint.equals(d.p0)) return
                this.lineTo(d.lastMovePoint)

            }
        })
        if (!this.invalid) {
            this.recordCell()
        }
        this.sweep()


        let spans = this.spans;
        for (let i = 0; i < spans.length; i++) {
            let span = spans[i]
            for (let x = span.x, j = 0; j < span.len; j++, x++) {
                this.setPixel(span.x + j, span.y, span.coverage)
            }

        }
    }

}
type Edge = {
    p0?: Vector2
    p1?: Vector2
    x: int24_8
    y0: int24_8
    y1: int24_8
    invertSlope: int24_8
    winding: number
}
class Rasterizer2 {
    setPixel!: SetPixel
    fillRule: FillRule = 'nonzero'
    x: int24_8 = 0
    y: int24_8 = 0
    edges: Edge[] = []
    moveTo(p: Vector2) {

        this.x = p.x
        this.y = p.y
    }
    lineTo(p: Vector2) {
        if (this.y === p.y) {
            this.x = p.x
            this.y = p.y
            return;
        }
        let p0 = Vector2.create(this.x, this.y)
        let p1 = Vector2.create(p.x, p.y)
        const winding = p1.y > p0.y ? 1 : -1
        if (p0.y > p1.y) {
            let tmp = p0.clone()
            p0.copy(p1)
            p1.copy(tmp)
        }

        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const x = p0.x
        const y0 = p0.y
        const y1 = p1.y
        const invertSlope = dx / dy

        let edge: Edge = {
            p0,
            p1,
            x: x,
            y0: y0,
            y1: y1,
            invertSlope: invertSlope,
            winding: winding
        }
        this.edges.push(edge)
        this.x = p.x
        this.y = p.y
    }
    buildEdges(path: PathBuilder) {

        path.visit({
            moveTo: d => {
                this.moveTo(d.p0)
            },
            lineTo: d => {
                this.lineTo(d.p0)
            },
            closePath: d => {
                if (d.lastMovePoint.equals(d.p0)) return
                this.lineTo(d.lastMovePoint)

            }
        })
    }
    hline(y: number, x0: number, x1: number, y0: number, y1: number) {

    }
    fillPath(path: PathBuilder) {

        let tmpPath = path.clone()

        this.buildEdges(tmpPath)
        if (this.edges.length < 2) {
            return
        }

        let edges = this.edges
        let bounds = tmpPath.getBounds()
        let min_y = bounds.min.y, max_y = bounds.max.y

        let activeEdges: Edge[] = []
        let insertActiveEdge = (edge: Edge) => {
            let i = 0
            for (; i < activeEdges.length; i++) {
                if (edge.x < activeEdges[i].x) {
                    break
                }
            }
            activeEdges.splice(i, 0, edge)

        }

        const min_fy = fract(min_y)
        const max_fy = fract(max_y)
        const min_iy = Math.floor(min_y + 0.5)
        const max_iy = Math.ceil(max_y + 0.5)
        for (let y = min_iy; y < max_iy; y++) {
            activeEdges.length = 0
            let fy = y + 0.5

            for (let i = 0; i < edges.length; i++) {
                let edge = edges[i]
                if (edge.y0 <= fy && edge.y1 > fy) {
                    edge.x = edge.p0!.x + (fy - edge.y0) * edge.invertSlope
                    insertActiveEdge(edge)
                }
            }
            if (activeEdges.length > 1) {
                let winding = 0
                for (let i = 0; i < activeEdges.length - 1; i++) {
                    if (this.fillRule === 'nonzero') {
                        winding += activeEdges[i].winding
                    } else {
                        winding++
                    }
                    if (winding % 2 !== 0) {
                        let fx0 = activeEdges[i].x
                        let fx1 = activeEdges[i + 1].x
                        // if(Math.abs(fx1-fx0)<=1e-6){
                        //     return
                        // }
                        let ix0 = Math.floor(fx0)
                        let ix1 = Math.ceil(fx1)

                        for (let x = ix0; x < ix1; x++) {

                            const pixelLeft = x;          // 像素左边界
                            const pixelRight = x + 1;     // 像素右边界
                            // 计算覆盖范围
                            const areaStart = Math.max(y, min_y);
                            const areaEnd = Math.min(y + 1, max_y);
                            const area = clamp(areaEnd - areaStart, 0, 1)
                            const coverageStart = Math.max(fx0, pixelLeft);
                            const coverageEnd = Math.min(fx1, pixelRight);

                            const coverage = clamp(coverageEnd - coverageStart, 0, 1)
                            const alpha = Math.round(coverage * 255)
                            this.setPixel(x >> 0, y >> 0, alpha)
                        }

                    }
                }
            }
            // activeEdges.forEach(d=>{
            //     d.x+=d.invertSlope
            // })

        }

    }

}

class Rasterizer3 {
    setPixel!: SetPixel
    fillRule: FillRule = 'nonzero'
    x: int24_8 = 0
    y: int24_8 = 0
    edges: Edge[] = []
    moveTo(p: Vector2) {

        this.x = p.x
        this.y = p.y
    }
    lineTo(p: Vector2) {
        if (this.y === p.y) {
            this.x = p.x
            this.y = p.y
            return;
        }
        let p0 = Vector2.create(this.x, this.y)
        let p1 = Vector2.create(p.x, p.y)
        const winding = p1.y > p0.y ? 1 : -1
        if (p0.y > p1.y) {
            let tmp = p0.clone()
            p0.copy(p1)
            p1.copy(tmp)
        }

        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const x = p0.x
        const y0 = p0.y
        const y1 = p1.y
        const invertSlope = dx / dy

        let edge: Edge = {
            p0,
            p1,
            x: x,
            y0: y0,
            y1: y1,
            invertSlope: invertSlope,
            winding: winding
        }
        this.edges.push(edge)
        this.x = p.x
        this.y = p.y
    }
    buildEdges(path: PathBuilder) {

        path.visit({
            moveTo: d => {
                this.moveTo(d.p0)
            },
            lineTo: d => {
                this.lineTo(d.p0)
            },
            closePath: d => {
                if (d.lastMovePoint.equals(d.p0)) return
                this.lineTo(d.lastMovePoint)

            }
        })
    }
    hline(y: number, x0: number, x1: number, y0: number, y1: number) {

    }
    fillPath(path: PathBuilder) {

        let tmpPath = path.clone()

        this.buildEdges(tmpPath)
        if (this.edges.length < 2) {
            return
        }

        let edges = this.edges
        let bounds = tmpPath.getBounds()
        let min_y = bounds.min.y, max_y = bounds.max.y

        let activeEdges: Edge[] = []
        let insertActiveEdge = (edge: Edge) => {
            let i = 0
            for (; i < activeEdges.length; i++) {
                if (edge.x < activeEdges[i].x) {
                    break
                }
            }
            activeEdges.splice(i, 0, edge)

        }

        const min_fy = fract(min_y)
        const max_fy = fract(max_y)
        const min_iy = Math.floor(min_y)
        const max_iy = Math.ceil(max_y)
        const spans:Span[] = []

        const getEdgeX=(edge:Edge,y:number)=>{
            return edge.p0!.x + (y - edge.y0) * edge.invertSlope
        }
        for (let y = min_iy; y < max_iy; y++) {
            activeEdges.length = 0
            let fy = y+1
            for (let i = 0; i < edges.length; i++) {
                let edge = edges[i]
                if (edge.y0 <= fy && edge.y1 > fy) {
                    edge.x = edge.p0!.x + (fy - edge.y0) * edge.invertSlope
                    insertActiveEdge(edge)
                }
            }
            if (activeEdges.length > 1) {
                let winding = 0
                let coverages:number[] = []
                for (let i = 0; i < activeEdges.length - 1; i++) {
                    if (this.fillRule === 'nonzero') {
                        winding += activeEdges[i].winding
                    } else {
                        winding++
                    }
                    if (winding % 2 !== 0) {

        
                     

                        let y0=Math.max(min_y, y)
                        let y1=Math.min(max_y, y+1)

                        let px0 =getEdgeX(activeEdges[i],y0)
                        let px1 =getEdgeX(activeEdges[i+1],y0)

                        let nx0 =getEdgeX(activeEdges[i],y1)
                        let nx1 =getEdgeX(activeEdges[i+1],y1)

                        let dx=nx1-nx0
                        let dy=y1-y0
                        let top_w=Math.abs(px1-px0)
                        let bottom_w=Math.abs(nx1-nx0)
                        let inx0=Math.trunc(nx0)
                        let inx1=Math.trunc(nx1)
                        
                        if(inx0===inx1){
                            let area=(top_w+bottom_w)*dy
                            let coverage=clamp(area,0,1)*255
                            spans.push({x:inx0,y:y,len:1,coverage:coverage})

                        }else{
                            let slope=1/activeEdges[i].invertSlope
                            let invertSlope=activeEdges[i].invertSlope
                            let yy=(1-fract(nx0))*slope
                            let xx=invertSlope
                        }
                    }
                }
            }
            // activeEdges.forEach(d=>{
            //     d.x+=d.invertSlope
            // })

        }

        for (let i = 0; i < spans.length; i++) {
            let span = spans[i]
            for (let x = span.x, j = 0; j < span.len; j++, x++) {
                this.setPixel(span.x + j, span.y, span.coverage)
            }

        }

    }

}

export function fillPath(path: PathBuilder, setPixel: SetPixel, fillRule: FillRule = 'nonzero') {


    let raster = new Rasterizer()
    raster.setPixel = setPixel
    raster.fillRule = fillRule
    raster.fillPath(path)


}