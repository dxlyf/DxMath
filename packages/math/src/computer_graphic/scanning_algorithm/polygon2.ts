
import { clamp } from '../../math/math';
import { Vector2 } from '../../math/vec2';

function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}


type FillRule = "evenodd" | "nonzero"
class PolygonEdge {
    static from(start: Vector2, end: Vector2) {
        return new this(start, end)
    }
    x: number = 0
    yMin: number = 0 //yMin
    yMax: number = 0 //yMax
    invSlope: number = 1 //斜率
    direction: number = 1 // +1 或 -1 表示边方向
    start: Vector2 = Vector2.zero() // 当前边在扫描线上的x坐标
    end: Vector2 = Vector2.zero() // 当前边在扫描线上的x坐标


    constructor(start: Vector2, end: Vector2) {
        const dx = end.x - start.x
        const dy = end.y - start.y
        this.yMin = Math.min(start.y, end.y)
        this.yMax = Math.max(start.y, end.y)
        this.invSlope = dx / dy
        this.x = start.y < end.y ? start.x : end.x
        this.direction = start.y < end.y ? 1 : -1;
        this.start.copy(start)
        this.end.copy(end)
    }

    // 动态计算当前扫描线对应x坐标
    currentX(y: number): number {
        return this.start.x + (y - this.start.y) * this.invSlope;
    }
    // 计算边在指定y值的精确x坐标（保留8位小数）
    preciseX(y: number): number {
        return this.start.x + (y - this.start.y) * this.invSlope;
    }
}

// 插入边表并排序
const insertActiveEdge = (edges: PolygonEdge[], edge: PolygonEdge) => {

    for (let i = 0; i < edges.length; i++) {
        if (edge.x < edges[i].x) {
            edges.splice(i, 0, edge)
            return
        }
    }
    edges.push(edge)
}
const insertActiveEdge2 = (edges: PolygonEdge[], edge: PolygonEdge) => {
    let i = edges.length
    while (i > 0 && edge.x < edges[i - 1].x) {
        i--;
    }
    edges.splice(i, 0, edge)
}
// **计算像素覆盖率**
const geometricCoverage = (x: number, x1: number, x2: number): number => {
    return Math.max(0, Math.min(1, (Math.min(x + 0.5, x2) - Math.max(x - 0.5, x1))));
};

// **边缘增强处理**
const edgeEnhancement = (
    x: number,
    y: number,
    left: { x: number; normal: [number, number] },
    right: { x: number; normal: [number, number] }
): number => {
    const centerX = x + 0.5;
    const distLeft = Math.abs((centerX - left.x) * left.normal[0]);
    const distRight = Math.abs((centerX - right.x) * right.normal[0]);
    return Math.min(1, Math.max(0, (Math.min(distLeft, distRight) * 2)));
};

// 点是否在多边形内
const pointInPolygon = (point: Vector2, polygon: Vector2[], fillRule: FillRule = 'nonzero'): boolean => {
    let winding = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];

        if (p1.y > point.y !== p2.y > point.y) {
            let isLeft = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x)
            if (p2.y > point.y && isLeft > 0) {
                winding++
            }
            if (p2.y <= point.y && isLeft < 0) {
                winding--
            }
        }
    }
    if (fillRule === 'nonzero') {
        return winding !== 0

    }
    return winding % 2 !== 0

}


