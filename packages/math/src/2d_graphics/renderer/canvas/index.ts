import { isNumber } from "../../utils/lang";
import { BaseRenderer, BaseRendererOptions } from "../../base/Renderer";
import { Paint, PaintStyle } from "../../base/Paint";
import { Color } from "../../image/Color";
import { Matrix2dLike } from "math/2d_graphics/math/Matrix2d";

export interface CanvasRendererOptions extends BaseRendererOptions {

}


export class CanvasRenderer extends BaseRenderer<CanvasRenderingContext2D, CanvasRendererOptions> {
    createRenderContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
        return canvas.getContext("2d")!;
    }
    clear(): void {
        this.ctx.clearRect(0, 0, this.pixelWidth, this.pixelHeight)
    }
    save(): void {
        this.ctx.save()
    }
    restore(): void {
        this.ctx.restore()
    }
    transform(matrix: Matrix2dLike): void {

    }
    drawPaint(paint: Paint): void {
        const ctx = this.ctx;
        const color = Color.parse(paint.color!)
        if (color.alpha !== 1) {
            ctx.globalAlpha = color.alpha;
        }
        if (paint.paintStyle & PaintStyle.Fill) {
            ctx.fillStyle = color.toCssRGB();
            ctx.fill();
        }
        if (paint.paintStyle & PaintStyle.Stroke) {
            ctx.strokeStyle = color.toCssRGB();
            ctx.stroke();
        }
    }
    drawCircle(x: number, y: number, radius: number, ccw = false): void {
        this.ctx.arc(x, y, radius, 0, Math.PI * 2, ccw);
    }
    drawRect(x: number, y: number, width: number, height: number): void {
        this.ctx.rect(x, y, width, height);
    }


}