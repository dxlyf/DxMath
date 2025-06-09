import { Context } from "./ctx";
import { Dash, dash_path } from "./dash";
import { FT_Vector, RefValue } from "./ft/math";
import { FT_CURVE_TAG_CUBIC, FT_CURVE_TAG_ON, FT_Outline, FT_OUTLINE_EVEN_ODD_FILL, FT_OUTLINE_NONE, FT_RASTER_FLAG_AA, FT_RASTER_FLAG_CLIP, FT_RASTER_FLAG_DIRECT, FT_Raster_Params, FT_Raster_Render, FT_Span } from "./ft/raster";
import { FT_Stroker, FT_Stroker_LineCap, FT_Stroker_LineJoin } from "./ft/stroker";
import { Matrix, Point, Rect } from "./matrix";
import { FillRule, LineCap, LineJoin } from "./paint";
import { Path, PathElement } from "./path";
import { Rle } from "./rle";
import { Span } from "./span";
import { StrokeData } from "./stroke_data";
import {alignSize,FT_COORD, sqrt} from './util'


export function outline_init(outline:FT_Outline, ctx:Context, n_points:int, contours:int){
    let size_a=alignSize((n_points+contours)*Int32Array.BYTES_PER_ELEMENT*2)
    let size_b=alignSize((n_points+contours)*Int8Array.BYTES_PER_ELEMENT)
    let size_c=alignSize((contours)*Int32Array.BYTES_PER_ELEMENT)
    let size_d=alignSize((contours)*Int8Array.BYTES_PER_ELEMENT)
    let size_n= size_a + size_b + size_c + size_d;
    if(size_n>ctx.outline_size){
        ctx.outline_data=new Int8Array(size_n)
        ctx.outline_size=size_n
    }
    let data=ctx.outline_data

    outline.tags=[]
    outline.contours_flag=[]
    outline.points=[]
    outline.n_points=0
    outline.n_contours=0
    outline.contours=[]
    outline.flags=0

    if(data){
      
    }

}

export function outline_move_to(ft:FT_Outline, x:float64, y:float64)
{
	ft.points[ft.n_points]=FT_Vector.default()
	ft.points[ft.n_points].x = FT_COORD(x);
	ft.points[ft.n_points].y = FT_COORD(y);
	ft.tags[ft.n_points] = FT_CURVE_TAG_ON;
	if(ft.n_points)
	{
		// move代表新的新径开始
		// 记录上个移动的结束坐标
		ft.contours[ft.n_contours] = ft.n_points - 1;
		ft.n_contours++;
	}
	// 当前路径轮廓开始
	ft.contours_flag[ft.n_contours] = 1;
	ft.n_points++;
}

export function outline_line_to(ft:FT_Outline, x:float64, y:float64)
{
	ft.points[ft.n_points]=FT_Vector.default()
    ft.points[ft.n_points].x = FT_COORD(x);
	ft.points[ft.n_points].y = FT_COORD(y);
	ft.tags[ft.n_points] = FT_CURVE_TAG_ON;
	ft.n_points++;
}

export function outline_curve_to(ft:FT_Outline,x1:float64,y1:float64,x2:float64, y2:float64,x3:float64,y3:float64)
{
	ft.points[ft.n_points]=FT_Vector.default()
	ft.points[ft.n_points].x = FT_COORD(x1);
	ft.points[ft.n_points].y = FT_COORD(y1);
	ft.tags[ft.n_points] = FT_CURVE_TAG_CUBIC;
	ft.n_points++;

	ft.points[ft.n_points]=FT_Vector.default()
	ft.points[ft.n_points].x = FT_COORD(x2);
	ft.points[ft.n_points].y = FT_COORD(y2);
	ft.tags[ft.n_points] = FT_CURVE_TAG_CUBIC;
	ft.n_points++;

	ft.points[ft.n_points]=FT_Vector.default()
	ft.points[ft.n_points].x = FT_COORD(x3);
	ft.points[ft.n_points].y = FT_COORD(y3);
	ft.tags[ft.n_points] = FT_CURVE_TAG_ON;
	ft.n_points++;
}
export function outline_close( ft:FT_Outline)
{
	ft.contours_flag[ft.n_contours] = 0;
	let index = ft.n_contours ? ft.contours[ft.n_contours - 1] + 1 : 0;
	if(index == ft.n_points)
	{
		return;
	}
	ft.points[ft.n_points]=FT_Vector.default()
	ft.points[ft.n_points].x = ft.points[index].x;
	ft.points[ft.n_points].y = ft.points[index].y;
	ft.tags[ft.n_points] = FT_CURVE_TAG_ON;
	ft.n_points++;
}

export function outline_end( ft:FT_Outline)
{
	if(ft.n_points)
	{
		ft.contours[ft.n_contours] = ft.n_points - 1;
		ft.n_contours++;
	}
}

