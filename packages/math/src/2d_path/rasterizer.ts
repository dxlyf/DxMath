import { Vector2 } from '../math/vec2'
import { Matrix2D } from '../math/mat2d'
import { Path as PathBuilder } from './path'
import {PriorityQueue} from '../utils/priority_queue'
 function intersect(l0:Line, l1:Line) {
	return (l1.x0 - l0.x0) / (l0.m - l1.m);
}
class Line {
    static uid=0
    static default() {
        return new this()
    }
    m: number = 0
    x0: number = 0
    uid:number=0
    constructor()
    constructor(m: number, p: Vector2)
    constructor(p0: Vector2, p1: Vector2)
    constructor(x: number)
    constructor(...args: any[]) {
        this.uid=Line.uid++
        if (typeof args[0] === 'number' && args.length == 2) {
            this.m = args[0]
            this.x0 = args[1].x - this.m * args[1].y
        } else if (args.length == 2) {
            const p0: Vector2 = args[0], p1: Vector2 = args[1]

            this.m = (p1.x - p0.x) / (p1.y - p0.y)
            this.x0 = p0.x - this.m * p0.y
        } else if (args.length == 1) {
            this.m = 0
            this.x0 = args[0]
        }

    }
    getX(y: number) {
        return this.m * y + this.x0
    }
    copy(line: Line) {
        this.m = line.m
        this.x0 = line.x0
        return this
    }
    clone() {
        const p = new Line()
        p.m = this.m
        p.x0 = this.x0
        return p;
    }
}
class Segment {
    y0: number = 0
    y1: number = 0
    line = Line.default()
    constructor(p0: number, p1: number, line: Line)
    constructor(p0: Vector2, p1: Vector2)
    constructor(...args: any[]) {
        let y0: number = 0, y1: number = 0, line = Line.default()
        if (args.length == 3) {
            y0 = args[0]
            y1 = args[1]
            line.copy(args[2])
        } else if (args.length == 2) {
            y0 = args[0].y;
            y1 = args[1].y;
            line = new Line(args[0], args[1])
        }

        this.y0 = y0
        this.y1 = y1
        this.line.copy(line)

    }
};


export class Color {
    static rgb(r: number, g: number, b: number) {
        return new this(r / 255.0, g / 255.0, b / 255, 1)
    }
    static rgba(r: number, g: number, b: number, a: number) {
        return new this(r / 255.0, g / 255.0, b / 255, a / 255)
    }
    r: number = 0
    g: number = 0
    b: number = 0
    a: number = 1
    constructor(r: number, g: number, b: number, a: number)
    constructor()
    constructor(...args: any[]) {
        if (args.length == 4) {
            this.r = args[0]
            this.g = args[1]
            this.b = args[2]
            this.a = args[3] ?? 1;
        } else {
            this.r = 0
            this.g = 0
            this.b = 0
            this.a = 1
        }
    }
    copy(c: Color): Color {
        return this.set(c.r, c.g, c.b, c.a)
    }
    clone() {
        return new Color(this.r, this.g, this.b, this.a)
    }
    set(r: number, g: number, b: number, a: number = 1): Color {
        this.r = r
        this.g = g
        this.b = b
        this.a = a
        return this
    }
    add(c: Color) {
        return this.set(this.r + c.r,
            this.g + c.g,
            this.b + c.b,
            this.a + c.a)
    }
    mul(s: number) {
        return this.set(this.r * s, this.g * s, this.b * s, this.a * s)
    }
    unpremultiply() {
        return this.a == 0 ? new Color() : new Color(this.r / this.a, this.g / this.a, this.b / this.a, this.a);
    }
};

function blend(dst: Color, src: Color) {
    return src.clone().add(dst.clone().mul((1 - src.a)));
}
class Paint {
    static default() {
        return new this()
    }
    copy(P: any) {

    }
    evaluate(point: Vector2) {
        return new Color();
    }
}

class ColorPaint extends Paint {
    color = Color.rgb(0, 0, 0);
    constructor(color: Color) {
        super()
        this.color.copy(color);
    }
    copy(p: ColorPaint) {
        this.color.copy(p.color)
    }
    evaluate(point: Vector2) {
        return this.color;
    }
};

