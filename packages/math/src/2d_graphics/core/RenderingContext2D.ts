import { Gradient } from "../image/Gradient";
import { Pattern } from "../image/Pattern";

export enum CompositeOperation{
    SourceOver = "source-over",
    SourceIn = "source-in",
    SourceOut = "source-out",
    SourceAtop = "source-atop",
    DestinationOver = "destination-over",
    DestinationIn = "destination-in",
    DestinationOut = "destination-out",
    DestinationAtop = "destination-atop",
    Lighter = "lighter",
    Copy = "copy",
    Xor = "xor",
    Multiply = "multiply",
    Screen = "screen",
    Overlay = "overlay",
    Darken = "darken",
    Lighten = "lighten",
    ColorDodge = "color-dodge",
    ColorBurn = "color-burn",
    HardLight = "hard-light",
    SoftLight = "soft-light",
    Difference = "difference",
    Exclusion = "exclusion",
    Hue = "hue",
    Saturation = "saturation",
    Color = "color",
    Luminosity = "luminosity"
}
export enum ImageSmoothingQuality{
    Low = "low",
    Medium = "medium",
    High = "high"
}
// export enum CanvasFontKerning{
//     Normal = "normal",
//     None = "none"
// }
// export enum CanvasFontStretch{
//     UltraExpanded = "ultra-expanded",
//     ExtraExpanded = "extra-expanded",
//     Expanded = "expanded",
//     SemiExpanded = "semi-expanded",
//     UltraCondensed = "ultra-condensed",
//     ExtraCondensed = "extra-condensed",
//     Condensed = "condensed",
//     SemiCondensed = "semi-condensed"
// }
// export enum CanvasFontVariantCaps{
//     Normal = "normal",
//     SmallCaps = "small-caps",
//     AllSmallCaps = "all-small-caps",
//     PetiteCaps = "petite-caps",
//     AllPetiteCaps = "all-petite-caps",
//     Unicase = "unicase",
//     TitlingCaps = "titling-caps"
// }
// export enum CanvasTextRendering{
//     Auto = "auto",
//     OptimizeSpeed = "optimizeSpeed",
//     OptimizeLegibility = "optimizeLegibility",
    
// }

export class RenderingContext2D implements CanvasRenderingContext2D{
    canvas!: HTMLCanvasElement;
    getContextAttributes(): CanvasRenderingContext2DSettings {
        throw new Error("Method not implemented.");
    }
    globalAlpha: number=1;
    globalCompositeOperation: CompositeOperation=CompositeOperation.SourceOver;
    fillStyle: string | Gradient | Pattern='#000'
    strokeStyle: string |Gradient | Pattern='#000'
    filter: string='none'
    imageSmoothingEnabled: boolean=true
    imageSmoothingQuality: ImageSmoothingQuality=ImageSmoothingQuality.Medium;
    lineCap: CanvasLineCap='butt';
    lineDashOffset: number=0;
    lineJoin: CanvasLineJoin='miter';
    lineWidth: number=1;
    miterLimit: number=10;
    shadowBlur: number=0
    shadowColor: string='none'
    shadowOffsetX: number=0
    shadowOffsetY: number=0
    direction: CanvasDirection='ltr';
    font: string='12px sans-serif';
    fontKerning: CanvasFontKerning='normal'
    fontStretch: CanvasFontStretch='normal'
    fontVariantCaps: CanvasFontVariantCaps='normal'
    letterSpacing: string='normal';
    textAlign: CanvasTextAlign='left';
    textBaseline: CanvasTextBaseline='top';
    textRendering: CanvasTextRendering='auto'
    wordSpacing: string='normal';
    drawImage(image: unknown, sx: unknown, sy: unknown, sw?: unknown, sh?: unknown, dx?: unknown, dy?: unknown, dw?: unknown, dh?: unknown): void {
        throw new Error("Method not implemented.");
    }
    beginPath(): void {
        throw new Error("Method not implemented.");
    }
    clip(path?: unknown, fillRule?: unknown): void {
        throw new Error("Method not implemented.");
    }
    fill(path?: unknown, fillRule?: unknown): void {
        throw new Error("Method not implemented.");
    }
    isPointInPath(path: unknown, x: unknown, y?: unknown, fillRule?: unknown): boolean {
        throw new Error("Method not implemented.");
    }
    isPointInStroke(path: unknown, x: unknown, y?: unknown): boolean {
        throw new Error("Method not implemented.");
    }
    stroke(path?: unknown): void {
        throw new Error("Method not implemented.");
    }
    createConicGradient(startAngle: number, x: number, y: number): CanvasGradient {
        throw new Error("Method not implemented.");
    }
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        throw new Error("Method not implemented.");
    }
    createPattern(image: CanvasImageSource, repetition: string | null): CanvasPattern | null {
        throw new Error("Method not implemented.");
    }
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
        throw new Error("Method not implemented.");
    }
    createImageData(sw: unknown, sh?: unknown, settings?: unknown): ImageData {
        throw new Error("Method not implemented.");
    }
    getImageData(sx: number, sy: number, sw: number, sh: number, settings?: ImageDataSettings): ImageData {
        throw new Error("Method not implemented.");
    }
    putImageData(imagedata: unknown, dx: unknown, dy: unknown, dirtyX?: unknown, dirtyY?: unknown, dirtyWidth?: unknown, dirtyHeight?: unknown): void {
        throw new Error("Method not implemented.");
    }
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        throw new Error("Method not implemented.");
    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        throw new Error("Method not implemented.");
    }
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    closePath(): void {
        throw new Error("Method not implemented.");
    }
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        throw new Error("Method not implemented.");
    }
    lineTo(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    moveTo(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    rect(x: number, y: number, w: number, h: number): void {
        throw new Error("Method not implemented.");
    }
    roundRect(x: unknown, y: unknown, w: unknown, h: unknown, radii?: unknown): void {
        throw new Error("Method not implemented.");
    }

    getLineDash(): number[] {
        throw new Error("Method not implemented.");
    }
    setLineDash(segments: unknown): void {
        throw new Error("Method not implemented.");
    }
    clearRect(x: number, y: number, w: number, h: number): void {
        throw new Error("Method not implemented.");
    }
    fillRect(x: number, y: number, w: number, h: number): void {
        throw new Error("Method not implemented.");
    }
    strokeRect(x: number, y: number, w: number, h: number): void {
        throw new Error("Method not implemented.");
    }

    isContextLost(): boolean {
        throw new Error("Method not implemented.");
    }
    reset(): void {
        throw new Error("Method not implemented.");
    }
    restore(): void {
        throw new Error("Method not implemented.");
    }
    save(): void {
        throw new Error("Method not implemented.");
    }
    fillText(text: string, x: number, y: number, maxWidth?: number): void {
        throw new Error("Method not implemented.");
    }
    measureText(text: string): TextMetrics {
        throw new Error("Method not implemented.");
    }
    strokeText(text: string, x: number, y: number, maxWidth?: number): void {
        throw new Error("Method not implemented.");
    }

    getTransform(): DOMMatrix {
        throw new Error("Method not implemented.");
    }
    resetTransform(): void {
        throw new Error("Method not implemented.");
    }
    rotate(angle: number): void {
        throw new Error("Method not implemented.");
    }
    scale(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    setTransform(a?: unknown, b?: unknown, c?: unknown, d?: unknown, e?: unknown, f?: unknown): void {
        throw new Error("Method not implemented.");
    }
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
        throw new Error("Method not implemented.");
    }
    translate(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    drawFocusIfNeeded(path: unknown, element?: unknown): void {
        throw new Error("Method not implemented.");
    }


}