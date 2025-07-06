// Copyright 2010 The Freetype-Go Authors. All rights reserved.
// Use of this source code is governed by your choice of either the
// FreeType License or the GNU General Public License version 2 (or
// any later version), both of which can be found in the LICENSE file.

// Package raster provides an anti-aliasing 2-D rasterizer.
//
// It is part of the larger Freetype suite of font-related packages, but the
// raster package is not specific to font rasterization, and can be used
// standalone without any other Freetype package.
//
// Rasterization is done by the same area/coverage accumulation algorithm as
// the Freetype "smooth" module, and the Anti-Grain Geometry library. A
// description of the area/coverage algorithm is at
// http://projects.tuxee.net/cl-vectors/section-the-cl-aa-algorithm
//package raster // import "github.com/golang/freetype/raster"

import { Int26_6, Point26_6,int26_6} from './fixed'
import { maxAbs,Path,Adder } from './geom'
import { Stroker, Capper, Joiner,Stroke } from './stroke'
import {Painter,Span} from './paint'
// A cell is part of a linked list (for a given yi co-ordinate) of accumulated
// area/coverage for the pixel at (xi, yi).
class Cell {
    static default(){
        return this.from(0,0,0,0)
    }
    static from(xi: int, area: int, cover: int, next: int) {
        return new Cell(xi, area, cover, next)
    }
    xi: int
    area: int
    cover: int
    next: int
    constructor(xi: int, area: int, cover: int, next: int) {
        this.xi = xi>>0
        this.area = area>>0
        this.cover = cover>>0
        this.next = next>>0
    }
}

type int = number
export class Rasterizer {
    // If false, the default behavior is to use the even-odd winding fill
    // rule during Rasterize.
    UseNonZeroWinding: boolean=false
    // An offset (in pixels) to the painted spans.
    Dx: int=0
    Dy: int=0

    // The width of the Rasterizer. The height is implicit in len(cellIndex).
    width: int=0
    // splitScaleN is the scaling factor used to determine how many times
    // to decompose a quadratic or cubic segment into a linear approximation.
    splitScale2: int=0
    splitScale3: int=0

    // The current pen position.
    a: Point26_6=Point26_6.default()
    // The current cell and its area/coverage being accumulated.
    xi: int=0
    yi: int=0
    area: int=0
    cover: int=0

