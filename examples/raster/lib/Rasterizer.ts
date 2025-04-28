import { PathBuilder, Point } from "math/2d_raster/soft2d";
import { Bitmap } from "./Bitmap";
import { Paint } from "./Paint";
import { subdivideCubic, subdivideQuadratic } from './Bezier'
import { in26_6_mul, int26_6_from_float, int26_6_to_float } from './Fixed'
import {Stroker} from './Stroker'

export enum FillRule {
    NonZero = 'nonzero',
    EvenOdd = 'evenodd'
}
type Edge = {
    x: number
    y0: number
    y1: number
    invSlope: number
    direction: number
}
export class Rasterizer {

    fillPath: PathBuilder = PathBuilder.default()
    strokePath: PathBuilder = PathBuilder.default()

    fill(bitmap: Bitmap, path: PathBuilder, fillRule: FillRule, paint: Paint) {
        const edges = this.buildEdges(path)
        const activeEdges: Edge[] = []
        let yMin = Infinity
        let yMax = -Infinity
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].y0 < yMin) {
                yMin = edges[i].y0
            }
            if (edges[i].y1 > yMax) {
                yMax = edges[i].y1
            }
        }
        let yStart = Math.floor(yMin)
        let yEnd = Math.ceil(yMax)
        let insertActiveEdge=(edge: Edge) => {
            for (let i = 0; i < activeEdges.length; i++) {
                if (edge.x<activeEdges[i].x) {
                    activeEdges.splice(i, 0, edge)
                    return
                }
            }
            activeEdges.push(edge)
        }
        let bitter=(y:number,start:number,end:number)=>{
            const x0 = Math.floor(start)
            const x1 = Math.ceil(end)
            for (let x = x0; x < x1; x++) {
                bitmap.setPixel(x, y,paint.color[0],paint.color[1],paint.color[2],paint.color[3])
            }
        }
        for (let y = yStart; y <= yEnd; y++) {
            activeEdges.length = 0
            for (let i = 0; i < edges.length; i++) {
                const edge = edges[i]
                if (y >= edge.y0 && y <= edge.y1) {
                    insertActiveEdge(edge)
                }
            }
            if (fillRule === FillRule.EvenOdd) {
                for (let i = 0; i < activeEdges.length - 1; i += 2) {
                    bitter(y,activeEdges[i].x,activeEdges[i].x)
                }
            } else {
                let windingNumber = 0, start: Edge | null = null
                for (let i = 0; i < activeEdges.length; i++) {
                    if (windingNumber !== 0 && start !== null) {
                        bitter(y,start.x,activeEdges[i].x)
                    }
                    start = activeEdges[i]
                    windingNumber += activeEdges[i].direction

                }
            }

            for (let i = 0; i < activeEdges.length - 1; i++) {
                activeEdges[i].x += activeEdges[i].invSlope
            }


        }

    }
    createEdge(x0: number, y0: number, x1: number, y1: number): Edge {
        let dx = x1 - x0
        let dy = y1 - y0
        let yMin = Math.min(y0, y1)
        let yMax = Math.max(y0, y1)
        let x = y0 > y1 ? x1 : x0
        let invSlope = dx / dy
        return {
            y0: yMin,
            y1: yMax,
            x,
            invSlope,
            direction: dy > 0 ? 1 : -1
        } as Edge
    }
    buildEdges(path: PathBuilder) {
        let edges: Edge[] = []
        let startPoint = Point.default()
        let lastPoint: Point = Point.default()

        path.visit({
            moveTo: (d) => {
                startPoint.copy(d.p0)
                lastPoint.copy(d.p0)
            },
            lineTo: (d) => {
                edges.push(this.createEdge(lastPoint.x, lastPoint.y, d.p0.x, d.p0.y))
                lastPoint.copy(d.p0)
            },
            quadraticCurveTo: (d) => {
                let lines: number[] = []
                subdivideQuadratic(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, 0.5, lines)
                for (let i = 0; i < lines.length; i += 4) {
                    edges.push(this.createEdge(lines[i], lines[i+1], lines[i+2], lines[i+3]))
                }
                lastPoint.copy(d.p2)
            },
            bezierCurveTo: (d) => {
                let lines: number[] = []
                subdivideCubic(d.p0.x, d.p0.y, d.p1.x, d.p1.y, d.p2.x, d.p2.y, d.p3.x, d.p3.y,0.5, lines)
                for (let i = 0; i < lines.length; i += 4) {
                    edges.push(this.createEdge(lines[i], lines[i+1], lines[i+2], lines[i+3]))
                }
                lastPoint.copy(d.p3)
            },
            closePath: () => {
                edges.push(this.createEdge(lastPoint.x, lastPoint.y, startPoint.x, startPoint.y))
                lastPoint.copy(startPoint)
            }
        })
        return edges.filter((d) => d.y1 !== d.y0)
    }
    stroke(bitmap: Bitmap, path: PathBuilder, paint: Paint) {
      
    }
    buildContours(){
        
    }
}