export const fillPolygon2 = (polygons: Vector2[], setPixel: (x: number, y: number, coverage?: number) => void, fillRule: FillRule = 'nonzero'): void => {
    // 整数处理
    polygons.forEach(p => {
        p.floor()
    })

    // 扫描线范围
    let yMin = Infinity, yMax = -Infinity
    const edges = new Map<number, PolygonEdge[]>()
    for (let i = 0; i < polygons.length; i++) {
        const start = polygons[i]
        const end = polygons[(i + 1) % polygons.length]
        if (start.y === end.y) {
            continue
        }
        const edge = new PolygonEdge(start, end)

        if (edges.has(edge.yMin)) {
            edges.get(edge.yMin)!.push(edge)
        } else {
            edges.set(edge.yMin, [edge])
        }
        yMin = Math.min(yMin, edge.yMin)
        yMax = Math.max(yMax, edge.yMax)
    }

    // 创建活动边表
    let activeEdges: PolygonEdge[] = []


    for (let y = yMin; y <= yMax; y++) {
        if (edges.get(y)) {
            edges.get(y)!.forEach((edge) => {
                insertActiveEdge2(activeEdges, edge)
            })
            edges.delete(y)
        }
        // 填充扫描线
        let winding = 0
        let startX = 0
        for (let i = 0; i < activeEdges.length; i++) {
            const edge = activeEdges[i]
            const prevWinding = winding;
            winding += edge.direction;

            if (fillRule === 'evenodd') {
                // 偶数规则填充
                if (prevWinding % 2 === 0) {
                    startX = Math.floor(edge.x);
                } else {
                    const endX = Math.ceil(edge.x);
                    for (let x = startX; x <= endX; x++) {
                        setPixel(x, y);
                    }
                }
            } else if (fillRule === 'nonzero') {
                // 非零规则填充
                if (prevWinding === 0 && winding !== 0) {
                    startX = Math.floor(edge.x);
                } else if (prevWinding !== 0 && winding === 0) {
                    const endX = Math.ceil(edge.x);
                    for (let x = startX; x <= endX; x++) {
                        setPixel(x, y);
                    }
                }
            }
        }

        activeEdges = activeEdges.filter(edge => y < edge.yMax)

        activeEdges.forEach(edge => {
            edge.x += edge.invSlope
        })

    }
}



export const fillPolygon = (polygons: Vector2[], setPixel: (x: number, y: number, coverage?: number) => void, fillRule: FillRule = 'nonzero'): void => {

    // 扫描线范围
    let yMin = Infinity, yMax = -Infinity
    // 整数处理
    polygons.forEach(p => {
        //  p.floor()
        //  yMin = Math.min(yMin, p.y)
        //  yMax = Math.max(yMax, p.y)

        yMin = Math.min(yMin, Math.floor(p.y)); // 计算最小整数扫描线
        yMax = Math.max(yMax, Math.ceil(p.y));  // 计算最大整数扫描线
    })
    let intersections: { x: number, winding: number }[] = []
    for (let y = yMin; y <= yMax; y++) {

        for (let i = 0; i < polygons.length; i++) {
            const p1 = polygons[i]
            const p2 = polygons[(i + 1) % polygons.length]
            if (p1.y === p2.y) {
                continue
            }
            if (p1.y > y !== p2.y > y) {
                let t = (y - p1.y) / (p2.y - p1.y)
                let x_intersect = lerp(p1.x, p2.x, t)
                let winding = p1.y < p2.y ? 1 : -1; // 计算方向
                intersections.push({ x: x_intersect, winding });

            }
        }

        intersections.sort((a, b) => a.x - b.x)
        let windingNumber = 0;
        for (let i = 0; i < intersections.length - 1; i++) {
            if (fillRule === "nonzero") {
                windingNumber += intersections[i].winding;
            } else if (fillRule === "evenodd") {
                windingNumber = (windingNumber + 1) % 2; // 0->1->0->1 模拟奇偶规则
            }

            if (windingNumber !== 0) {
                const x1 = intersections[i].x;
                const x2 = intersections[i + 1].x;
                const startX = Math.floor(x1);
                const endX = Math.ceil(x2);

                for (let x = startX; x < endX; x++) {
                    const pixelLeft = x;          // 像素左边界
                    const pixelRight = x + 1;     // 像素右边界
                    // 计算覆盖范围
                    const coverageStart = Math.max(x1, pixelLeft);
                    const coverageEnd = Math.min(x2, pixelRight);
                    const coverage = clamp(coverageEnd - coverageStart,0,1)

                    if (coverage > 0) {
                        setPixel(x, y, coverage); // 传递覆盖率参数
                    }
                }
            }
        }
        intersections.length = 0


    }
}

