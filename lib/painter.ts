import { Pixmap, PixmapMut, SubPixmapMut } from './pixmap'
import { LineCap, Path, PathStroker, Stroke, Transform } from './path'
import { Mask, SubMaskRef } from './mask'
import { Shader } from './shader'
import { Color, ColorSpace } from './color'
import { BlendMode, should_pre_scale_coverage } from './blend_mode'
import { Point } from './point'
import { Num } from './number'
import { isUnDef } from './utils'
import { Rect } from './path/rect'
import { RasterPipelineBlitter } from './pipeline'


declare module './pixmap.ts' {
  interface Pixmap {
    stroke_path(path: Path,
      paint: Paint,
      stroke: Stroke,
      transform: Transform,
      mask?: Mask): void
  }
  interface PixmapMut {
    stroke_path(path: Path,
      paint: Paint,
      stroke: Stroke,
      transform: Transform,
      mask?: Mask): void
    stroke_hairline(path: Path, paint: Paint, lie_cap: LineCap, pixmap: SubPixmapMut, mask?: SubMaskRef): void
  }
}

Pixmap.prototype.stroke_path = function (path: Path,
  paint: Paint,
  stroke: Stroke,
  transform: Transform,
  mask?: Mask) {
  this.as_mut().stroke_path(path, paint, stroke, transform, mask)
}

PixmapMut.prototype.stroke_hairline=function stroke_hairline(path: Path, paint: Paint, lie_cap: LineCap, pixmap: SubPixmapMut, mask?: SubMaskRef){
  let clip=pixmap.size.to_screen_int_rect(0,0)
  let blitter=RasterPipelineBlitter.new(paint,pixmap,mask)
  if(paint.anti_alias){

  }else{
    
  }

}
PixmapMut.prototype.stroke_path = function (path: Path,
  paint: Paint,
  stroke: Stroke,
  transform: Transform,
  mask?: Mask) {
  if (stroke.width < 0) {
    console.log("negative stroke width isn't allowed");
    return;
  }
  let res_scale = PathStroker.compute_resolution_scale(transform)
  let dash_path;
  if (!isUnDef(stroke.dash)) {
    dash_path = stroke.dash
  }
  // 如果stroke.width==1 就直接用hairline 绘制，否则用stroker绘制

  let coverage = treat_as_hairline(paint, stroke, transform)
  if (!isUnDef(coverage)) {
    paint = paint.clone()
    if (coverage == 1) {

    } else if (should_pre_scale_coverage(paint.blend_mode)) {
      let scale = (coverage as number) * 256;
      let new_alpha = 255 * scale
      paint.shader.apply_opacity(new_alpha)
    }
  }
  let tiler = DrawTiler.new(this.width, this.height);
  if (tiler) {
    path = path.clone()
    paint = paint.clone()
    if (!transform.is_identity()) {
      paint.shader.transform(transform)
      path = path.transform(transform)
    }

    for (let tile of tiler) {
      let ts = Transform.from_translate(-tile.x, -tile.y)
      path = path.transform(ts)
      paint.shader.transform(ts)
      let subpix = this.subpixmap(tile.to_int_rect())
      let submask = mask ? mask.submask(tile.to_int_rect()) : undefined
       this.stroke_hairline(path,paint,stroke.line_cap,subpix,submask)
    }
  }

}

function treat_as_hairline(paint: Paint, stroke: Stroke, ts: Transform) {
  const fast_len = (p: Point) => {
    let x = Math.abs(p.x)
    let y = Math.abs(p.y)
    if (x < y) {
      let tmp = x;
      x = y;
      y = tmp;
    }
    return x + y * 0.5;
  }
  if (stroke.width === 0) {
    return 1;
  }
  if (!paint.anti_alias) {
    return
  }
  ts.tx = 0
  ts.ty = 0
  let points = [
    Point.from_xy(stroke.width, 0),
    Point.from_xy(0, stroke.width)
  ]
  ts.map_points(points)
  let len0 = fast_len(points[0])
  let len1 = fast_len(points[1])
  if (len0 <= 1 && len1 <= 1) {
    return (len0 + len1) * 0.5
  }

}

export class Paint {
  static default() {
    const paint = new this()
    return paint
  }
  shader: Shader = Shader.createSolidColor(Color.BLACK)
  blend_mode: BlendMode = BlendMode.SourceOver
  anti_alias: boolean = true
  colorspace: ColorSpace = ColorSpace.Linear
  force_hq_pipeline: boolean = false

  copy(source: Paint) {
    this.shader = source.shader
    this.blend_mode = source.blend_mode
    this.anti_alias = source.anti_alias
    this.colorspace = source.colorspace
    this.force_hq_pipeline = source.force_hq_pipeline
    return this

  }
  clone() {
    return new Paint().copy(this)
  }
  is__solid_color(){
     return this.shader.type===Shader.SolidColor
  }
}


export class DrawTiler {
  static MAX_DIMENSIONS: u32 = 8192 - 1
  static required(image_width: u32, image_height: u32): bool {
    return image_width > this.MAX_DIMENSIONS || image_height > this.MAX_DIMENSIONS
  }
  static new(image_width: u32, image_height: u32): DrawTiler | undefined {
    if (this.required(image_width, image_height)) {
      const drawTiler = new this()
      drawTiler.image_width = image_width
      drawTiler.image_height = image_height
      return drawTiler
    }
  }
  image_width: u32 = 0
  image_height: u32 = 0
  x_offset: u32 = 0
  y_offset: u32 = 0
  finished: bool = false;
  *[Symbol.iterator]() {
    if (this.finished) {
      return
    }
    while (this.x_offset < this.image_width && this.y_offset < this.image_height) {
      let h = 0;
      if (this.y_offset < this.image_height) {
        h = Math.min(DrawTiler.MAX_DIMENSIONS, this.image_height - this.y_offset)

      } else {
        h = this.image_height
      }

      let r = Rect.from_xywh(this.x_offset, this.y_offset, Math.min(this.image_width - this.x_offset, DrawTiler.MAX_DIMENSIONS), h)
      this.x_offset += DrawTiler.MAX_DIMENSIONS
      if (this.x_offset >= this.image_width) {
        this.x_offset = 0
        this.y_offset += DrawTiler.MAX_DIMENSIONS
      }
      yield r
    }
  }
}