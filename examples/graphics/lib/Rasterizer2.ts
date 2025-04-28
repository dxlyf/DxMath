import { subdivideCubic, subdivideQuadratic } from "./curve";
import { PathBuilder, PathVerb } from "./Path";

export type FillRule = "nonzero" | "evenodd";

export class Rasterizer {
    private edges: { x0: number, y0: number, x1: number, y1: number }[] = [];

    buildEdges(path: PathBuilder, tolerance = 0.25) {
        this.edges = [];
        const pts = path.points;
        const verbs = path.verbs;
        let i = 0;
        let startX = 0, startY = 0;
        let lastX = 0, lastY = 0;

        for (const verb of verbs) {
            switch (verb) {
                case PathVerb.MOVE_TO:
                    startX = lastX = pts[i++];
                    startY = lastY = pts[i++];
                    break;
                case PathVerb.LINE_TO: {
                    const x = pts[i++];
                    const y = pts[i++];
                    this.edges.push({ x0: lastX, y0: lastY, x1: x, y1: y });
                    lastX = x; lastY = y;
                    break;
                }
                case PathVerb.QUADRATIC_BEZIER_TO: {
                    const cx = pts[i++], cy = pts[i++];
                    const x = pts[i++], y = pts[i++];
                    const lines: number[] = [];
                    subdivideQuadratic(lastX, lastY, cx, cy, x, y, tolerance, lines);
                    for (let j = 0; j < lines.length; j += 4) {
                        this.edges.push({ x0: lines[j], y0: lines[j+1], x1: lines[j+2], y1: lines[j+3] });
                    }
                    lastX = x; lastY = y;
                    break;
                }
                case PathVerb.CUBIC_BEZIER_TO: {
                    const cx1 = pts[i++], cy1 = pts[i++];
                    const cx2 = pts[i++], cy2 = pts[i++];
                    const x = pts[i++], y = pts[i++];
                    const lines: number[] = [];
                    subdivideCubic(lastX, lastY, cx1, cy1, cx2, cy2, x, y, tolerance, lines);
                    for (let j = 0; j < lines.length; j += 4) {
                        this.edges.push({ x0: lines[j], y0: lines[j+1], x1: lines[j+2], y1: lines[j+3] });
                    }
                    lastX = x; lastY = y;
                    break;
                }
                case PathVerb.CLOSE_PATH:
                    this.edges.push({ x0: lastX, y0: lastY, x1: startX, y1: startY });
                    lastX = startX; lastY = startY;
                    break;
            }
        }
    }

    fill(bitmap: Uint8ClampedArray, width: number, height: number, fillRule: FillRule = "nonzero") {
        // (简单版填充，可以再加超采样抗锯齿)
        const coverage = new Float32Array(width * height);
        for (const e of this.edges) {
            // Bresenham / Xiaolin Wu 等方法都可以加
            // TODO: 实现精细扫描线
        }

        // 写回 bitmap
        for (let i = 0; i < width * height; i++) {
            const alpha = Math.min(Math.max(coverage[i], 0), 1) * 255;
            bitmap[i * 4 + 0] = 0;   // R
            bitmap[i * 4 + 1] = 0;   // G
            bitmap[i * 4 + 2] = 0;   // B
            bitmap[i * 4 + 3] = alpha; // A
        }
    }
}