class Stop {
    color: Color = Color.rgb(0, 0, 0);
    pos: number = 0

    copy(s: Stop) {
        this.color.copy(s.color)
        this.pos = s.pos
        return this
    }
    clone() {
        return new Stop().copy(this)
    }
    lessThan(pos: number) {
        return this.pos < pos;
    }
};
function lowerBoundCustom<T, V>(arr: T[], target: V, compare: (a: T, b: V) => bool) {
    let low = 0;
    let high = arr.length;
    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (compare(arr[mid], target)) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}
class Gradient {
    stops: Stop[] = []
    constructor()
    constructor(stops: Stop[])
    constructor(...args: any[]) {
        if (args.length == 1) {
            this.stops = args[0]
        }

    }
    evaluate(pos: number): Color {
        // the stops need to be sorted
        if (this.stops.length <= 0) {
            return new Color();
        }
        const i = lowerBoundCustom<Stop, number>(this.stops, pos, (a, b) => a.lessThan(b));
        if (i == 0) {
            return this.stops[0].color;
        }
        if (i == this.stops.length - 1) {
            return this.stops[this.stops.length - 1].color;

        }
        const i0 = this.stops[i - 1];
        const factor = (pos - i0.pos) / (this.stops[i].pos - i0.pos);
        return i0.color.clone().mul((1 - factor)).add(this.stops[i].color.clone().mul(factor));
    }
};

class LinearGradient extends Gradient {
    start: Vector2 = Vector2.zero();
    end: Vector2 = Vector2.zero();
    constructor()
    constructor(start: Vector2, end: Vector2, stops: Stop[])
    constructor(...args: any[]) {
        super([])
        if (args.length == 2) {
            this.start.copy(args[0])
            this.end.copy(args[1])
            this.stops = args[2]

        } else {
            this.start.set(0, 0)
            this.end.set(1, 0)
        }
    }
    copy(g: LinearGradient) {
        this.start.copy(g.start);
        this.end.copy(g.end);
        this.stops = g.stops.map(d => d.clone())
    }
    evaluate(p: Vector2): Color {
        const d = this.end.clone().subtract(this.start);
        return super.evaluate(p.clone().sub(this.start).dot(d) / d.dot(d));
    }
};


class RadialGradient extends Gradient {
    static sq(x: number) {
        return x * x;
    }
    c = Vector2.zero()
    r: number = 0;
    f = Vector2.zero();
    fr = 0;
    constructor()
    constructor(c: Vector2, r: number, f: Vector2, fr: number, stops: Stop[])
    constructor(c: Vector2, r: number, f: Vector2, stops: Stop[])
    constructor(c: Vector2, r: number, stops: Stop[])
    constructor(...args: any[]) {
        super([])
        if (args.length === 0) {
            this.c.set(0.5, 0.5)
            this.r = 0.5
            this.f.set(0.5, 0.5)
            this.fr = 0

        } else if (args.length === 5) {
            this.c.copy(args[0])
            this.r = args[1]
            this.f.copy(args[2])
            this.fr = args[3]
            this.stops = args[4]

        } else if (args.length === 4) {
            this.c.copy(args[0])
            this.r = args[1]
            this.f.copy(args[2])
            this.fr = 0
            this.stops = args[3]
        } else if (args.length === 3) {
            this.c.copy(args[0])
            this.r = args[1]
            this.f.copy(this.c)
            this.fr = 0
            this.stops = args[2]
        }
    }
    evaluate(p: Vector2) {
        const f = this.f, c = this.c, fr = this.fr, r = this.r
        // solving for t in length(f + (c - f) * t - p) == fr + (r - fr) * t
        const A = RadialGradient.sq(c.x - f.x) + RadialGradient.sq(c.y - f.y) - RadialGradient.sq(r - fr);
        const B = RadialGradient.sq(c.x - f.x) * (f.x - p.x) + (c.y - f.y) * (f.y - p.y) - fr * (r - fr);
        const C = RadialGradient.sq(f.x - p.x) + RadialGradient.sq(f.y - p.y) - RadialGradient.sq(fr);
        // solving for t in A*A*t + 2*B*t + C == 0
        let t;
        if (A == 0) {
            if (B == 0) {
                return new Color();
            }
            else {
                t = -C / (2 * B);
            }
        }
        else {
            const D = RadialGradient.sq(B) - A * C;
            if (D < 0) {
                return new Color();
            }
            if (fr > r) {
                t = (-B + Math.sqrt(D)) / A;
            }
            else {
                t = (-B - Math.sqrt(D)) / A;
            }
        }
        return super.evaluate(t);
    }
};