export const fillPolygonDeepSeek = (
    polygons: Vector2[],
    setPixel: (x: number, y: number, coverage?: number) => void,
    fillRule: FillRule = 'nonzero'
): void => {
    let yMin = Infinity, yMax = -Infinity;
    polygons.forEach(p => {
        p.floor();
        yMin = Math.min(yMin, p.y);
        yMax = Math.max(yMax, p.y);
    });

    const intersections: { x: number, winding: number }[] = [];
    for (let y = yMin; y <= yMax; y++) {
        intersections.length = 0;

        // 收集所有交点
        for (let i = 0; i < polygons.length; i++) {
            const p1 = polygons[i];
            const p2 = polygons[(i + 1) % polygons.length];
            if (p1.y === p2.y) continue;

            // 检查边是否跨越当前扫描线
            if ((p1.y < y && p2.y >= y) || (p2.y < y && p1.y >= y)) {
                const t = (y - p1.y) / (p2.y - p1.y);
                const x = p1.x + t * (p2.x - p1.x);
                const winding = p1.y < p2.y ? 1 : -1;
                intersections.push({ x, winding });
            }
        }

        // 按x坐标排序交点
        intersections.sort((a, b) => a.x - b.x);

        const coverageMap: { [key: number]: number } = {};
        let windingNumber = 0;

        // 处理每对相邻交点
        for (let i = 0; i < intersections.length; i++) {
            if (fillRule === 'nonzero') {
                windingNumber += intersections[i].winding;
            } else {
                windingNumber = (windingNumber + 1) % 2;
            }

            // 只在奇数（evenodd）或非零（nonzero）时处理区间
            if ((fillRule === 'evenodd' && windingNumber % 2 === 1) ||
                (fillRule === 'nonzero' && windingNumber !== 0)) {
                if (i === intersections.length - 1) break;

                const xStart = intersections[i].x;
                const xEnd = intersections[i + 1].x;

                // 分解覆盖区间到像素
                let currentPixel = Math.floor(xStart);
                const lastPixel = Math.ceil(xEnd);
                while (currentPixel < lastPixel) {
                    const pixelStart = currentPixel;
                    const pixelEnd = currentPixel + 1;
                    const coverStart = Math.max(xStart, pixelStart);
                    const coverEnd = Math.min(xEnd, pixelEnd);
                    const coverage = coverEnd - coverStart;

                    if (coverage > 0) {
                        coverageMap[currentPixel] = (coverageMap[currentPixel] || 0) + coverage;
                    }
                    currentPixel++;
                }
            }
        }

        // 设置像素并限制覆盖率范围
        Object.keys(coverageMap).forEach(xStr => {
            const x = parseInt(xStr);
            let coverage = coverageMap[x];
            setPixel(x, y, Math.min(coverage, 1));
        });
    }
};

/**
 * @typedef {Object} Vector2
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {'nonzero' | 'evenodd'} FillRule
 */

/**
 * 填充多边形，优化抗锯齿效果
 * @param {Vector2[]} polygons - 多边形顶点数组
 * @param {(x: number, y: number, coverage?: number) => void} setPixel - 设置像素的回调函数
 * @param {FillRule} [fillRule='nonzero'] - 填充规则
 */
export const fillPolygonGrok = (polygons: Vector2[], setPixel: (x: number, y: number, coverage?: number) => void, fillRule: FillRule = 'nonzero') => {
    // 扫描线范围
    let yMin = Infinity, yMax = -Infinity;
    polygons.forEach(p => {
        yMin = Math.min(yMin, Math.floor(p.y));
        yMax = Math.max(yMax, Math.ceil(p.y));
    });

    const intersections = [];

    for (let y = yMin; y <= yMax; y++) {
        // 计算交点
        for (let i = 0; i < polygons.length; i++) {
            const p1 = polygons[i];
            const p2 = polygons[(i + 1) % polygons.length];
            if (p1.y === p2.y) continue;
            if (p1.y > y !== p2.y > y) {
                const x_intersect = (p2.x - p1.x) * (y - p1.y) / (p2.y - p1.y) + p1.x;
                const winding = p1.y < p2.y ? 1 : -1;
                intersections.push({ x: x_intersect, winding });
            }
        }

        intersections.sort((a, b) => a.x - b.x);

        let windingNumber = 0;
        for (let i = 0; i < intersections.length - 1; i++) {
            windingNumber = fillRule === "nonzero"
                ? windingNumber + intersections[i].winding
                : (windingNumber + 1) % 2;

            if (windingNumber !== 0) {
                const x1 = intersections[i].x;
                const x2 = intersections[i + 1].x;
                const startX = Math.floor(x1);
                const endX = Math.ceil(x2);

                for (let x = startX; x < endX; x++) {
                    // 超采样：2x2 子像素网格
                    let coverage = 0;
                    const subPixelCount = 4; // 2x2
                    for (let sy = 0; sy < 2; sy++) {
                        for (let sx = 0; sx < 2; sx++) {
                            const subX = x + sx * 0.5;
                            const subY = y + sy * 0.5;
                            let subWinding = 0;

                            // 检查子像素是否在多边形内
                            for (let j = 0; j < intersections.length; j++) {
                                if (intersections[j].x < subX) {
                                    subWinding += intersections[j].winding;
                                }
                            }
                            if (fillRule === "evenodd") subWinding %= 2;
                            if (subWinding !== 0) coverage += 1;
                        }
                    }
                    coverage /= subPixelCount;

                    // 精确覆盖率调整
                    const pixelLeft = x;
                    const pixelRight = x + 1;
                    const coverageStart = Math.max(x1, pixelLeft);
                    const coverageEnd = Math.min(x2, pixelRight);
                    const linearCoverage = Math.min(1, coverageEnd - coverageStart);
                    const finalCoverage = (coverage + linearCoverage) / 2; // 结合超采样和线性覆盖

                    if (finalCoverage > 0) {
                        setPixel(x, y, finalCoverage);
                    }
                }
            }
        }
        intersections.length = 0;
    }
};

