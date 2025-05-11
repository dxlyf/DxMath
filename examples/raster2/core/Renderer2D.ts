// core/Renderer2D.ts
import { Path2DImpl } from './Path2DImpl.ts';
import { BezierFlattener } from './BezierFlattener.ts';
import { StrokeGenerator } from './StrokeGenerator.ts';
import { Rasterizer2D, FillRule } from './Rasterizer2D.ts';

export class Renderer2D {
  private width: number;
  private height: number;
  private ctx: CanvasRenderingContext2D;
  private clipMask?: Uint8ClampedArray;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  setClip(path: Path2DImpl, fillRule: FillRule = 'nonzero') {
    const clipRaster = new Rasterizer2D(this.width, this.height, fillRule);
    for (const sub of path.flatten()) {
      clipRaster.fillPolygon(sub);
    }
    this.clipMask = clipRaster.rasterizeToBuffer();
  }

  fill(path: Path2DImpl, fillRule: FillRule = 'nonzero') {
    const raster = new Rasterizer2D(this.width, this.height, fillRule);
    for (const sub of path.flatten()) {
      raster.fillPolygon(sub);
    }
    raster.drawToCanvas(this.ctx, this.clipMask);
  }

  stroke(path: Path2DImpl, width: number, join: string = 'miter', cap: string = 'butt') {
    const stroker = new StrokeGenerator(width, join, cap);
    const raster = new Rasterizer2D(this.width, this.height, 'nonzero');

    for (const sub of path.flatten()) {
      const outline = stroker.generate(sub);
      for (const poly of outline) {
        raster.fillPolygon(poly);
      }
    }

    raster.drawToCanvas(this.ctx, this.clipMask);
  }

  hitTest(path: Path2DImpl, x: number, y: number, fillRule: FillRule = 'nonzero'): boolean {
    const raster = new Rasterizer2D(this.width, this.height, fillRule);
    for (const sub of path.flatten()) {
      raster.fillPolygon(sub);
    }
    return raster.hitTest(x, y);
  }
}
