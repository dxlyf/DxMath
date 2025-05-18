import { PathBuilder, Point } from "math/2d_raster/soft2d";
import { Bitmap } from "./Bitmap";
import { Paint } from "./Paint";
import { subdivideCubic, subdivideQuadratic } from './Bezier'
import { in26_6_mul, int26_6_from_float, int26_6_to_float } from './Fixed'
import { Stroker } from './Stroker'
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}
const clamp = (v: number, min: number, max: number) => {
    return Math.max(Math.min(v, max), min)
}

export enum FillRule {
    NonZero = 'nonzero',
    EvenOdd = 'evenodd'
}
type Edge = {
    x: number
    y0: number
    y1: number
    x0: number
    x1: number
    yMin: number
    yMax: number

    invSlope: number
    direction: number
}
export class Rasterizer {

    fillPath: PathBuilder = PathBuilder.default()
    strokePath: PathBuilder = PathBuilder.default()
    fillPolygon2(bitmap: Bitmap, path: PathBuilder, paint: Paint, fillRule: FillRule = FillRule.EvenOdd) {

        const edges = this.buildEdges(path)

        // 扫描线范围
        let yMin = Infinity, yMax = -Infinity
        // 整数处理
        edges.forEach(p => {

            yMin = Math.min(yMin, p.yMin); // 计算最小整数扫描线
            yMax = Math.max(yMax, p.yMax);  // 计算最大整数扫描线
        })
        let intersections: { x: number, winding: number }[] = []
        let yStart = Math.floor(yMin), yEnd = Math.ceil(yMax)

        for (let y = yStart; y <= yEnd; y++) {
            let yFixed = y
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i]
                if (yFixed >= edge.yMin && yFixed < edge.yMax) {
                    let t = (yFixed - edge.y0) / (edge.y1 - edge.y0)
                    let x_intersect = lerp(edge.x0, edge.x1, t)
                    //  let winding = p1.y < p2.y ? 1 : -1; // 计算方向
                    intersections.push({ x: x_intersect, winding: edge.direction });
                }
            }