export function outline_convert(outline:FT_Outline,ctx:Context, path:Path,matrix:Matrix)
{
    
	outline_init(outline, ctx, path.points.length, path.contours);
	let elements = path.elements;
	let points = path.points,k=0;
	let p:Point[] = [Point.default(), Point.default(), Point.default()];
	for(let i = 0; i < path.elements.length; i++)
	{
		switch(elements[i])
		{
		case PathElement.MOVE_TO:
		
            matrix.mapPoint(points[k], p[0])
			outline_move_to(outline, p[0].x, p[0].y);
			k += 1;
			break;
		case PathElement.LINE_TO:
	        matrix.mapPoint(points[k], p[0])
			outline_line_to(outline, p[0].x, p[0].y);
            k += 1;
			break;
		case PathElement.CURVE_TO:
            matrix.mapPoint(points[k], p[0])
            matrix.mapPoint(points[k+1], p[1])
            matrix.mapPoint(points[k+2], p[2])

			outline_curve_to(outline, p[0].x, p[0].y, p[1].x, p[1].y, p[2].x, p[2].y);
			k += 3;
			break;
		case PathElement.CLOSE:
			outline_close(outline);
			k += 1;
			break;
		}
	}
	outline_end(outline);
}

export function outline_convert_dash(outline:FT_Outline,ctx:Context, path:Path, matrix:Matrix, dash:Dash)
{
	let  dashed = dash_path(dash, path);
	outline_convert(outline, ctx, dashed, matrix);
}

export function generation_callback(count:int,spans:FT_Span[],user:any){
    let rle=user as Rle
    for(let i=0;i<count;++i){
        let span=spans[i]
        rle.spans.push(new Span().copy(span as Span))
    }
}   

export function rasterize(ctx: Context, rle: Rle, path: Path, m: Matrix, clip: Rect, stroke: StrokeData | null, winding: FillRule) {

	let params = new FT_Raster_Params()
	params.flags = FT_RASTER_FLAG_DIRECT | FT_RASTER_FLAG_AA
	params.gray_spans = generation_callback
	params.user = rle
	if (clip) {
		params.flags |= FT_RASTER_FLAG_CLIP;
		params.clip_box.xMin = Math.trunc(clip.x);
		params.clip_box.yMin = Math.trunc(clip.y);
		params.clip_box.xMax = Math.trunc(clip.x + clip.w);
		params.clip_box.yMax = Math.trunc(clip.y + clip.h);
	}
	if (stroke) {
		let outline = FT_Outline.default()
		if (stroke.dash === null) {
			outline_convert(outline, ctx, path, m);
		} else {
			outline_convert_dash(outline, ctx, path, m, stroke.dash);
		}
		let ftCap: FT_Stroker_LineCap
		let ftJoin: FT_Stroker_LineJoin
		let ftWidth: FT_Fixed
		let ftMiterLimit: FT_Fixed

		let p1 = Point.create(0, 0)
		let p2 = Point.create(1.41421356237309504880, 1.41421356237309504880)
		let p3 = Point.default()

		m.mapPoint(p1, p1)
		m.mapPoint(p2, p2)
		p3.x = p2.x - p1.x;
		p3.y = p2.y - p1.y;

		let scale = sqrt(p3.x * p3.x + p3.y * p3.y) / 2.0;

		ftWidth = Math.trunc(stroke.width * scale * 0.5 * (1 << 6));
		ftMiterLimit = Math.trunc(stroke.miterlimit * (1 << 16));

		switch (stroke.cap) {
			case LineCap.SQUARE:
				ftCap = FT_Stroker_LineCap.FT_STROKER_LINECAP_SQUARE;
				break;
			case LineCap.ROUND:
				ftCap = FT_Stroker_LineCap.FT_STROKER_LINECAP_ROUND;
				break;
			default:
				ftCap = FT_Stroker_LineCap.FT_STROKER_LINECAP_BUTT;
				break;
		}
		switch (stroke.join) {
			case LineJoin.BEVEL:
				ftJoin = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_BEVEL;
				break;
			case LineJoin.ROUND:
				ftJoin = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_ROUND;
				break;
			default:
				ftJoin = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_MITER_FIXED;
				break;
		}
		let stroker=new FT_Stroker()
		stroker.set(ftWidth, ftCap, ftJoin, ftMiterLimit)
		stroker.parseOutline(outline)

		let points=RefValue.from(0)
		let contours=RefValue.from(0)
		stroker.getCounts(points,contours)

		outline_init(outline,ctx,points.value,contours.value)
		stroker.export(outline)
		stroker.done()

		outline.flags = FT_OUTLINE_NONE;
		params.source = outline;
	    FT_Raster_Render(params);
	}else{
		let outline = FT_Outline.default()
		outline_convert(outline, ctx, path, m);
		switch(winding)
		{
		case FillRule.EVEN_ODD:
			outline.flags = FT_OUTLINE_EVEN_ODD_FILL;
			break;
		default:
			outline.flags = FT_OUTLINE_NONE;
			break;
		}

		params.source = outline;
		FT_Raster_Render(params);
	}

	if(rle.spans.length == 0)
		{
			rle.x = 0;
			rle.y = 0;
			rle.w = 0;
			rle.h = 0;
			return;
		}
	
		let spans = rle.spans;
		let x1 = Number.MAX_SAFE_INTEGER;
		let y1 = spans[0].y;
		let x2 = 0;
		let y2 = spans[rle.spans.length - 1].y;
		for(let i = 0; i < rle.spans.length; i++)
		{
			if(spans[i].x < x1)
			   {
				x1 = spans[i].x;
			   }
			if(spans[i].x + spans[i].len > x2)
			   {
				x2 = spans[i].x + spans[i].len;
			   }
		}
	
		rle.x = x1;
		rle.y = y1;
		rle.w = x2 - x1;
		rle.h = y2 - y1 + 1;
}