    // Saved cells.
    cell: Cell[]=[]
    // Linked list of cells, one per row.
    cellIndex: int[]=[]
    // Buffers.
    cellBuf: Cell[]=[]//      [256]cell
    cellIndexBuf: int[]=[]// [64]int
    spanBuf: Span[]=[] //      [64]Span
    //FindCell返回与对应的单元格中的r.cell索引
    //（r.xi，r.yi）。如有必要，将创建单元格。
    findCell():int {
        if (this.yi < 0 || this.yi >= this.cellIndex.length) {
            return -1;
        }

        let xi = this.xi;
        if (xi < 0) {
            xi = -1;
        } else if (xi > this.width) {
            xi = this.width;
        }

        let i = this.cellIndex[this.yi];
        let prev = -1;
        // 按x升序，找到等于或小于当前xi前面的cell
        while (i !== -1 && this.cell[i].xi <= xi) {
            if (this.cell[i].xi === xi) {
                return i;
            }
            prev = i;
            i = this.cell[i].next;
        }

        const c = this.cell.length;
        // if (c === this.cell.length) {
        //     // JavaScript 数组是动态的，无需手动扩容
        //     this.cell[c] = Cell.from(xi,0,0,i)
        // } else {
        //     this.cell[c] = Cell.from(xi,0,0,i)
        // }
        // 创建一个x cell
        this.cell[c] = Cell.from(xi, 0, 0, i)
        // 链表形式存储
        if (prev === -1) {
            this.cellIndex[this.yi] = c;
        } else {
            this.cell[prev].next = c;
        }

        return c;
    }
    // saveCell saves any accumulated r.area/r.cover for (r.xi, r.yi).
    saveCell() {
        const r = this
        if (r.area != 0 || r.cover != 0) {
            let i = r.findCell() //找到或创建一个cell,返回cell Index
            if (i != -1) {
                r.cell[i].area += r.area
                r.cell[i].cover += r.cover
            }
            r.area = 0
            r.cover = 0
        }
    }
    // setCell sets the (xi, yi) cell that r is accumulating area/coverage for.
    setCell(xi: int, yi: int) {
        const r = this
        // 更新cell
        if (r.xi != xi || r.yi != yi) {
            r.saveCell()
            r.xi=xi
            r.yi =yi
        }
    }
    scan(yi: int, x0: int26_6, y0f: int26_6, x1: int26_6, y1f: int26_6) {
        // 将 26.6 固定点数转换为整数和小数部分
        const x0i = Math.trunc(x0 / 64);
        const x0f = x0 - x0i * 64;
        const x1i = Math.trunc(x1 / 64);
        const x1f = x1 - x1i * 64;

        // 完全水平的扫描线
        if (y0f === y1f) {
            this.setCell(x1i, yi);
            return;
        }

        const dx = x1 - x0;
        const dy = y1f - y0f;

        // 单单元格扫描 
        // 如果是同一个单元格，则直接累加面积和覆盖率。
        if (x0i === x1i) {
            this.area += Math.trunc((x0f + x1f) * dy);
            this.cover += Math.trunc(dy);
            return;
        }

        // 至少有两个单元格
        let p, q, edge0, edge1, xiDelta;
        if (dx > 0) {
            p = (64 - x0f) * dy;
            q = dx;
            edge0 = 0;
            edge1 = 64;
            xiDelta = 1;
        } else {
            p = x0f * dy;
            q = -dx;
            edge0 = 64;
            edge1 = 0;
            xiDelta = -1;
        }

        let yDelta = Math.trunc(p / q);
        let yRem = p % q;
        if (yRem < 0) {
            yDelta -= 1;
            yRem += q;
        }

        // 处理第一个单元格
        let xi = x0i;
        let y = y0f;
        this.area += Math.trunc((x0f + edge1) * yDelta);
        this.cover += Math.trunc(yDelta);
        xi += xiDelta;
        y += yDelta;
        this.setCell(xi, yi);

        // 处理中间单元格
        if (xi !== x1i) {
            p = 64 * (y1f - y + yDelta);
            let fullDelta = Math.trunc(p / q);
            let fullRem = p % q;
            if (fullRem < 0) {
                fullDelta -= 1;
                fullRem += q;
            }
            yRem -= q;

            while (xi !== x1i) {
                yDelta = fullDelta;
                yRem += fullRem;
                if (yRem >= 0) {
                    yDelta += 1;
                    yRem -= q;
                }
                this.area += Math.trunc(64 * yDelta);
                this.cover += Math.trunc(yDelta);
                xi += xiDelta;
                y += yDelta;
                this.setCell(xi, yi);
            }
        }

        // 处理最后一个单元格
        yDelta = y1f - y;
        this.area += Math.trunc((edge0 + x1f) * yDelta);
        this.cover += Math.trunc(yDelta);
    }
    // Start starts a new curve at the given point.
    Start(a: Point26_6) {
        const r = this
        r.setCell(Math.trunc(a.x / 64), Math.trunc(a.y / 64))
        r.a = a
    }

