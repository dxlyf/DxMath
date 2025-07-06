// @ts-nocheck

import { PathBuilder } from '../../2d_raster/soft2d'
import { Vector2 } from '../../math/vec2'
import { clamp, divmod, fract } from '../../math/math'
import {drawBresenhamLineAntialias,drawDDALineAntialias } from './line'
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
        return Math.floor((a<< this.SHIFT) / b)
    }
    static mul_round(a: int24_8, b: int24_8) {
        return this.round((a * b) >> this.SHIFT)
    }
    static div_round(a: int24_8, b: int24_8) {
        return this.fromFloat(a / b) << this.SHIFT
    }
}
function divMod(a: number, b: number) {
    return [a % b, Math.floor(a / b)]
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
    area: number = 0
    cover: number = 0
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
            // 直接渲染扫描线
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
        [delta, mod] = divmod(p, dy);  // 整数除法和余数
        x = this.x + delta;

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
        [delta, mod] = divmod(p, dx);

        // 累加起始像素的覆盖面积
        this.area += (fx1 + first) * delta;
        this.cover += delta;

        // 更新位置
        y1 += delta;
        ex1 += incr;
        this.setCell(ex1, ey);

        // 处理中间像素
        if (ex1 !== ex2) {
            p = Int24_8.ONE * dy;  // 中间像素的面积

            // 计算中间像素的步进量
            let [lift, rem] = divMod(p, dx);

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

                // 更新位置
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
            // 如果有效
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
        const min_iy = Math.floor(min_y)+0.5
        const max_iy = Math.ceil(max_y)+0.5
        for (let y = min_iy; y < max_iy; y++) {
            activeEdges.length = 0
            let iy = Int24_8.fromFloat(y)
            for (let i = 0; i < edges.length; i++) {
                let edge = edges[i]
                if (edge.y0 <= y && edge.y1 > y) {
                    edge.x = edge.p0!.x+ (y - edge.y0) * edge.invertSlope
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
                            const alpha = Math.round(coverage*255)
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


type Vector2Fixed = { x: number; y: number };

export class Rasterizer3Fixed {
    setPixel!: (x: number, y: number, alpha: number) => void;
    fillRule: 'nonzero' | 'evenodd' = 'nonzero';
    private edges: Edge[] = [];
    private cur: Vector2Fixed = { x: 0, y: 0 };

    /** 移动到起点 p (float) */
    moveTo(px: number, py: number) {
        this.cur.x = Int24_8.fromFloat(px);
        this.cur.y = Int24_8.fromFloat(py);
    }

    /** 添加直线到 p (float)，使用 fixed point */
    lineTo(px: number, py: number) {
        const x1 = Int24_8.fromFloat(px), y1 = Int24_8.fromFloat(py);
        const x0 = this.cur.x, y0 = this.cur.y;
        if (y0 === y1) { this.cur = { x: x1, y: y1 }; return; }

        // 保证从低 y 到高 y
        let winding = +1;
        let yy0 = y0, yy1 = y1, xx0 = x0, xx1 = x1;
        if (y1 < y0) { winding = -1; yy0 = y1; yy1 = y0; xx0 = x1; xx1 = x0; }

        // dy, dx
        const dy = yy1 - yy0;
        const dx = xx1 - xx0;
        // 逆斜率 invSlope = dx/dy (fixed)
        const invSlope = Int24_8.div_floor(dx, dy)

        this.edges.push({
            y0: yy0,
            y1: yy1,
            x: xx0,
            invertSlope: invSlope,
            winding
        });
        this.cur = { x: x1, y: y1 };
    }

    /** 构建边列表 */    
    buildEdges(path: PathBuilder) {

        path.visit({
            moveTo: d => {
                this.moveTo(d.p0.x,d.p0.y)
            },
            lineTo: d => {
                this.lineTo(d.p0.x,d.p0.y)
            },
            closePath: d => {
                if (d.lastMovePoint.equals(d.p0)) return
                this.lineTo(d.lastMovePoint.x,d.lastMovePoint.y)

            }
        })
    }
    /** 填充路径 */
    fillPath(path: PathBuilder) {

        let tmpPath = path.clone()

        this.buildEdges(tmpPath)
        if (this.edges.length < 2) {
            return
        }

        // 排序并移除水平边
        this.edges = this.edges
            .filter(e => e.y1 > e.y0)
            .sort((a, b) => a.y0 - b.y0 || a.x - b.x);

        const active: Edge[] = [];
        let bounds = tmpPath.getBounds()
        let min_y = bounds.min.y, max_y = bounds.max.y
        // 扫描线，从 minY 到 maxY
        for (let fy = Int24_8.fromFloat(min_y),fyMax=Int24_8.fromFloat(max_y); fy < fyMax; fy += Int24_8.ONE) {
            // 激活新边
            while (this.edges.length && this.edges[0].y0 <= fy) active.push(this.edges.shift()!);
            // 移除过期边
            for (let i = active.length - 1; i >= 0; --i) {
                if (active[i].y1 <= fy) active.splice(i, 1);
            }
            

            // 按 x 排序
            active.sort((a, b) => a.x - b.x);

            // 走过每对交点进行填充
            let cover = 0;
            let startX = 0;
            for (const e of active) {
                const prev = cover;
                cover = this.fillRule === 'nonzero' ? prev + e.winding : (prev + 1) & 1;
                const insidePrev = this.fillRule === 'nonzero' ? prev !== 0 : prev === 1;
                const insideNow = this.fillRule === 'nonzero' ? cover !== 0 : cover === 1;
                if (!insidePrev && insideNow) startX = e.x;
                else if (insidePrev && !insideNow) this.rasterSpan(startX, e.x, fy);
            }

            // 更新 x
            active.forEach(e => e.x += e.invertSlope);
        }
    }

    /** 光栅化一段扫描线，x0,x1, y 都是 fixed */
    private rasterSpan(x0: number, x1: number, y: number) {
        if (x1 < x0) [x0, x1] = [x1, x0];
        const sx = Int24_8.toFloor(x0);
        const ex = Int24_8.toCeil(x1);
        const fy = Int24_8.toFloor(y);
        for (let fx = sx; fx <= ex; fx++) {
            // 计算覆盖：fixed -> float
            const left = Math.max(x0, fx << 8);
            const right = Math.min(x1, (fx + 1) << 8);
            const cov = clamp((right - left) / Int24_8.ONE,0,1);
            const alpha = Math.round(cov * 255);
            if (alpha > 0) this.setPixel(fx, fy, alpha);
        }
    }
}
// Ported from C code in Hearn & Baker "Computer Graphics - C Version", 2nd edition

function fillPoly(polygon:any, setPixel:any) {
  
    /*
    Struct Edge = {
      int yUpper,
      float xIntersect,
      float dxPerScan,
      Edge next
    }
    */
    
    function insertEdge(list, edge) {
      let q = list,
          p = list.next
      
      while (p) {
        if (edge.xIntersect < p.xIntersect) {
          p = null
        }
        else {
          q = p
          p = p.next
        }
      }
      
      edge.next = q.next
      q.next = edge
    }
    
    function yNext(k, cnt, pts) {
      let j
      
      if ((k+1) > (cnt-1)) {
        j = 0
      }
      else {
        j = k+1
      }
      
      while (pts[k][1] == pts[j][1]) {
        if ((j+1) > (cnt-1)) {
          j = 0
        }
        else {
          j++
        }
      }
      
      return pts[j][1]
    }
    
    function makeEdgeRec(lower, upper, yComp, edges) {
      let edge = {}
      edge.dxPerScan = (upper[0] - lower[0]) / (upper[1] - lower[1])
      edge.xIntersect = lower[0]
      if (upper[1] < yComp) {
        edge.yUpper = upper[1] - 1
      }
      else {
        edge.yUpper = upper[1]
      }
      insertEdge(edges[lower[1]], edge)
    }
    
    function buildEdgeList(pts, edges) {
      let cnt = pts.length,
          i,
          v1 = [0,0],
          v2 = [0,0],
          yPrev = pts[cnt-2][1]
          
      
      v1[0] = pts[cnt-1][0]
      v1[1] = pts[cnt-1][1]
      
      for (i=0; i<cnt; i++) {
        v2 = pts[i]
        if (v1[1] <= v2[1]) {
          makeEdgeRec(v1, v2, yNext(i, cnt, pts), edges)
        }
        if (v1[1] > v2[1]) {
          makeEdgeRec(v2, v1, yPrev, edges)
        }
        yPrev = v1[1]
        v1 = v2
      }
    }
    
    function buildActiveList(scan, active, edges) {
      let p = edges[scan].next,
          q
      
      while (p) {
        q = p.next
        insertEdge(active, p)
        p = q
      }
    }
    
    function fillScan(scan, active) {
      let p1 = active.next,
          p2,
          i
      
      while (p1) {
        p2 = p1.next
        // HACK FL for some reason we sometimes don't get pairwise lists...?
        if (p2) {
          for (i=Math.floor(p1.xIntersect); i<p2.xIntersect; i++) {
            setPixel(i, scan)
          }
        }
        p1 = p2 && p2.next
      }
    }
    
    function deleteAfter(q) {
      let p = q.next
      q.next = p.next
    }
    
    function updateActiveList(scan:number, active:any) {
      let q = active,
          p = active.next
      
      while (p) {
        if (scan >= p.yUpper) {
          p = p.next
          deleteAfter(q)
        }
        else {
          p.xIntersect = p.xIntersect + p.dxPerScan
          q = p
          p = p.next
        }
      }
    }
    
    function resortActiveList(active) {
      let q,
          p = active.next
      
      active.next = null
      while (p) {
        q = p.next
        insertEdge(active, p)
        p = q
      }
    }
    
    let edges = [],
        active,
        i,scan
    
    for (i = 0; i<500; i++) {
      edges[i] = {next: null}
    }
    
    buildEdgeList(polygon, edges)
    active = { next: null }
    
    for (scan = 0; scan<500; scan++) {
      buildActiveList(scan, active, edges)
      if (active.next) {
        fillScan(scan, active)
        updateActiveList(scan, active)
        resortActiveList(active)
      }
    }
  }
export function fillPath(path: PathBuilder, setPixel: SetPixel, fillRule: FillRule = 'nonzero') {

   
    let raster = new Rasterizer2()
    raster.setPixel = setPixel
    raster.fillRule = fillRule
    raster.fillPath(path)
    
    
}