
import { PathBuilder } from '../../2d_raster/soft2d'
import { Vector2 } from '../../math/vec2'
import { clamp, divmod } from '../../math/math'

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
        return Math.floor(value * this.ONE)
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
        return (a / b) << this.SHIFT
    }
    static mul_round(a: int24_8, b: int24_8) {
        return this.round(a * b) >> this.SHIFT
    }
    static div_round(a: int24_8, b: int24_8) {
        return this.round(a / b) << this.SHIFT
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
        let x = Int24_8.fromFloat(Int26_6.toFloat(to.x))
        let y = Int24_8.fromFloat(Int26_6.toFloat(to.y))
        this.startCell(Int24_8.toFloor(x), Int24_8.toFloor(y))
        this.x = x
        this.y = y
        return 0
    }
    lineTo(to: Vector2) {
        let x = Int24_8.fromFloat(Int26_6.toFloat(to.x))
        let y = Int24_8.fromFloat(Int26_6.toFloat(to.y))
        this.renderLine(x, y)
    }
    renderLine(to_x: int24_8, to_y: int24_8) {
        let ey1 = 0, ey2 = 0, fy1 = 0, fy2 = 0, first = 0, delta = 0, mod = 0

        let p = 0, dx = 0, dy = 0, x = 0, x2 = 0
        let incr = 0

        ey1 = Int24_8.toFloor(this.y)
        ey2 = Int24_8.toFloor(to_y)

        fy1 = Int24_8.fract(this.y)
        fy2 = Int24_8.fract(to_y)
        // 水平线段
        if (ey1 == ey2) {
            this.renderScanLine(ey1, this.x, fy1, to_x, fy2)
            this.x = to_x
            this.y = to_y
            return
        }
        dx = to_x - this.x
        dy = to_y - this.y
        // 垂直线段
        if (dx == 0) {
            let ex = Int24_8.toFloor(this.x)

            // 计算起始坐标的小数-255-255,乘以2,变成-510-510
            let two_fx = Int24_8.fract(this.x) << 1
            let area = 0, max_ey1 = 0
            // 判断y方向
            if (dy > 0) {
                first = Int24_8.ONE
            } else {
                first = 0
            }
            // 起始像素覆盖率计算
            // -255~255
            delta = first - fy1 // 计算起始像素的覆盖率
            this.area += two_fx * delta // 如果x有偏移
            this.cover += delta

            delta = dy > 0 ? Int24_8.ONE : -Int24_8.ONE //first+first-Int24_8.ONE

            area = two_fx * delta
            max_ey1 = this.count_ey + this.minY

            if (dy < 0) {
                if (ey1 > max_ey1) {
                    ey1 = (max_ey1 > ey2) ? max_ey1 : ey2;
                    this.setCell(ex, ey1);
                }
                else {
                    ey1--;
                    this.setCell(ex, ey1);
                }
                while (ey1 > ey2 && ey1 >= this.minY) {
                    this.area += area;
                    this.cover += delta;
                    ey1--;

                    this.setCell(ex, ey1);
                }
                if (ey1 != ey2) {
                    ey1 = ey2;
                    this.setCell(ex, ey1);
                }
            } else {
                if (ey1 < this.minY) {
                    ey1 = (this.minY < ey2) ? this.minY : ey2;
                    this.setCell(ex, ey1);
                }
                else {
                    ey1++;
                    this.setCell(ex, ey1);
                }
                while (ey1 < ey2 && ey1 < max_ey1) {
                    this.area += area;
                    this.cover += delta;
                    ey1++;

                    this.setCell(ex, ey1);
                }
                if (ey1 != ey2) {
                    ey1 = ey2;
                    this.setCell(ex, ey1);
                }
            }


            // 结束像素的面积计算

            delta = dy > 0 ? fy2 : fy2 - Int24_8.ONE  //fy2-Int24_8.ONE+first
            this.area += two_fx * delta
            this.cover += delta
            this.x = to_x
            this.y = to_y
            return
        }

        // 斜线
        if (dy > 0) {
            p = (Int24_8.ONE - fy1) * dx // 单行像素的总面积
            first = Int24_8.ONE
            incr = 1
        } else {
            p = fy1 * dx // 单行像素的总面积
            first = 0
            incr = -1
            dy = -dy
        }
        // delta=p/dy 计算x与y的比例，向下求整
        // mod=0-255
        // 
        [delta, mod] = divmod(p, dy) // 当前像素y*(dx/dy)
        x = this.x + delta
        this.renderScanLine(ey1, this.x, fy1, x, first)
        ey1 += incr
        this.setCell(Int24_8.toFloor(x),ey1)
        if (ey1 != ey2) {
            p = Int24_8.ONE * dx // 单行像素的总面积
            let [lift, rem] = divmod(p, dy)
            do {
                delta = lift
                mod += rem
                if (mod >= dy) {
                    mod -= dy
                    delta++
                }
                x2 = x + delta;
                this.renderScanLine(ey1, x, Int24_8.ONE - first, x2, first);
                x = x2;
                ey1 += incr;
                this.setCell(Int24_8.toFloor(x), ey1);

            } while (ey1 != ey2)
        }
        this.renderScanLine(ey1, x, Int24_8.ONE - first, to_x, fy2)
        this.x = to_x
        this.y = to_y
    }
    renderScanLine(ey: number, x1: int24_8, y1: number, x2: int24_8, y2: number) {

        let ex1 = 0, ex2 = 0, fx1 = 0, fx2 = 0, first, dy, delta = 0, mod = 0;
        let p = 0, dx = 0;
        let incr = 0;

        ex1 = Int24_8.toFloor(x1)
        ex2 = Int24_8.toFloor(x2)

        if (y1 == y2) {
            this.setCell(ex2, ey)
            return
        }
        fx1 = Int24_8.fract(x1)
        fx2 = Int24_8.fract(x2)
        // 如果同一个x坐标
        if (ex1 == ex2) {
            dy = y2 - y1
            this.area += (fx1 + fx2) * dy
            this.cover += dy
            return
        }
        dx = x2 - x1
        dy = y2 - y1 // 0-256

        if (dx > 0) {
            p = (Int24_8.ONE - fx1) * dy //单个像素的总面积
            first = Int24_8.ONE
            incr = 1
        } else {
            p = fx1 * dy //单个像素的总面积
            first = 0
            incr = -1
            dx = -dx
        }
        [delta, mod] = divmod(p, dx) // 
        this.area += (fx1 + first) * delta
        this.cover += delta
        y1 += delta
        ex1 += incr
        this.setCell(ex1, ey)
        if (ex1 !== ex2) {
            p = Int24_8.ONE * dy;
            let [lift, rem] = divMod(p, dx);
            do {
                delta = lift;
                mod += rem;
                if (mod >= dx) {
                    mod -= dx;
                    delta++;
                }
                this.area += (Int24_8.ONE * delta);
                this.cover += delta;
                y1 += delta;
                ex1 += incr;
                this.setCell(ex1, ey);
            } while (ex1 != ex2);

        }
        fx1 = Int24_8.ONE - first
        dy = y2 - y1
        this.area += (fx1 + fx2) * dy
        this.cover += dy
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
    setCell(ex: number, ey: number) {
    
        ey -= this.minY
        if(ex>this.maxX){
            ex=this.maxX
        }
        ex-=this.minX
        if (ex < 0) {
            ex = -1;
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
            cell.area += this.area;
            cell.cover += this.cover;
        }

    }
    findCell() {
        let x = this.ex
        if(x>this.count_ex){
            x=this.count_ex
        }
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
            next: cell||null
        }
        if (prev) {
            newCell.next = prev.next
            prev.next = newCell
        } else {
            this.yCells[this.ey] = newCell
        }
        return newCell

    }
    hline(x: number, y: number, area: number, acount: number) {
        let coverage = Number(BigInt(area) >> (BigInt(Int24_8.SHIFT) * 2n + 1n - 8n))
        if (coverage < 0) {
            coverage = -coverage
        }
        if (this.fillRule === 'evenodd') {
            coverage &= 511
            if (coverage > 256) {
                coverage = 512 - coverage
            } else if (coverage == 256) {
                coverage = 255
            }
        } else {
            if (coverage >= 256) {
                coverage = 255;
            }
        }
        // 加上偏移量
        y += this.minY;
        x += this.minX;
        if (x >= (1 << 23)) {
            x = (1 << 23) - 1;
        }
        if (y >= (1 << 23)) {
            y = (1 << 23) - 1;
        }
        if (coverage) {

            let spans = this.spans
            let last=spans[spans.length-1]

            if(last&&last.x===x&&last.y===y&& last.x + last.len == x &&last.coverage==coverage) {
                last.len=last.len+acount
                return
            }
            let span:Span ={
                x:x,
                len:acount,
                y:y,
                coverage: coverage
            }
            this.spans.push(span)
        }
    }
    sweep() {
        for (let yIndex = 0; yIndex < this.yCells.length; yIndex++) {
            let cell = this.yCells[yIndex] as (Cell | null)
            if (!cell) continue

            let cover = 0, x = 0

            for (; cell; cell = cell.next) {
                let area = 0
                if (cell.x > x && cover !== 0) {
                    this.hline(x, yIndex, cover * (Int24_8.ONE * 2), cell.x - x)
                }
                cover += cell.cover
                area = cover * (Int24_8.ONE * 2) - cell.area
                if (area != 0 && cell.x >= 0) {
                    this.hline(cell.x, yIndex, area, 1)
                }
                x = cell.x + 1;
            }
            if (this.count_ex > x && cover != 0) {
                this.hline(x, yIndex, cover * (Int24_8.ONE * 2), this.count_ex - x)

            }

        }

    }
    fillPath(path: PathBuilder) {

        path.points.forEach(d => {
            d.set(Int26_6.fromFloat(d.x), Int26_6.fromFloat(d.y))
        })
        const bounds = path.getBounds()

        this.minX = Int26_6.toFloor(bounds.min.x)
        this.minY = Int26_6.toFloor(bounds.min.y)
        this.maxX = Int26_6.toCeil(bounds.max.x)
        this.maxY = Int26_6.toCeil(bounds.max.y)

        this.count_ex = this.maxX - this.minX
        this.count_ey = this.maxY - this.minY


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
        if (!this.invalid) {
            this.recordCell()
        }
        this.sweep()


        let spans = this.spans;
        for (let i = 0; i < spans.length; i++) {
            let span = spans[i]
            for(let x=span.x,j=0;j<span.len;j++,x++){
                this.setPixel(span.x+j, span.y, span.coverage)
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