    Add1(b: Point26_6) {
        const x0 = this.a.x;
        const y0 = this.a.y;
        const x1 = b.x;
        const y1 = b.y;
        const dx = x1 - x0;
        const dy = y1 - y0;

        // 将 26.6 固定点数转换为整数和小数部分
        const y0i = Math.trunc(y0 / 64);// 计算y0的整数部分
        const y0f = y0 - y0i * 64;// 计算y0的浮点数
        const y1i = Math.trunc(y1 / 64);
        const y1f = y1 - y1i * 64;

        // 如果y相同，则只有一条扫描线需要处理。
        if (y0i === y1i) {
            // 只有一条扫描线
            this.scan(y0i, x0, y0f, x1, y1f);
        } else if (dx === 0) {
            // 垂直线段
            let edge0, edge1, yiDelta;
            if (dy > 0) {
                edge0 = 0;
                edge1 = 64;
                yiDelta = 1;
            } else {
                edge0 = 64;
                edge1 = 0;
                yiDelta = -1;
            }

            const x0i = Math.trunc(x0 / 64);
            let yi = y0i;
            const x0fTimes2 = (x0 - x0i * 64) * 2;

            // 处理第一个像素
            let dcover = edge1 - y0f;
            let darea = x0fTimes2 * dcover;
            this.area += darea;
            this.cover += dcover;
            yi += yiDelta;
            this.setCell(x0i, yi);

            // 处理中间像素
            dcover = edge1 - edge0;
            darea = x0fTimes2 * dcover;
            while (yi !== y1i) {
                this.area += darea;
                this.cover += dcover;
                yi += yiDelta;
                this.setCell(x0i, yi);
            }

            // 处理最后一个像素
            dcover = y1f - edge0;
            darea = x0fTimes2 * dcover;
            this.area += darea;
            this.cover += dcover;
        } else {
            // 至少两条扫描线
            let p, q, edge0, edge1, yiDelta;
            if (dy > 0) {
                p = (64 - y0f) * dx;
                q = dy;
                edge0 = 0;
                edge1 = 64;
                yiDelta = 1;
            } else {
                p = y0f * dx;
                q = -dy;
                edge0 = 64;
                edge1 = 0;
                yiDelta = -1;
            }

            let xDelta = Math.trunc(p / q);
            let xRem = p % q;
            if (xRem < 0) {
                xDelta -= 1;
                xRem += q;
            }

            // 处理第一条扫描线
            let x = x0;
            let yi = y0i;
            this.scan(yi, x, y0f, x + xDelta, edge1);
            x += xDelta;
            yi += yiDelta;
            this.setCell(Math.trunc(x / 64), yi);

            // 处理中间扫描线
            if (yi !== y1i) {
                p = 64 * dx;
                let fullDelta = Math.trunc(p / q);
                let fullRem = p % q;
                if (fullRem < 0) {
                    fullDelta -= 1;
                    fullRem += q;
                }
                xRem -= q;

                while (yi !== y1i) {
                    xDelta = fullDelta;
                    xRem += fullRem;
                    if (xRem >= 0) {
                        xDelta += 1;
                        xRem -= q;
                    }
                    this.scan(yi, x, edge0, x + xDelta, edge1);
                    x += xDelta;
                    yi += yiDelta;
                    this.setCell(Math.trunc(x / 64), yi);
                }
            }

            // 处理最后一条扫描线
            this.scan(yi, x, edge0, x1, y1f);
        }

        // 更新当前点
        this.a = b;
    }
    Add2(b: Point26_6, c: Point26_6) {
        // 计算 dev 值
        let dev =maxAbs(this.a.x - 2 * b.x + c.x, this.a.y - 2 * b.y + c.y) /this.splitScale2;
        dev=Math.trunc(dev)
        let nsplit = 0;
        while (dev > 0) {
            dev/=4;
            dev=Math.trunc(dev)
            nsplit++;
        }

        // 最大分割次数为 16
        const maxNsplit = 16;
        if (nsplit > maxNsplit) {
            throw new Error(`freetype/raster: Add2 nsplit too large: ${nsplit}`);
        }

        // 递归分解曲线
        let pStack = new Array(2 * maxNsplit + 3).fill(null).map(() => Point26_6.default());
        let sStack = new Array(maxNsplit + 1).fill(0);
        let i = 0;

        sStack[0] = nsplit;
        pStack[0] = c.clone();
        pStack[1] = b.clone();
        pStack[2] = this.a.clone();

        while (i >= 0) {
            let s = sStack[i];
            let p = pStack.slice(2 * i);

            if (s > 0) {
                // 分割二次曲线
                let mx = p[1].x;
                p[4] = Point26_6.from(p[2].x, p[2].y);
                p[3] = Point26_6.from((p[4].x + mx) / 2, (p[4].y + p[1].y) / 2);
                p[1] = Point26_6.from((p[0].x + mx) / 2, (p[0].y + p[1].y) / 2);
                p[2] = Point26_6.from((p[1].x + p[3].x) / 2, (p[1].y + p[3].y) / 2);

                // 减少分割次数
                sStack[i] = s - 1;
                sStack[i + 1] = s - 1;
                i++;
            } else {
                // 用两段线性曲线近似二次曲线
                let midx = (p[0].x + 2 * p[1].x + p[2].x) / 4;
                let midy = (p[0].y + 2 * p[1].y + p[2].y) / 4;
                this.Add1(Point26_6.from(midx, midy));
                this.Add1(p[0]);
                i--;
            }
        }
    }
    Add3(b: Point26_6, c: Point26_6, d: Point26_6) {
        // 计算 dev2 和 dev3 值
        let dev2 = maxAbs(this.a.x - 3 * (b.x + c.x) + d.x, this.a.y - 3 * (b.y + c.y) + d.y) / this.splitScale2;
        let dev3 = maxAbs(this.a.y - 2 * b.x + d.x, this.a.y - 2 * b.y + d.y) / this.splitScale3;
        dev2=Math.trunc(dev2)
        dev3=Math.trunc(dev3)
        let nsplit = 0;

        while (dev2 > 0 || dev3 > 0) {
            dev2 /= 8;
            dev3 /= 4;
            dev2=Math.trunc(dev2)
            dev3=Math.trunc(dev3)
            nsplit++;
        }

        // 最大分割次数为 16
        const maxNsplit = 16;
        if (nsplit > maxNsplit) {
            throw new Error(`freetype/raster: Add3 nsplit too large: ${nsplit}`);
        }

        // 递归分解曲线
        let pStack = new Array(3 * maxNsplit + 4).fill(null).map(() => Point26_6.from(0, 0));
        let sStack = new Array(maxNsplit + 1).fill(0);
        let i = 0;

        sStack[0] = nsplit;
        pStack[0] = d;
        pStack[1] = c;
        pStack[2] = b;
        pStack[3] = this.a;

        while (i >= 0) {
            let s = sStack[i];
            let p = pStack.slice(3 * i);

            if (s > 0) {
                // 分割三次曲线
                let m01x = (p[0].x + p[1].x) / 2;
                let m12x = (p[1].x + p[2].x) / 2;
                let m23x = (p[2].x + p[3].x) / 2;
                p[6].set(p[3].x, p[3].y);
                p[5].set(m23x, (p[2].y + p[3].y) / 2);
                p[1].set(m01x, (p[0].y + p[1].y) / 2);
                p[2].set((m01x + m12x) / 2, (p[1].y + p[2].y) / 2);
                p[4].set((m12x + m23x) / 2, (p[2].y + p[3].y) / 2);
                p[3].set((p[2].x + p[4].x) / 2, (p[2].y + p[4].y) / 2);

                // 减少分割次数
                sStack[i] = s - 1;
                sStack[i + 1] = s - 1;
                i++;
            } else {
                // 用两段线性曲线近似三次曲线
                let midx = (p[0].x + 3 * (p[1].x + p[2].x) + p[3].x) / 8;
                let midy = (p[0].y + 3 * (p[1].y + p[2].y) + p[3].y) / 8;
                this.Add1(Point26_6.from(midx, midy));
                this.Add1(p[0]);
                i--;
            }
        }
    }
    AddPath(p:Path) {
        for (let i = 0; i < p.length;) {
            switch (p.points[i]) {
                case 0:
                    this.Start(Point26_6.from(p.points[i + 1], p.points[i + 2]));
                    i += 4;
                    break;
                case 1:
                    this.Add1(Point26_6.from(p.points[i + 1], p.points[i + 2]));
                    i += 4;
                    break;
                case 2:
                    this.Add2(Point26_6.from(p.points[i + 1], p.points[i + 2]), Point26_6.from(p.points[i + 3], p.points[i + 4]));
                    i += 6;
                    break;
                case 3:
                    this.Add3(Point26_6.from(p.points[i + 1], p.points[i + 2]), Point26_6.from(p.points[i + 3], p.points[i + 4]), Point26_6.from(p.points[i + 5], p.points[i + 6]));
                    i += 8;
                    break;
                default:
                    throw new Error("freetype/raster: bad path");
            }
        }
    }
    AddStroke(q: Path, width: int26_6, cr: Capper, jr: Joiner) {
        Stroke(this, q, width, cr, jr)
    }
    
//Areatoalpha将面积值转换为UINT32 alpha值。一个
//填充的像素对应于64*64*2的面积，而α为0xffff。这
//面积值的转换大于这取决于绕组规则：
//veen-odd或非零。
    areaToAlpha(area: number) {
        // 将 area 值转换为 alpha 值
        let a = (area + 1) >> 1; // 四舍五入到最近的整数
        if (a < 0) {
            a = -a; // 取绝对值
        }
        let alpha = a >>> 0; // 转换为无符号 32 位整数

        if (this.UseNonZeroWinding) {
            // 非零填充规则
            if (alpha > 0x0fff) {
                alpha = 0x0fff; // 限制最大值为 0x0fff
            }
        } else {
            // 偶数填充规则
            alpha &= 0x1fff; // 取低 13 位
            if (alpha > 0x1000) {
                alpha = 0x2000 - alpha; // 对称处理
            } else if (alpha === 0x1000) {
                alpha = 0x0fff; // 特殊处理
            }
        }

        // 将 12 位 alpha 转换为 16 位 alpha
        return (alpha << 4) | (alpha >> 8);
    }
    //将Rasterize转换为p的跨度。跨度通过了
    //to p是非重叠的，由y和x分类。它们都不为零
    //宽度（和0 <= x0 <x1 <= r.width）和非零a，除了最终
    //跨度，具有y，x0，x1，a等于零。
    Rasterize(p:Painter) {
        this.saveCell();
        let s = 0;
        for (let yi = 0; yi < this.cellIndex.length; yi++) {
            let xi = 0, cover = 0;
            // 生成span跨度
            for (let c = this.cellIndex[yi]; c !== -1; c = this.cell[c].next) {
                if (cover !== 0 && this.cell[c].xi > xi) {
                    let alpha = this.areaToAlpha(cover * 64 * 2);
                    if (alpha !== 0) {
                        let xi0 = xi, xi1 = this.cell[c].xi;
                        if (xi0 < 0) xi0 = 0;
                        if (xi1 >= this.width) xi1 = this.width;
                        if (xi0 < xi1) {
                            this.spanBuf[s] = { Y: yi + this.Dy, X0: xi0 + this.Dx, X1: xi1 + this.Dx, Alpha: alpha };
                            s++;
                        }
                    }
                }
                cover += this.cell[c].cover;
                let alpha = this.areaToAlpha(cover * 64 * 2 - this.cell[c].area);
                xi = this.cell[c].xi + 1;
                if (alpha !== 0) {
                    let xi0 = this.cell[c].xi, xi1 = xi;
                    if (xi0 < 0) xi0 = 0;
                    if (xi1 >= this.width) xi1 = this.width;
                    if (xi0 < xi1) {
                        this.spanBuf[s] = { Y: yi + this.Dy, X0: xi0 + this.Dx, X1: xi1 + this.Dx, Alpha: alpha };
                        s++;
                    }
                }
                if (s > this.spanBuf.length - 2) {
                    p.Paint(this.spanBuf.slice(0, s), false);
                    s = 0;
                }
            }
        }
        p.Paint(this.spanBuf.slice(0, s), true);
    }
    Clear() {
        this.a = Point26_6.default()
        this.xi = 0;
        this.yi = 0;
        this.area = 0;
        this.cover = 0;
        this.cell = [];
        for (let i = 0; i < this.cellIndex.length; i++) {
            this.cellIndex[i] = -1;
        }
    }
    SetBounds(width:int, height:int) {
        if (width < 0) width = 0;
        if (height < 0) height = 0;
        let ss2 = 32, ss3 = 16;
        if (width > 24 || height > 24) {
            ss2 *= 2;
            ss3 *= 2;
            if (width > 120 || height > 120) {
                ss2 *= 2;
                ss3 *= 2;
            }
        }
        this.width = width;
        this.splitScale2 = ss2;
        this.splitScale3 = ss3;
        this.cell = this.cellBuf.slice();
        if (height > this.cellIndexBuf.length) {
            this.cellIndex = new Array(height).fill(-1);
        } else {
            this.cellIndex = this.cellIndexBuf.slice(0, height);
        }
        this.Clear();
    }
}





// NewRasterizer creates a new Rasterizer with the given bounds.
export function NewRasterizer(width:int, height:int) {
    let r= new Rasterizer()
    r.SetBounds(width, height)
    return r
}