class LinearGradientPaint extends Paint {
    gradient: LinearGradient
    constructor(gradient: LinearGradient) {
        super()
        this.gradient = gradient
    }
    evaluate(point: Vector2) {
        return this.gradient.evaluate(point);
    }
};

class RadialGradientPaint extends Paint {
    gradient: RadialGradient
    constructor(gradient: RadialGradient) {
        super()
        this.gradient = gradient
    }
    evaluate(point: Vector2) {
        return this.gradient.evaluate(point);
    }
};

class OpacityPaint extends Paint {
    paint: Paint
    opacity = 1
    constructor(paint: Paint, opacity: number) {
        super()
        this.paint = paint
        this.opacity = opacity
    }
    evaluate(point: Vector2) {
        return this.paint.evaluate(point).mul(this.opacity);
    }
};
class TransformationPaint extends Paint {
    paint: Paint
    transformation: Matrix2D = Matrix2D.identity()

    constructor(paint: Paint, transformation: Matrix2D) {
        super()
        this.paint = paint
        this.transformation = transformation
    }
    evaluate(point: Vector2) {
        return this.paint.evaluate(point.clone().applyMatrix2D(this.transformation));
    }
};


class PaintServer {
    get_paint(transformation: Matrix2D): any {
        return 0
    };
};

export class ColorPaintServer extends PaintServer {
    color = Color.rgb(0, 0, 0);
    constructor(color: Color) {
        super()
        this.color.copy(color)
    }
    get_paint(transformation: Matrix2D) {
        return new ColorPaint(this.color)
    }
};

class LinearGradientPaintServer extends PaintServer {
    gradient!: LinearGradient;
    constructor(gradient: LinearGradient) {
        super()
        this.gradient = gradient
    }
    get_paint(transformation: Matrix2D) {
        return new TransformationPaint(this.gradient,transformation.clone().invert()!)
    }
};
class RadialGradientPaintServer extends PaintServer {
    gradient!: RadialGradient;
    constructor(gradient: RadialGradient) {
        super()
        this.gradient = gradient
    }
    get_paint(transformation: Matrix2D) {
        return new TransformationPaint(this.gradient, transformation.clone().invert())
    }
};


export class Style {
    fill?: PaintServer;
    fill_opacity = 1;
    stroke?: PaintServer;
    stroke_width = 1;
    stroke_opacity = 1;
    get_fill_paint(transformation: Matrix2D = Matrix2D.identity()) {
        return new OpacityPaint(this.fill?.get_paint(transformation), this.fill_opacity);
    }
    get_stroke_paint(transformation: Matrix2D = Matrix2D.identity()) {
        return new OpacityPaint(this.stroke?.get_paint(transformation), this.stroke_opacity);
    }
};
class Shape {
    segments: Segment[] = []
    paint: Paint = Paint.default()
    constructor(paint: Paint) {
        this.paint=paint
    }

    appendSegment(p0: Vector2, p1: Vector2) {
        if (p0.y != p1.y) {
            this.segments.push(new Segment(p0, p1));
        }
    }
  
};


// class ShapeMap extends Map<Shape, number> {
//      modify(const Shape* shape, int direction) {
// 		auto iter = find(shape);
// 		if (iter != end()) {
// 			iter->second += direction;
// 			if (iter->second == 0) {
// 				erase(iter);
// 			}
// 		}
// 		else {
// 			insert(std::make_pair(shape, direction));
// 		}
// 	}
// 	 get_color(const Point& point) const {
// 		Color color;
// 		for (auto& pair: *this) {
// 			color = blend(color, pair.first->paint->evaluate(point));
// 		}
// 		return color;
// 	}
// };

