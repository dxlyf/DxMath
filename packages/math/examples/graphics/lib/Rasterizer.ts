// Rasterizer.ts
// @ts-nocheck
import { Bitmap } from "./Bitmap";
import { PathBuilder, PathVerb } from "math/2d_raster";
import { FillRule } from "./FillRule";

export enum LineJoin {
    MITER,
    ROUND,
    BEVEL,
}

export enum LineCap {
    BUTT,
    ROUND,
    SQUARE,
}

export interface StrokeOptions {
    lineWidth: number;
    lineJoin: LineJoin;
    lineCap: LineCap;
    miterLimit: number; // 斜接最大长度限制（防止太尖）
    color: [number, number, number, number]
}


type Edge = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
};

export class Rasterizer {
  
    
    static fill(bitmap: Bitmap, path: PathBuilder, fillRule: FillRule, color: [number, number, number, number]) {
        const edges: Edge[] = Rasterizer.buildEdges(path);
        const height = bitmap.height;

        for (let y = 0; y < height; y++) {
            const scanY = y + 0.5;
            const intersections: number[] = [];

            for (const edge of edges) {
                if (edge.y0 === edge.y1) continue; // 忽略水平线
                if ((scanY >= Math.min(edge.y0, edge.y1)) && (scanY < Math.max(edge.y0, edge.y1))) {
                    const t = (scanY - edge.y0) / (edge.y1 - edge.y0);
                    const x = edge.x0 + (edge.x1 - edge.x0) * t;
                    intersections.push(x);
                }
            }

            intersections.sort((a, b) => a - b);

            if (fillRule === FillRule.EVEN_ODD) {
                for (let i = 0; i + 1 < intersections.length; i += 2) {
                    const xStart = Math.ceil(intersections[i]);
                    const xEnd = Math.floor(intersections[i + 1]);
                    for (let x = xStart; x <= xEnd; x++) {
                        bitmap.setPixel(x, y, ...color);
                    }
                }
            } else if (fillRule === FillRule.NON_ZERO) {
                let winding = 0;
                for (let i = 0; i < intersections.length; i++) {
                    winding++;
                    if (winding % 2 === 1 && i + 1 < intersections.length) {
                        const xStart = Math.ceil(intersections[i]);
                        const xEnd = Math.floor(intersections[i + 1]);
                        for (let x = xStart; x <= xEnd; x++) {
                            bitmap.setPixel(x, y, ...color);
                        }
                    }
                }
            }
        }
    }
    private static subdivideQuadratic(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, edges: Edge[]) {
        const steps = 32;
        let prevX = x0;
        let prevY = y0;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const u = 1 - t;
            const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
            const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
            edges.push({ x0: prevX, y0: prevY, x1: x, y1: y });
            prevX = x;
            prevY = y;
        }
    }

    private static subdivideCubic(x0: number, y0: number, cx1: number, cy1: number, cx2: number, cy2: number, x1: number, y1: number, edges: Edge[]) {
        const steps = 32;
        let prevX = x0;
        let prevY = y0;
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const u = 1 - t;
            const x = u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x1;
            const y = u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y1;
            edges.push({ x0: prevX, y0: prevY, x1: x, y1: y });
            prevX = x;
            prevY = y;
        }
    }

    private static buildEdges(path: PathBuilder): Edge[] {
        const edges: Edge[] = [];
        let lastX = 0, lastY = 0;
        let startX = 0, startY = 0;
        let p = 0;
        for (let i = 0; i < path.verbs.length; i++) {
            const verb = path.verbs[i];
            if (verb === PathVerb.MOVE_TO) {
                lastX = startX = path.points[p++];
                lastY = startY = path.points[p++];
            } else if (verb === PathVerb.LINE_TO) {
                const x = path.points[p++];
                const y = path.points[p++];
                edges.push({ x0: lastX, y0: lastY, x1: x, y1: y });
                lastX = x;
                lastY = y;
            } else if (verb === PathVerb.QUADRATIC_BEZIER_TO) {
                const cx = path.points[p++];
                const cy = path.points[p++];
                const x = path.points[p++];
                const y = path.points[p++];
                this.subdivideQuadratic(lastX, lastY, cx, cy, x, y, edges);
                lastX = x;
                lastY = y;
            } else if (verb === PathVerb.CUBIC_BEZIER_TO) {
                const cx1 = path.points[p++];
                const cy1 = path.points[p++];
                const cx2 = path.points[p++];
                const cy2 = path.points[p++];
                const x = path.points[p++];
                const y = path.points[p++];
                this.subdivideCubic(lastX, lastY, cx1, cy1, cx2, cy2, x, y, edges);
                lastX = x;
                lastY = y;
            } else if (verb === PathVerb.CLOSE_PATH) {
                edges.push({ x0: lastX, y0: lastY, x1: startX, y1: startY });
                lastX = startX;
                lastY = startY;
            }
        }
        return edges;
    }
    static stroke(bitmap: Bitmap, path: PathBuilder, options: StrokeOptions) {
        const strokedPath = this.buildStrokedPath(path, options);
        this.fill(bitmap, strokedPath, FillRule.NON_ZERO, options.color);
    }
    private static addJoin(
        left: [number, number][],
        right: [number, number][],
        nx0: number, ny0: number,
        nx1: number, ny1: number,
        x: number, y: number,
        halfWidth: number,
        options: StrokeOptions
    ) {
        const cosTheta = nx0 * nx1 + ny0 * ny1;
        if (cosTheta > 0.9999) {
            return;
        }

        if (options.lineJoin === LineJoin.MITER) {
            const miterLength = halfWidth / Math.max(0.0001, Math.sqrt((1 + cosTheta) / 2));
            if (miterLength > options.miterLimit * halfWidth) {
                this.addBevelJoin(left, right, x, y, nx0, ny0, nx1, ny1, halfWidth);
            } else {
                const mx = (nx0 + nx1);
                const my = (ny0 + ny1);
                const ml = Math.hypot(mx, my);
                if (ml > 0.0001) {
                    const mxf = mx / ml;
                    const myf = my / ml;
                    left.push([x + mxf * miterLength, y + myf * miterLength]);
                    right.push([x - mxf * miterLength, y - myf * miterLength]);
                }
            }
        } else if (options.lineJoin === LineJoin.BEVEL) {
            this.addBevelJoin(left, right, x, y, nx0, ny0, nx1, ny1, halfWidth);
        } else if (options.lineJoin === LineJoin.ROUND) {
            this.addRoundJoin(left, right, x, y, nx0, ny0, nx1, ny1, halfWidth);
        }
    }
    private static addRoundJoin(
        left: [number, number][],
        right: [number, number][],
        x: number, y: number,
        nx0: number, ny0: number,
        nx1: number, ny1: number,
        halfWidth: number
    ) {
        const steps = 6; // 圆弧分6段
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const ax = nx0 * (1 - t) + nx1 * t;
            const ay = ny0 * (1 - t) + ny1 * t;
            const l = Math.hypot(ax, ay);
            if (l > 0.0001) {
                const axn = ax / l;
                const ayn = ay / l;
                left.push([x + axn * halfWidth, y + ayn * halfWidth]);
                right.push([x - axn * halfWidth, y - ayn * halfWidth]);
            }
        }
    }
    private static addBevelJoin(
        left: [number, number][],
        right: [number, number][],
        x: number, y: number,
        nx0: number, ny0: number,
        nx1: number, ny1: number,
        halfWidth: number
    ) {
        left.push([x + nx0 * halfWidth, y + ny0 * halfWidth]);
        left.push([x + nx1 * halfWidth, y + ny1 * halfWidth]);
        right.push([x - nx0 * halfWidth, y - ny0 * halfWidth]);
        right.push([x - nx1 * halfWidth, y - ny1 * halfWidth]);
    }
    private static addRoundCap(
        list: [number, number][],
        x: number, y: number,
        nx: number, ny: number,
        halfWidth: number,
        isStart: boolean
    ) {
        const steps = 6;
        const angle = isStart ? Math.PI : 0;
        for (let i = 0; i <= steps; i++) {
            const theta = angle + (isStart ? 1 : -1) * Math.PI * (i / steps);
            const cx = Math.cos(theta);
            const cy = Math.sin(theta);
            list.push([x + cx * halfWidth, y + cy * halfWidth]);
        }
    }
    private static emitStrokeContour(
        path: PathBuilder,
        left: [number, number][],
        right: [number, number][],
        options: StrokeOptions,
        open: boolean
    ) {
        if (left.length === 0 || right.length === 0) return;
        path.moveTo(left[0][0], left[0][1]);
        for (let i = 1; i < left.length; i++) {
            path.lineTo(left[i][0], left[i][1]);
        }
        for (let i = right.length - 1; i >= 0; i--) {
            path.lineTo(right[i][0], right[i][1]);
        }
        path.closePath();
    }

    private static buildStrokedPath(path: PathBuilder, options: StrokeOptions): PathBuilder {
        const newPath = new PathBuilder();
        const halfWidth = options.lineWidth / 2;

        let p = 0;
        let lastX = 0, lastY = 0;
        let startX = 0, startY = 0;
        let lastNormalX = 0, lastNormalY = 0;
        let first = true;

        const left: [number, number][] = [];
        const right: [number, number][] = [];

        for (let i = 0; i < path.verbs.length; i++) {
            const verb = path.verbs[i];
            if (verb === PathVerb.MOVE_TO) {
                if (left.length > 0) {
                    this.emitStrokeContour(newPath, left, right, options, true);
                }
                left.length = 0;
                right.length = 0;

                lastX = startX = path.points[p++];
                lastY = startY = path.points[p++];
                first = true;
            } else if (verb === PathVerb.LINE_TO) {
                const x = path.points[p++];
                const y = path.points[p++];
                this.strokeLine(lastX, lastY, x, y, left, right, halfWidth, options, first);
                lastX = x;
                lastY = y;
                first = false;
            } else if (verb === PathVerb.QUADRATIC_BEZIER_TO) {
                const cx = path.points[p++];
                const cy = path.points[p++];
                const x = path.points[p++];
                const y = path.points[p++];
                this.strokeQuadratic(lastX, lastY, cx, cy, x, y, left, right, halfWidth, options, first);
                lastX = x;
                lastY = y;
                first = false;
            } else if (verb === PathVerb.CUBIC_BEZIER_TO) {
                const cx1 = path.points[p++];
                const cy1 = path.points[p++];
                const cx2 = path.points[p++];
                const cy2 = path.points[p++];
                const x = path.points[p++];
                const y = path.points[p++];
                this.strokeCubic(lastX, lastY, cx1, cy1, cx2, cy2, x, y, left, right, halfWidth, options, first);
                lastX = x;
                lastY = y;
                first = false;
            } else if (verb === PathVerb.CLOSE_PATH) {
                if (left.length > 0) {
                    this.emitStrokeContour(newPath, left, right, options, false);
                    left.length = 0;
                    right.length = 0;
                }
            }
        }

        if (left.length > 0) {
            this.emitStrokeContour(newPath, left, right, options, true);
        }

        return newPath;
    }


    private static strokeLine(
        x0: number, y0: number,
        x1: number, y1: number,
        left: [number, number][],
        right: [number, number][],
        halfWidth: number,
        options: StrokeOptions,
        isFirst: boolean
    ) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        if (len < 1e-6) return;
        const nx = -dy / len;
        const ny = dx / len;

        if (isFirst) {
            if (options.lineCap === LineCap.BUTT) {
                left.push([x0 + nx * halfWidth, y0 + ny * halfWidth]);
                right.push([x0 - nx * halfWidth, y0 - ny * halfWidth]);
            } else if (options.lineCap === LineCap.ROUND) {
                this.addRoundCap(left, x0, y0, nx, ny, halfWidth, true);
                this.addRoundCap(right, x0, y0, -nx, -ny, halfWidth, false);
            } else if (options.lineCap === LineCap.SQUARE) {
                const tx = dx / len * halfWidth;
                const ty = dy / len * halfWidth;
                left.push([x0 + nx * halfWidth - tx, y0 + ny * halfWidth - ty]);
                right.push([x0 - nx * halfWidth - tx, y0 - ny * halfWidth - ty]);
            }
        } else {
            // 连接处理 (join)
        }

        left.push([x1 + nx * halfWidth, y1 + ny * halfWidth]);
        right.push([x1 - nx * halfWidth, y1 - ny * halfWidth]);
    }

    private static strokeQuadratic(
        x0: number, y0: number,
        cx: number, cy: number,
        x1: number, y1: number,
        left: [number, number][],
        right: [number, number][],
        halfWidth: number,
        options: StrokeOptions,
        first: boolean
    ) {
        const baseTolerance = 0.25; // 基础容差 (px)
        const effectiveTolerance = baseTolerance / Math.sqrt(halfWidth + 1);
        const maxDepth = 10; // 最大细分深度
        this._adaptiveQuadratic(x0, y0, cx, cy, x1, y1, left, right, halfWidth, options, first, effectiveTolerance, 0, maxDepth);
    }
    
    private static _adaptiveQuadratic(
        x0: number, y0: number,
        cx: number, cy: number,
        x1: number, y1: number,
        left: [number, number][],
        right: [number, number][],
        halfWidth: number,
        options: StrokeOptions,
        first: boolean,
        tolerance: number,
        depth: number,
        maxDepth: number
    ) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const d = Math.abs((cx - (x0 + x1) * 0.5) * dy - (cy - (y0 + y1) * 0.5) * dx);
        const lenSq = dx * dx + dy * dy;
    
        if (depth >= maxDepth || d * d <= tolerance * tolerance * lenSq) {
            this.strokeLine(x0, y0, x1, y1, left, right, halfWidth, options, first);
        } else {
            const midX0 = (x0 + cx) * 0.5;
            const midY0 = (y0 + cy) * 0.5;
            const midX1 = (cx + x1) * 0.5;
            const midY1 = (cy + y1) * 0.5;
            const midX = (midX0 + midX1) * 0.5;
            const midY = (midY0 + midY1) * 0.5;
            this._adaptiveQuadratic(x0, y0, midX0, midY0, midX, midY, left, right, halfWidth, options, first, tolerance, depth + 1, maxDepth);
            this._adaptiveQuadratic(midX, midY, midX1, midY1, x1, y1, left, right, halfWidth, options, false, tolerance, depth + 1, maxDepth);
        }
    }
    
    private static strokeCubic(
        x0: number, y0: number,
        cx1: number, cy1: number,
        cx2: number, cy2: number,
        x1: number, y1: number,
        left: [number, number][],
        right: [number, number][],
        halfWidth: number,
        options: StrokeOptions,
        first: boolean
    ) {
        const baseTolerance = 0.25;
        const effectiveTolerance = baseTolerance / Math.sqrt(halfWidth + 1);
        const maxDepth = 12;
        this._adaptiveCubic(x0, y0, cx1, cy1, cx2, cy2, x1, y1, left, right, halfWidth, options, first, effectiveTolerance, 0, maxDepth);
    }
    
    private static _adaptiveCubic(
        x0: number, y0: number,
        cx1: number, cy1: number,
        cx2: number, cy2: number,
        x1: number, y1: number,
        left: [number, number][],
        right: [number, number][],
        halfWidth: number,
        options: StrokeOptions,
        first: boolean,
        tolerance: number,
        depth: number,
        maxDepth: number
    ) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const d1 = Math.abs((cx1 - (x0 + x1) * 0.5) * dy - (cy1 - (y0 + y1) * 0.5) * dx);
        const d2 = Math.abs((cx2 - (x0 + x1) * 0.5) * dy - (cy2 - (y0 + y1) * 0.5) * dx);
        const lenSq = dx * dx + dy * dy;
    
        if (depth >= maxDepth || (d1 + d2) * (d1 + d2) <= tolerance * tolerance * lenSq) {
            this.strokeLine(x0, y0, x1, y1, left, right, halfWidth, options, first);
        } else {
            const midX01 = (x0 + cx1) * 0.5;
            const midY01 = (y0 + cy1) * 0.5;
            const midX12 = (cx1 + cx2) * 0.5;
            const midY12 = (cy1 + cy2) * 0.5;
            const midX23 = (cx2 + x1) * 0.5;
            const midY23 = (cy2 + y1) * 0.5;
    
            const midX012 = (midX01 + midX12) * 0.5;
            const midY012 = (midY01 + midY12) * 0.5;
            const midX123 = (midX12 + midX23) * 0.5;
            const midY123 = (midY12 + midY23) * 0.5;
    
            const midX = (midX012 + midX123) * 0.5;
            const midY = (midY012 + midY123) * 0.5;
    
            this._adaptiveCubic(x0, y0, midX01, midY01, midX012, midY012, midX, midY, left, right, halfWidth, options, first, tolerance, depth + 1, maxDepth);
            this._adaptiveCubic(midX, midY, midX123, midY123, midX23, midY23, x1, y1, left, right, halfWidth, options, false, tolerance, depth + 1, maxDepth);
        }
    }
    private static applyLineCap(
        x0: number, y0: number,
        nx: number, ny: number,
        halfWidth: number,
        left: [number, number][],
        right: [number, number][],
        cap: "butt" | "round" | "square",
        atStart: boolean
    ) {
        if (cap === "butt") {
            // 不动
        } else if (cap === "square") {
            // 往前或往后推半个线宽
            const offsetX = nx * halfWidth;
            const offsetY = ny * halfWidth;
            if (atStart) {
                left[0][0] -= offsetX;
                left[0][1] -= offsetY;
                right[0][0] -= offsetX;
                right[0][1] -= offsetY;
            } else {
                left[left.length-1][0] += offsetX;
                left[left.length-1][1] += offsetY;
                right[right.length-1][0] += offsetX;
                right[right.length-1][1] += offsetY;
            }
        } else if (cap === "round") {
            // 画半圆盖住
            const centerX = atStart ? (left[0][0] + right[0][0]) * 0.5 : (left[left.length-1][0] + right[right.length-1][0]) * 0.5;
            const centerY = atStart ? (left[0][1] + right[0][1]) * 0.5 : (left[left.length-1][1] + right[right.length-1][1]) * 0.5;
            const angle0 = Math.atan2(left[atStart ? 0 : left.length-1][1] - centerY, left[atStart ? 0 : left.length-1][0] - centerX);
            const angle1 = Math.atan2(right[atStart ? 0 : right.length-1][1] - centerY, right[atStart ? 0 : right.length-1][0] - centerX);
    
            const segments = Math.max(6, Math.floor(Math.abs(angle1 - angle0) / (Math.PI / 8)));
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const angle = atStart
                    ? angle0 + t * (angle1 - angle0)
                    : angle1 + t * (angle0 - angle1);
                const x = centerX + Math.cos(angle) * halfWidth;
                const y = centerY + Math.sin(angle) * halfWidth;
                if (atStart) {
                    left.splice(i, 0, [x, y]);
                } else {
                    left.splice(left.length - i, 0, [x, y]);
                }
            }
        }
    }
    private static applyLineJoin(
        prevX: number, prevY: number,
        currX: number, currY: number,
        nextX: number, nextY: number,
        halfWidth: number,
        left: [number, number][],
        right: [number, number][],
        join: "miter" | "bevel" | "round",
        miterLimit: number
    ) {
        const v0x = currX - prevX;
        const v0y = currY - prevY;
        const v1x = nextX - currX;
        const v1y = nextY - currY;
    
        const len0 = Math.hypot(v0x, v0y);
        const len1 = Math.hypot(v1x, v1y);
    
        if (len0 === 0 || len1 === 0) return; // 退化情况
    
        const n0x = v0y / len0;
        const n0y = -v0x / len0;
        const n1x = v1y / len1;
        const n1y = -v1x / len1;
    
        const avgNx = (n0x + n1x) * 0.5;
        const avgNy = (n0y + n1y) * 0.5;
        const len = Math.hypot(avgNx, avgNy);
    
        if (len === 0) {
            // 180度折返，直接连接
            return;
        }
    
        const scale = halfWidth / len;
        const mx = avgNx * scale;
        const my = avgNy * scale;
    
        // 计算miter长度
        const cosTheta = (v0x * v1x + v0y * v1y) / (len0 * len1);
        const miterLength = halfWidth / Math.max(1e-6, Math.sqrt((1 + cosTheta) / 2));
    
        if (join === "miter" && miterLength <= halfWidth * miterLimit) {
            // miter连接
            left.push([currX + mx, currY + my]);
            right.push([currX - mx, currY - my]);
        } else if (join === "round") {
            // 插入一段弧线
            const startAngle = Math.atan2(n0y, n0x);
            const endAngle = Math.atan2(n1y, n1x);
            const segments = Math.max(6, Math.floor(Math.abs(endAngle - startAngle) / (Math.PI / 8)));
    
            for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const angle = startAngle + t * (endAngle - startAngle);
                const x = currX + Math.cos(angle) * halfWidth;
                const y = currY + Math.sin(angle) * halfWidth;
                left.push([x, y]);
            }
        } else {
            // bevel连接
            left.push([currX + n0x * halfWidth, currY + n0y * halfWidth]);
            left.push([currX + n1x * halfWidth, currY + n1y * halfWidth]);
            right.push([currX - n0x * halfWidth, currY - n0y * halfWidth]);
            right.push([currX - n1x * halfWidth, currY - n1y * halfWidth]);
        }
    }
    

}