            intersections.sort((a, b) => a.x - b.x)
            let windingNumber = 0;
            for (let i = 0; i < intersections.length - 1; i++) {
                if (fillRule === FillRule.NonZero) {
                    windingNumber += intersections[i].winding;
                } else if (fillRule === FillRule.EvenOdd) {
                    windingNumber = (windingNumber + 1) % 2; // 0->1->0->1 模拟奇偶规则
                }

                if (windingNumber !== 0) {
                    const x1 = intersections[i].x;
                    const x2 = intersections[i + 1].x;
                    const startX = Math.floor(x1);
                    const endX = Math.ceil(x2);

                    for (let x = startX; x <= endX; x++) {
                        const pixelLeft = x;          // 像素左边界
                        const pixelRight = x + 1;     // 像素右边界
                        // 计算覆盖范围
                        const coverageStart = Math.max(x1, pixelLeft);
                        const coverageEnd = Math.min(x2, pixelRight);
                        const coverage = clamp(coverageEnd - coverageStart, 0, 1)

                        if (coverage > 0) {
                            bitmap.setPixel(x, y, paint.color[0], paint.color[1], paint.color[2], paint.color[3]); // 传递覆盖率参数
                        }
                    }
                }
            }
            intersections.length = 0


        }
    }
    fillPolygon(bitmap: Bitmap, path: PathBuilder, paint: Paint, fillRule: FillRule = FillRule.EvenOdd) {
        let newPath = path.clone()
        let fixed_precision = 100000
        newPath.points.forEach(p => {
            p.multiplyScalar(fixed_precision).round()
        })
        const edges = this.buildEdges(newPath)

        // 扫描线范围
        let yMin = Infinity, yMax = -Infinity
        // 整数处理
        edges.forEach(p => {

            yMin = Math.min(yMin, p.yMin); // 计算最小整数扫描线
            yMax = Math.max(yMax, p.yMax);  // 计算最大整数扫描线
        })
        let intersections: { x: number, winding: number }[] = []
        let yStart = Math.floor(yMin / fixed_precision), yEnd = Math.ceil(yMax / fixed_precision)

        for (let y = yStart; y <= yEnd; y++) {
            let yFixed = y * fixed_precision
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i]
                if (yFixed >= edge.yMin && yFixed < edge.yMax) {
                    let t = (yFixed - edge.y0) / (edge.y1 - edge.y0)
                    let x_intersect = Math.round(lerp(edge.x0, edge.x1, t))
                    //  let winding = p1.y < p2.y ? 1 : -1; // 计算方向
                    intersections.push({ x: x_intersect, winding: edge.direction });
                }
            }

            intersections.sort((a, b) => a.x - b.x)
            let windingNumber = 0;
            for (let i = 0; i < intersections.length - 1; i++) {
                if (fillRule === FillRule.NonZero) {
                    windingNumber += intersections[i].winding;
                } else if (fillRule === FillRule.EvenOdd) {
                    windingNumber = (windingNumber + 1) % 2; // 0->1->0->1 模拟奇偶规则
                }

                if (windingNumber !== 0) {
                    const x1 = intersections[i].x / fixed_precision;
                    const x2 = intersections[i + 1].x / fixed_precision;
                    const startX = Math.floor(x1);
                    const endX = Math.ceil(x2);

                    for (let x = startX; x <= endX; x++) {
                        const pixelLeft = x;          // 像素左边界
                        const pixelRight = x + 1;     // 像素右边界
                        // 计算覆盖范围
                        const coverageStart = Math.max(x1, pixelLeft);
                        const coverageEnd = Math.min(x2, pixelRight);
                        const coverage = clamp(coverageEnd - coverageStart, 0, 1)

                        if (coverage > 0) {
                            bitmap.setPixel(x, y, paint.color[0], paint.color[1], paint.color[2], paint.color[3]); // 传递覆盖率参数
                        }
                    }
                }
            }
            intersections.length = 0


        }
    }

    fill(bitmap: Bitmap, path: PathBuilder, paint: Paint, fillRule: FillRule = FillRule.EvenOdd) {
        let newPath = path.clone()
  
        let fixed_precision = 10000
        newPath.points.forEach(p => {
            p.multiplyScalar(fixed_precision).round()
        })
        const edges = this.buildEdges(newPath)

        let activeEdges: Edge[] = []
        let yMin = Infinity
        let yMax = -Infinity
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].yMin < yMin) {
                yMin = edges[i].y0
            }
            if (edges[i].yMax > yMax) {
                yMax = edges[i].y1
            }
        }

        let yStart = Math.floor(yMin / fixed_precision)
        let yEnd = Math.ceil(yMax / fixed_precision)
        let insertActiveEdge = (edge: Edge) => {
            for (let i = 0; i < activeEdges.length; i++) {
                if (edge.x < activeEdges[i].x) {
                    activeEdges.splice(i, 0, edge)
                    return
                }
            }
            activeEdges.push(edge)
        }
        let bitter = (y: number, start: number, end: number) => {
            const x0 = Math.floor(start / fixed_precision)
            const x1 = Math.ceil(end / fixed_precision)
            for (let x = x0; x < x1; x++) {
                bitmap.setPixel(x, y, paint.color[0], paint.color[1], paint.color[2], paint.color[3])
            }
        }
        const edgeSet = new Map<number, Edge[]>()

        // for (let i = 0; i < edges.length; i++) {
        //     const edge = edges[i]
        //     const y =Math.round((edge.yMax)/fixed_precision)*fixed_precision
        //     if (!edgeSet.has(y)) {
        //         edgeSet.set(y, [edge])
        //     } else {
        //         edgeSet.get(y)!.push(edge)
        //     }
        // }
          
        for (let y = yStart; y <= yEnd; y++) {
            let fixedY = y * fixed_precision
           // activeEdges.length = 0
            // if (edgeSet.has(fixedY)) {
            //     //activeEdges.length=0
            //   //  activeEdges.push(...edgeSet.get(fixedY)!)
            //     const _edges=edgeSet.get(fixedY)!
            //     for (let i = 0; i < _edges.length; i++) {
            //      //   insertActiveEdge(_edges[i])
            //     }
            //     //edgeSet.delete(fixedY)
            // }
            activeEdges.length=0
            for (let i = 0; i < edges.length; i++) {

                if (edges[i].yMin <= fixedY && edges[i].yMax > fixedY) {
                    // activeEdges.push(edges[i])
                    insertActiveEdge(edges[i])

                }
            }
           // activeEdges.sort((a,b)=>a.x-b.x)
       
            if (fillRule === FillRule.EvenOdd) {
                for (let i = 0; i < activeEdges.length - 1; i += 2) {
                    bitter(y, activeEdges[i].x, activeEdges[i + 1].x)
                }
            } else {
                let windingNumber = 0, start: Edge | null = null
                for (let i = 0; i < activeEdges.length; i++) {
                    if (windingNumber !== 0 && start !== null) {
                        bitter(y, start.x, activeEdges[i].x)
                    }
                    start = activeEdges[i]
                    windingNumber += activeEdges[i].direction

                }
            }
            for (let i = 0; i < activeEdges.length; i++) {
                activeEdges[i].x = activeEdges[i].x0 +  ((fixedY - activeEdges[i].y0)*activeEdges[i].invSlope)
            }
            activeEdges = activeEdges.filter(d => d.yMax > fixedY)



        }

    }
    createEdge(x0: number, y0: number, x1: number, y1: number): Edge | boolean {
        x0 = x0 >> 0
        y0 = y0 >> 0
        x1 = x1 >> 0
        y1 = y1 >> 0

        if (y0 === y1) {
            return false
        }
        let dx = x1 - x0
        let dy = y1 - y0
        let yMin = Math.min(y0, y1)
        let yMax = Math.max(y0, y1)
        let x = y0 < y1 ? x0 : x1
        let invSlope = dx / dy
        return {
            x0,
            x1,
            y0,
            y1,
            yMin,
            yMax,
            x,
            invSlope,
            direction: dy > 0 ? 1 : -1
        } as Edge
    }
    buildEdges(path: PathBuilder) {
        let edges: (Edge | boolean)[] = []
        let startPoint = Point.default()
        let lastPoint: Point = Point.default()
        let needClosed = true
        
        path.visit({
            moveTo: (d) => {
                startPoint.copy(d.p0)
                lastPoint.copy(d.p0)
                needClosed = true
            },
            lineTo: (d) => {
                edges.push(this.createEdge(lastPoint.x, lastPoint.y, d.p0.x, d.p0.y))
                lastPoint.copy(d.p0)
            },
            quadraticCurveTo: (d) => {
                let lines: number[] = []
                subdivideQuadratic(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, 0.1, lines)
                for (let i = 0; i < lines.length; i += 4) {
                    edges.push(this.createEdge(lines[i], lines[i + 1], lines[i + 2], lines[i + 3]))
                }
                lastPoint.copy(d.p2)
            },
            bezierCurveTo: (d) => {
                let lines: number[] = []
                subdivideCubic(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, d.p3.x, d.p3.y, 0.1, lines)
                for (let i = 0; i < lines.length; i += 4) {
                    edges.push(this.createEdge(lines[i], lines[i + 1], lines[i + 2], lines[i + 3]))
                }
                lastPoint.copy(d.p3)
            },
            closePath: () => {
                edges.push(this.createEdge(lastPoint.x, lastPoint.y, startPoint.x, startPoint.y))
                lastPoint.copy(startPoint)
                needClosed = false
            }
        })

        return edges.filter(Boolean) as Edge[]
    }
    drawLine(bitmap: Bitmap, path: PathBuilder, paint: Paint) {
        let startPoint = Point.default()
        let lastPoint: Point = Point.default()
        let lastClosed = false
        // Bresenham 算法画线
        function drawLine(x0: number, y0: number, x1: number, y1: number) {
            x0 = Math.round(x0);
            y0 = Math.round(y0);
            x1 = Math.round(x1);
            y1 = Math.round(y1);

            const dx = Math.abs(x1 - x0);
            const dy = Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1;
            const sy = y0 < y1 ? 1 : -1;
            let err = dx - dy;

            while (true) {
                bitmap.setPixel(x0, y0, paint.color[0], paint.color[1], paint.color[2], paint.color[3]);
                if (x0 === x1 && y0 === y1) break;
                const e2 = 2 * err;
                if (e2 > -dy) { err -= dy; x0 += sx; }
                if (e2 < dx) { err += dx; y0 += sy; }
            }
        }
        path.visit({
            moveTo: (d) => {
                startPoint.copy(d.p0)
                lastPoint.copy(d.p0)
                lastClosed = false
            },
            lineTo: (d) => {
                drawLine(lastPoint.x, lastPoint.y, d.p0.x, d.p0.y)
                lastPoint.copy(d.p0)
            },
            quadraticCurveTo: (d) => {
                let lines: number[] = []
                subdivideQuadratic(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, 1, lines)
                for (let i = 0; i < lines.length; i += 4) {
                    drawLine(lines[i], lines[i + 1], lines[i + 2], lines[i + 3])
                }
                lastPoint.copy(d.p2)
            },
            bezierCurveTo: (d) => {
                let lines: number[] = []
                subdivideCubic(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, d.p3.x, d.p3.y, 1, lines)
                for (let i = 0; i < lines.length; i += 4) {
                    drawLine(lines[i], lines[i + 1], lines[i + 2], lines[i + 3])
                }
                lastPoint.copy(d.p3)
            },
            closePath: () => {
                drawLine(lastPoint.x, lastPoint.y, startPoint.x, startPoint.y)
                lastPoint.copy(startPoint)
                lastClosed = true
            }
        })
    }
    stroke(bitmap: Bitmap, path: PathBuilder, paint: Paint) {


        this.fill(bitmap, path, paint,FillRule.NonZero)
    }
    buildContours() {

    }
}