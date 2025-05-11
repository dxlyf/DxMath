// core/Rasterizer2D.ts
import { Vec2 } from './Path2DImpl.ts';

// export type Cell = { x: number, y: number, area: number, cover: number };
// Cell：记录某个像素（x,y）位置上的局部覆盖信息
export type Cell = {
    x: number;
    y: number;
    area: number;     // 覆盖面积（整数）
    cover: number;    // 覆盖次数（用于 winding rule）
};

// Span：一行上的连续灰度像素数据
export type Span = {
    x: number;
    y: number;
    len: number;
    alpha: number[];  // 灰度值数组
};

export type FillRule = 'nonzero' | 'evenodd';
export class Rasterizer2D {
    width: number;
    height: number;
    cells: Map<number, Cell[]> = new Map(); // y => Cell[]
    clipRect: { x0: number, y0: number, x1: number, y1: number };
  
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.clipRect = { x0: 0, y0: 0, x1: width, y1: height };
    }
  
    reset() {
      this.cells.clear();
    }
  
    moveTo(x: number, y: number) {
      this.cursor = [x, y];
    }
  
    lineTo(x1: number, y1: number) {
      const [x0, y0] = this.cursor;
      this.rasterizeEdge(x0, y0, x1, y1);
      this.cursor = [x1, y1];
    }
  
    // 核心 rasterize 方法（模拟 AGG 的整数坐标栅格化）
    private rasterizeEdge(x0: number, y0: number, x1: number, y1: number) {
      // 子像素精度：使用 1/256 精度模拟
      const scale = 256;
      let ix0 = Math.round(x0 * scale), iy0 = Math.round(y0 * scale);
      let ix1 = Math.round(x1 * scale), iy1 = Math.round(y1 * scale);
  
      // 简化处理：Bresenham or Xiaolin Wu 可替代
      const dx = ix1 - ix0;
      const dy = iy1 - iy0;
  
      if (dy === 0) return; // 忽略水平线段（无面积）
  
      if (iy0 > iy1) {
        [ix0, iy0, ix1, iy1] = [ix1, iy1, ix0, iy0];
      }
  
      const invDy = 1 / dy;
  
      for (let y = iy0; y < iy1; y += scale) {
        const t = (y - iy0) * invDy;
        const x = ix0 + t * dx;
        const fx = Math.floor(x / scale);
        const fy = Math.floor(y / scale);
        const cover = 1; // 简化，后续可插值为线段分段
        this.addCell(fx, fy, cover, 1);
      }
    }
  
    private addCell(x: number, y: number, cover: number, area: number) {
      if (y < this.clipRect.y0 || y >= this.clipRect.y1) return;
      if (x < this.clipRect.x0 || x >= this.clipRect.x1) return;
  
      if (!this.cells.has(y)) this.cells.set(y, []);
      const row = this.cells.get(y)!;
      const cell = row.find(c => c.x === x);
      if (cell) {
        //cell.add(cover, area);
        cell.cover += cover;
        cell.area += area;
      } else {
        const c:Cell= { x, y, cover: 0, area: 0 };
      //  c.add(cover, area);
        row.push(c);
      }
    }
  
    // 将 Cell 聚合成 Span（类似 AGG 的方式）
    getSpans(): Map<number, Span[]> {
      const spans = new Map<number, Span[]>();
      for (const [y, row] of this.cells.entries()) {
        row.sort((a, b) => a.x - b.x);
        const line: Span[] = [];
        for (const c of row) {
          const alpha = Math.min(255, Math.abs(c.cover + c.area)); // 简化合成
          line.push({ x: c.x, len: 1, alpha });
        }
        spans.set(y, line);
      }
      return spans;
    }
  
    // 渲染灰度图数据
    renderToImageData(): ImageData {
      const imageData = new ImageData(this.width, this.height);
      const spans = this.getSpans();
  
      for (const [y, line] of spans.entries()) {
        for (const span of line) {
          const offset = (y * this.width + span.x) * 4;
          imageData.data[offset + 0] = 0;
          imageData.data[offset + 1] = 0;
          imageData.data[offset + 2] = 0;
          imageData.data[offset + 3] = span.alpha;
        }
      }
  
      return imageData;
    }
  }
  