class Pixmap {
    pixels: Uint8ClampedArray
    width: number
    height: number
    constructor(width: number, height: number) {
        this.width = width
        this.height = height
        this.pixels = new Uint8ClampedArray(width * height * 4)
    }
    getPixel(x: number, y: number) {
        let i = (y * this.width + x) * 4;
        return this.pixels[i];
    }
    setPixel(x: number, y: number, color: Color) {
        x=Math.round(x)
        y=Math.round(y)
        let i = (y * this.width + x) * 4;
        let src = Color.rgba(this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3])
        let newColor = src.add(color)

        this.pixels[i] = newColor.r * 255
        this.pixels[i + 1] = newColor.g * 255
        this.pixels[i + 2] = newColor.b * 255
        this.pixels[i + 3] = newColor.a * 255
    }
};

class SubPath {
    points: Vector2[] = []
    closed = false;
    static length(p: Vector2) {
        return p.length();
    }
    push_offset_segment(p0: Vector2, p1: Vector2, offset: number) {
        let d = p1.clone().sub(p0);
        let len = d.length()
        if (len == 0) {
            return;
        }
        d = d.multiplyScalar(offset / len)
        //	d = Vector2.create(-d.y, d.x);
        d.rotateCCW()
        this.points.push(p0.clone().add(d));
        this.points.push(p1.clone().add(d));
    }
}
export class Path extends PathBuilder {
    transformMatrix: Matrix2D = Matrix2D.identity()
    constructor() {
        super()
    }
    getSubPaths() {
        const subPaths: SubPath[] = []
        this.fatten().visit({
            moveTo: (d) => {
                subPaths.push(new SubPath())
                subPaths[subPaths.length - 1].points.push(d.p0)
            },
            lineTo: (d) => {
                subPaths[subPaths.length - 1].points.push(d.p0)
            },
            closePath: () => {
                subPaths[subPaths.length - 1].closed = true;
            }
        })
        return subPaths
    }

    fill_subpath(subpath: SubPath, shape: Shape) {
        const points = subpath.points.map(p => p.clone());
        this.transformMatrix.mapPoints(points, points)
        for (let i = 1; i < points.length; ++i) {
            shape.appendSegment(points[i - 1], points[i]);
        }
        shape.appendSegment(points[points.length - 1], points[0]);
    }
    fill(shapes: Shape[], paint: Paint) {

        shapes.push(new Shape(paint));
        let shape = shapes[shapes.length - 1];
        let subpaths=this.getSubPaths()
        for (const subpath of subpaths) {
            this.fill_subpath(subpath, shape);
        }
    }
    stroke(shapes: Shape[], width: number, paint: Paint) {

        shapes.push(new Shape(paint));
        let shape = shapes[shapes.length - 1];
		const  offset = width / 2;
        let subpaths=this.getSubPaths()
		for (const subpath of subpaths) {
			const  points = subpath.points;
			let new_subpath:SubPath=new SubPath();
			for (let i = 1; i < points.length; ++i) {
				new_subpath.push_offset_segment(points[i-1], points[i], offset);
			}
			if (subpath.closed) {
				new_subpath.push_offset_segment(points[points.length-1], points[0], offset);
				new_subpath.closed = true;
				this.fill_subpath(new_subpath, shape);
				new_subpath = new SubPath();
				new_subpath.push_offset_segment(points[0], points[points.length-1], offset);
			}
			for (let i = points.length - 1; i > 0; --i) {
				new_subpath.push_offset_segment(points[i], points[i-1], offset);
			}
			new_subpath.closed = true;
			this.fill_subpath(new_subpath, shape);
		}
    }
}

export class Document {
    shapes: Shape[] = []
    width = 0;
    height = 0;
    constructor(width:number, height:number) {
        this.width = width
        this.height = height


    }
    fill(path: Path, paint: Paint) {
        path.fill(this.shapes, paint);
    }
    stroke(path: Path, paint: Paint, width: number) {
        path.stroke(this.shapes, width, paint);
    }
    draw(path: Path, style: Style, transformation = Matrix2D.identity()) {
        if (style.fill && style.fill_opacity > 0) {
            this.fill(path, style.get_fill_paint(transformation));
        }
        if (style.stroke && style.stroke_width > 0 && style.stroke_opacity > 0) {
            this.stroke(path, style.get_stroke_paint(transformation), style.stroke_width);
        }
    }
};