export class CLAAFill {
    subpixel: number = 1;
    constructor(subpixelScale = 256) {
        this.subpixel = subpixelScale;
    }

    // 坐标对齐（简化版，如果需要的话）
    alignToGrid(points: Vector2[]) {
        return points.map(p => 
            Vector2.create(
                Math.round(p.x * this.subpixel) / this.subpixel,
                Math.round(p.y * this.subpixel) / this.subpixel
            )
        );
    }

    // 扫描线填充算法（核心逻辑）
    fill(
        polygon: Vector2[], 
        setPixel: (x: number, y: number, coverage: number) => void, 
        fillRule: FillRule = 'nonzero'
    ) {
        // 将多边形顶点转换为固定点坐标（单位：subpixel）
        const fixedPoly = polygon.map(p => 
            Vector2.create(
                Math.round(p.x * this.subpixel), 
                Math.round(p.y * this.subpixel)
            )
        );

        // 计算固定坐标的边界（单位：subpixel）
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        fixedPoly.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        });

        // 计算像素网格的尺寸（单位：像素）
        const gridX0 = Math.floor(minX / this.subpixel);
        const gridY0 = Math.floor(minY / this.subpixel);
        const gridX1 = Math.ceil(maxX / this.subpixel);
        const gridY1 = Math.ceil(maxY / this.subpixel);
        const gridWidth = gridX1 - gridX0;
        const gridHeight = gridY1 - gridY0;

        // 初始化网格单元，每个单元保存 cover 与 area 累计值
        const cells: { cover: number, area: number }[][] = new Array(gridHeight);
        for (let j = 0; j <= gridHeight; j++) {
            cells[j] = new Array(gridWidth);
            for (let i = 0; i <= gridWidth; i++) {
                cells[j][i] = { area: 0, cover: 0 };
            }
        }

        // 对每条边进行处理（多边形闭合）
        for (let i = 0; i < fixedPoly.length; i++) {
            const p0 = fixedPoly[i];
            const p1 = fixedPoly[(i + 1) % fixedPoly.length];
            // 将边分割成若干段，每段端点均落在网格边界上
            const segments = this.splitEdge(p0, p1);
            segments.forEach(seg => {
                this.accumulateSegment(cells, seg, gridX0, gridY0, this.subpixel);
            });
        }

        // 扫描每行单元格，累加 cover 与 area 后计算有效面积，并调用 setPixel 绘制
        for (let j = 0; j < gridHeight; j++) {
            let accCover = 0, accArea = 0;
            for (let i = 0; i < gridWidth; i++) {
                accCover += cells[j][i].cover;
                accArea += cells[j][i].area;
                // 根据公式计算有效面积：
                // effectiveArea = subpixel * accumulatedCover - (accumulatedArea)/2
                let effectiveArea = this.subpixel * accCover - accArea / 2;
                // 将 effectiveArea 归一化到 [0,256]（简单 clamp）
                let cov = Math.max(0, Math.min(256, Math.round(effectiveArea)));
                let globalAlpha = cov / 256;
                setPixel(i + gridX0, j + gridY0, globalAlpha);
            }
        }
    }

    /**
     * 将一条边 p0→p1 分割成若干段，使得每段端点均落在水平或垂直的网格线上。
     * p0 和 p1 为固定点坐标（单位：subpixel）。
     */
    splitEdge(p0: Vector2, p1: Vector2) {
        let segments: { x0: number, y0: number, x1: number, y1: number }[] = [];
        // 先沿 x 轴分割
        let tempSegs = this.splitByGrid(p0, p1, this.subpixel, 'x');
        // 对每个分割段再沿 y 轴分割
        tempSegs.forEach(seg => {
            const subSegs = this.splitByGrid(
                Vector2.create(seg.x0, seg.y0), 
                Vector2.create(seg.x1, seg.y1), 
                this.subpixel, 
                'y'
            );
            segments = segments.concat(subSegs);
        });
        return segments;
    }

    /**
     * 根据指定轴（'x' 或 'y'）的网格线分割边段 p0→p1，
     * 返回分割后的段数组，每段格式为 {x0, y0, x1, y1}。
     */
    splitByGrid(p0: Vector2, p1: Vector2, precision: number, axis: string) {
        let segs: { x0: number, y0: number, x1: number, y1: number }[] = [];
        let diff = axis === 'x' ? (p1.x - p0.x) : (p1.y - p0.y);
        if (diff === 0) return [{ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y }];
        const start = axis === 'x' ? p0.x : p0.y;
        const end = axis === 'x' ? p1.x : p1.y;
        const sign = diff > 0 ? 1 : -1;
        let gridStart = sign > 0 ?
            (Math.floor(start / precision) + 1) * precision :
            (Math.ceil(start / precision) - 1) * precision;
        let tValues: number[] = [];
        while ((sign > 0 && gridStart < end) || (sign < 0 && gridStart > end)) {
            const t = (gridStart - start) / diff;
            tValues.push(t);
            gridStart += sign * precision;
        }
        tValues.unshift(0);
        tValues.push(1);
        for (let i = 0; i < tValues.length - 1; i++) {
            let t0 = tValues[i], t1 = tValues[i + 1];
            segs.push({
                x0: p0.x + (p1.x - p0.x) * t0,
                y0: p0.y + (p1.y - p0.y) * t0,
                x1: p0.x + (p1.x - p0.x) * t1,
                y1: p0.y + (p1.y - p0.y) * t1
            });
        }
        return segs;
    }

    /**
     * 将一段边对经过的像素单元累加 area 与 cover 值。
     * seg 为 {x0, y0, x1, y1}（固定点坐标）。
     * gridX0, gridY0 用于将固定坐标转换为单元格坐标（像素坐标）。
     */
    accumulateSegment(
        cells: { cover: number, area: number }[][], 
        seg: { x0: number, y0: number, x1: number, y1: number }, 
        gridX0: number, 
        gridY0: number, 
        precision: number
    ) {
        // 计算该段中心所在的单元格索引
        let cx = Math.floor(((seg.x0 + seg.x1) / 2) / precision) - gridX0;
        let cy = Math.floor(((seg.y0 + seg.y1) / 2) / precision) - gridY0;
        // 该单元格左边界（固定点坐标）
        let cellLeft = (cx + gridX0) * precision;
        let dy = seg.y1 - seg.y0;
        // 计算边段两端相对于单元格左边界的水平偏移平均值
        // 这样得到的值反映了边段相对于网格左边界的平均位置
        let avg_dx = ((seg.x0 - cellLeft) + (seg.x1 - cellLeft)) / 2;
        // 根据算法，存储的是两倍面积，所以：
        // segAreaTwice = ((seg.x0 - cellLeft) + (seg.x1 - cellLeft)) * (seg.y1 - seg.y0)
        let segAreaTwice = ((seg.x0 - cellLeft) + (seg.x1 - cellLeft)) * dy;
        cells[cy][cx].cover += dy;
        cells[cy][cx].area += segAreaTwice;
    }
}