class ShapeMap {
    map:Map<Shape,number>
    constructor() {
      this.map = new Map<Shape,number>(); // 使用 Map 存储形状及其计数
    }
  
    // 修改形状的计数（类似 C++ 的 modify 方法）
    modify(shape:Shape, direction:number) {
      if (this.map.has(shape)) {
        const currentCount = this.map.get(shape)!;
        const newCount = currentCount + direction;
        if (newCount === 0) {
          this.map.delete(shape); // 计数归零时删除
        } else {
          this.map.set(shape, newCount); // 更新计数
        }
      } else {
        this.map.set(shape, direction); // 新增形状
      }
    }
  
    // 计算混合颜色（类似 C++ 的 get_color 方法）
    getColor(point:Vector2) {
      let resultColor =  Color.rgb(0, 0, 0); // 初始化为透明黑色
      for (const [shape, count] of this.map) {
        if(count>0){
            const shapeColor = shape.paint.evaluate(point);
            // 根据实际混合算法调整下方逻辑
            resultColor = blend(resultColor, shapeColor);
        }
      }
      return resultColor;
    }
  
  }

// class ShapeMap extends Map<Shape,Shape> {
// 	 modify(shape:Shape,direction:number) {
// 		let iter = this.get(shape);
// 		if (iter != end()) {
// 			iter->second += direction;
// 			if (iter->second == 0) {
// 				erase(iter);
// 			}
// 		}
// 		else {
// 			insert(std::make_pair(shape, direction));
// 		}
// 	}
// 	 get_color( point:Vector2)  {
// 		let color:Color=Color.rgb(0,0,0);
// 		for (let pair of this.values()) {
// 			color = blend(color, pair.first.paint.evaluate(point));
// 		}
// 		return color;
// 	}
// };

class RasterizeLine extends Line {
	direction!:number;
	shape!:Shape;
    constructor()
    constructor(line:Line,direction:number,shape:Shape)
	constructor(...args:any[]){
        super()
        if(args.length==3){
            const line=args[0] as Line
            this.direction=args[1]
            this.shape=args[2]

            this.m=line.m
            this.x0=line.x0
        }
    }
    clone(){
        const line=new RasterizeLine()
        line.m=this.m
        line.x0=this.x0
        line.direction=this.direction;
        line.shape=this.shape;
        return line
    }
};

class Strip {
    y0:number;
    y1:number;
	lines:RasterizeLine[]=[]
	constructor( y0:number,y1:number){
        this.y0=y0
        this.y1=y1
    }
};

class Trapezoid {

	//    y1    --------
	//         /       /
	//        /       /
	//       /       /
	//    y0 --------
	//      x0 x1   x2 x3

	 y0:number=0;
     y1:number=0;
	 x0:number=0; 
     x1:number=0; 
     x2:number=0;
     x3:number=0;
	 constructor(y0:number,y1:number,x0:number,x1:number,x2:number,x3:number)
	 constructor(y0:number,y1:number,l0:Line,l1:Line)
     constructor(...args:any[]){
        if (args.length==6) {
            this.y0=args[0]
            this.y1=args[1]
            this.x0=args[2]
            this.x1=args[3]
            this.x2=args[4]
            this.x3=args[5]
        }
        else if (args.length==4) {
            this.y0=args[0]
            this.y1=args[1]
            this.x0=(args[2] as Line).getX(this.y0)

            this.x1=(args[2] as Line).getX(this.y1)
            this.x2=(args[3] as Line).getX(this.y0)
            this.x3=(args[3] as Line).getX(this.y1)
        }
     }
	 get_area() {
		return (this.y1 - this.y0) * (this.x2 + this.x3 - this.x0 - this.x1) * .5;
	}
};

function rasterize_pixel(trapezoid:Trapezoid, x:number) {
	// compute the intersection of the trapezoid and the pixel
	const y0 = trapezoid.y0;
	const y1 = trapezoid.y1;
	const x0 = trapezoid.x0;
	const x1 = trapezoid.x1;
	const x2 = trapezoid.x2;
	const x3 = trapezoid.x3;
	const x4 = x;
	const x5 = x + 1;

	// calculate the area assuming x4 >= x1 && x5 <= x2
	let area = y1 - y0;

	// and correct it if the assumtion is wrong
	if (x4 < x1) {
		const  l0=new Line(Vector2.create(x0, y0), Vector2.create(x1, y1));
		if (x4 < x0) {
			area -= new Trapezoid(y0, y1, x4, x4, x0, x1).get_area();
		}
		else {
			const  intersection = intersect(l0,new Line(x4));
			area -= new Trapezoid(intersection, y1, x4, x4, x4, x1).get_area();
		}
		if (x5 < x1) {
			const  intersection = intersect(l0, new Line(x5));
			area += new Trapezoid(intersection, y1, x5, x5, x5, x1).get_area();
		}
	}
	if (x5 > x2) {
		const  l1=new Line(Vector2.create(x2, y0), Vector2.create(x3, y1));
		if (x5 > x3) {
			area -= new Trapezoid(y0, y1, x2, x3, x5, x5).get_area();
		}
		else {
			const  intersection = intersect(l1, new Line(x5));
			area -= new Trapezoid(y0, intersection, x2, x5, x5, x5).get_area();
		}
		if (x4 > x2) {
			const  intersection = intersect(l1, new Line(x4));
			area += new Trapezoid(y0, intersection, x2, x4, x4, x4).get_area();
		}
	}

	return area;
}

function rasterize_row(strip:Strip,  pixmap:Pixmap, y:number) {
	let y0 = Math.max(y, strip.y0);
	let y1 = Math.min(y+1, strip.y1);
	let shapes:ShapeMap=new ShapeMap();
	for (let i = 1; i < strip.lines.length; ++i) {
		const  l0:RasterizeLine = strip.lines[i-1];
		shapes.modify(l0.shape, l0.direction);
		if (shapes.map.size>0) {
			const l1:RasterizeLine = strip.lines[i];
			let  trapezoid=new Trapezoid(y0, y1, l0, l1);
			if (trapezoid.x0 > trapezoid.x1){
        
                let tmp=trapezoid.x0
                trapezoid.x0=trapezoid.x1
                trapezoid.x1=tmp

            }
			if (trapezoid.x2 > trapezoid.x3) {
                let tmp=trapezoid.x2
                trapezoid.x2=trapezoid.x3
                trapezoid.x3=tmp
            }
			const  x0 = Math.max(trapezoid.x0, 0);
			const  x1 = Math.min(trapezoid.x3, pixmap.width - .5);
			for (let x = x0; x < x1; ++x) {
				const  factor = rasterize_pixel(trapezoid, x);
				const  color = shapes.getColor(Vector2.create(x+ .5, y + .5));
				pixmap.setPixel(x, y, color.mul(factor));
			}
		}
	}
}

function rasterize_strip(strip:Strip,pixmap:Pixmap) {
	const  y0 = Math.max(strip.y0, 0);
	const  y1 = Math.min(strip.y1, pixmap.height - .5);
	for (let y = y0; y < y1; ++y) {
		rasterize_row(strip, pixmap, y);
	}
}
enum  Type {
    LINE_START,
    LINE_END
};
class Event {
    static Type=Type
	type:Type;
	y:number=0;
	index:number;
	constructor(type:Type, y:number,index:number){
        this.type=type
        this.y=y;
        this.index=index
    }
	gt(event:Event) {
		return this.y > event.y;
	}

}
class PriorityQueue2<T> {
    heap: T[] = [];
    compare: (a: T, b: T) => boolean;
    constructor(compare = (a:T, b:T) => a < b) {
      this.heap= [];
      this.compare = compare; // 比较函数（默认最小堆）
    }
 
    top(){
        return this.heap[0]
    }
    // 获取堆顶元素（等效 top()）
    peek() {
      return this.heap.length > 0 ? this.heap[0] : null;
    }
  
    // 插入元素（自动维护堆结构）
    push(value:T) {
      this.heap.push(value);
      this._siftUp();
    }
  
    // 弹出堆顶元素（自动维护堆结构）
    pop() {
      if (this.heap.length === 0) return null;
      const top = this.heap[0];
      const last = this.heap.pop();
      if (this.heap.length > 0) {
        this.heap[0] = last;
        this._siftDown();
      }
      return top;
    }
  
    // 堆大小（等效 size()）
    size() {
      return this.heap.length;
    }
  
    // 堆是否为空（等效 empty()）
    isEmpty() {
      return this.heap.length === 0;
    }
  
    // 私有方法：上浮调整
    _siftUp() {
      let index = this.heap.length - 1;
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.compare(this.heap[index], this.heap[parentIndex])) {
          [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
          index = parentIndex;
        } else {
          break;
        }
      }
    }
  
    // 私有方法：下沉调整
    _siftDown() {
      let index = 0;
      const length = this.heap.length;
      while (true) {
        const leftChild = 2 * index + 1;
        const rightChild = 2 * index + 2;
        let swapIndex = null;
        
        // 找最小子节点（最小堆）
        if (leftChild < length) {
          if (this.compare(this.heap[leftChild], this.heap[index])) {
            swapIndex = leftChild;
          }
        }
        if (rightChild < length) {
          if (
            this.compare(this.heap[rightChild], this.heap[index]) &&
            (swapIndex === null || this.compare(this.heap[rightChild], this.heap[leftChild]))
          ) {
            swapIndex = rightChild;
          }
        }
        
        if (swapIndex === null) break;
        [this.heap[index], this.heap[swapIndex]] = [this.heap[swapIndex], this.heap[index]];
        index = swapIndex;
      }
    }
  }
export function rasterize(shapes:Shape[], width:number, height:number):Pixmap {
	// collect lines and events
	let lines:RasterizeLine[]=[];
	//std::priority_queue<Event, std::vector<Event>, std::greater<Event>> events;
    //let events:Event[]=[]

    const events = new PriorityQueue<Event>((a, b) =>b.gt(a)?-1:1);
	for (const shape of shapes) {
		for (const s of shape.segments) {
			const  index = lines.length;
			if (s.y0 < s.y1) {
				lines.push(new RasterizeLine(s.line, 1, shape));
				events.push(new Event(Event.Type.LINE_START, s.y0, index));
				events.push(new Event(Event.Type.LINE_END, s.y1, index));
			}
			else {
				lines.push(new RasterizeLine(s.line, -1, shape));
				events.push(new Event(Event.Type.LINE_START, s.y1, index));
				events.push(new Event(Event.Type.LINE_END, s.y0, index));
			}
		}
	}

	let pixmap=new Pixmap(width, height);
    
	let y = events.isEmpty()? 0 : events.top()!.y;
	let current_lines:RasterizeLine[]=[];
	while (!events.isEmpty()) {
		let event = events.top()!;
		events.pop();
		while (y < event.y) {
			current_lines.sort((l0:RasterizeLine,l1:RasterizeLine)=> {
				const x0 = l0.getX(y);
				const x1 = l1.getX(y);
				if (x0 == x1) {
					return l0.m -l1.m;
				}
				return x0-x1;
			});
			let next_y = event.y;
			// find intersections
			for (let i = 1; i < current_lines.length; ++i) {
				const  l0 = current_lines[i-1];
				const  l1 = current_lines[i];
				if (l0.m != l1.m) {
					const  intersection = intersect(l0, l1);
					if (y < intersection && intersection < next_y) {
						next_y = intersection;
					}
				}
			}
			let strip=new Strip(y, next_y);
			for (const  line of current_lines) {
				strip.lines.push(line);

			}
        
			rasterize_strip(strip, pixmap);
			y = next_y;
		}
		switch (event.type) {
		case Event.Type.LINE_START:
			current_lines.push(lines[event.index]);
			break;
		case Event.Type.LINE_END:
           let index=   current_lines.indexOf(lines[event.index])
			if(index!==-1){
               current_lines.splice(index,1)
              }
            // 方法2：条件查找（更通用的解决方案）
            // const targetLine=lines[event.index]
            // const index = current_lines.findIndex(line => 
            //     line.uid===targetLine.uid
            // );
            // if (index >= 0) {
            //     current_lines.splice(index, 1);
            // }
			break;
		}
	}
    return pixmap
}
