import { FT_Outline, FT_CURVE_TAG, FT_CURVE_TAG_CUBIC, FT_CURVE_TAG_CONIC, FT_CURVE_TAG_ON, FT_Raster_Params } from "./raster";
import { FT_Angle_Diff, FT_ANGLE_PI, FT_ANGLE_PI2, FT_Atan2, FT_BOOL, FT_Cos, FT_DivFix, FT_MulDiv, FT_MulFix, FT_Sin, FT_Tan, FT_Vector, FT_Vector_From_Polar, FT_Vector_Length, FT_Vector_Unit, PointerArray, RefValue } from "./math";

export const FT_SMALL_CONIC_THRESHOLD = (FT_ANGLE_PI / 6)
export const FT_SMALL_CUBIC_THRESHOLD = (FT_ANGLE_PI / 8)
export const FT_IS_SMALL = (x: number) => ((x) > -2 && (x) < 2);
export const FT_ARC_CUBIC_ANGLE = (FT_ANGLE_PI / 2)


export enum FT_StrokeTags {
	FT_STROKE_TAG_ON = 1,
	FT_STROKE_TAG_CUBIC = 2,
	FT_STROKE_TAG_BEGIN = 4,
	FT_STROKE_TAG_END = 8,
};
export const FT_STROKE_TAG_BEGIN_END = (FT_StrokeTags.FT_STROKE_TAG_BEGIN | FT_StrokeTags.FT_STROKE_TAG_END)

export enum FT_Stroker_LineJoin {
	FT_STROKER_LINEJOIN_ROUND = 0,
	FT_STROKER_LINEJOIN_BEVEL = 1,
	FT_STROKER_LINEJOIN_MITER_VARIABLE = 2,
	FT_STROKER_LINEJOIN_MITER = FT_STROKER_LINEJOIN_MITER_VARIABLE,
	FT_STROKER_LINEJOIN_MITER_FIXED = 3,
};

export enum FT_Stroker_LineCap {
	FT_STROKER_LINECAP_BUTT = 0,
	FT_STROKER_LINECAP_ROUND = 1,
	FT_STROKER_LINECAP_SQUARE = 2,
};

export enum FT_StrokerBorder {
	FT_STROKER_BORDER_LEFT = 0,
	FT_STROKER_BORDER_RIGHT = 1,
};

export function FT_SIDE_TO_ROTATE(s: number) {
	return (FT_ANGLE_PI2 - (s) * FT_ANGLE_PI)
}
export function ft_angle_mean(angle1: FT_Angle, angle2: FT_Angle) {
	return angle1 + FT_Angle_Diff(angle1, angle2) / 2;
}
export function ft_pos_abs(x: FT_Pos): FT_Pos {
	return x >= 0 ? x : -x;
}
export function ft_conic_split(base:PointerArray<FT_Vector>) {
	let a: FT_Fixed, b: FT_Fixed;

	base.get(4).x = base.get(2).x;
	a = base.get(0).x + base.get(1).x;
	b = base.get(1).x + base.get(2).x;
	base.get(3).x = b >> 1;
	base.get(2).x = (a + b) >> 2;
	base.get(1).x = a >> 1;

	base.get(4).y = base.get(2).y;
	a = base.get(0).y + base.get(1).y;
	b = base.get(1).y + base.get(2).y;
	base.get(3).y = b >> 1;
	base.get(2).y = (a + b) >> 2;
	base.get(1).y = a >> 1;
}


export function ft_conic_is_small_enough(base: PointerArray<FT_Vector>, angle_in: RefValue<FT_Angle>, angle_out: RefValue<FT_Angle>) {
	let d1 = FT_Vector.default(), d2 = FT_Vector.default();
	let theta: FT_Angle;
	let close1: FT_Bool, close2: FT_Bool;

	d1.x = base.get(1).x - base.get(2).x;
	d1.y = base.get(1).y - base.get(2).y;
	d2.x = base.get(0).x - base.get(1).x;
	d2.y = base.get(0).y - base.get(1).y;
	close1 = FT_IS_SMALL(d1.x) && FT_IS_SMALL(d1.y);
	close2 = FT_IS_SMALL(d2.x) && FT_IS_SMALL(d2.y);
	if (close1) {
		if (close2) {
		}
		else {
			angle_in.value = angle_out.value = FT_Atan2(d2.x, d2.y);
		}
	}
	else {
		if (close2) {
			angle_in.value = angle_out.value = FT_Atan2(d1.x, d1.y);
		}
		else {
			angle_in.value = FT_Atan2(d1.x, d1.y);
			angle_out.value = FT_Atan2(d2.x, d2.y);
		}
	}
	theta = ft_pos_abs(FT_Angle_Diff(angle_in.value, angle_out.value));
	return FT_BOOL(theta < FT_SMALL_CONIC_THRESHOLD);
}




export function ft_cubic_is_small_enough(base: PointerArray<FT_Vector>, angle_in: RefValue<FT_Angle>, angle_mid: RefValue<FT_Angle>, angle_out: RefValue<FT_Angle>) {
	let d1 = FT_Vector.default(), d2 = FT_Vector.default(), d3 = FT_Vector.default();
	let theta1, theta2;
	let close1, close2, close3;

	d1.x = base.get(2).x - base.get(3).x;
	d1.y = base.get(2).y - base.get(3).y;
	d2.x = base.get(1).x - base.get(2).x;
	d2.y = base.get(1).y - base.get(2).y;
	d3.x = base.get(0).x - base.get(1).x;
	d3.y = base.get(0).y - base.get(1).y;

	close1 = FT_IS_SMALL(d1.x) && FT_IS_SMALL(d1.y);
	close2 = FT_IS_SMALL(d2.x) && FT_IS_SMALL(d2.y);
	close3 = FT_IS_SMALL(d3.x) && FT_IS_SMALL(d3.y);

	if(close1)
		{
			if(close2)
			{
				if(close3)
				{
				}
				else
				{
					angle_in.value = angle_mid.value = angle_out.value = FT_Atan2(d3.x, d3.y);
				}
			}
			else
			{
				if(close3)
				{
					angle_in.value = angle_mid.value = angle_out.value  = FT_Atan2(d2.x, d2.y);
				}
				else
				{
					angle_in.value = angle_mid.value = FT_Atan2(d2.x, d2.y);
					angle_out.value =FT_Atan2(d3.x, d3.y);
				}
			}
		}
		else
		{
			if(close2)
			{
				if(close3)
				{
					angle_in.value = angle_mid.value = angle_out.value = FT_Atan2(d1.x, d1.y);
				}
				else
				{
					angle_in.value = FT_Atan2(d1.x, d1.y);
					angle_out.value = FT_Atan2(d3.x, d3.y);
					angle_mid.value = ft_angle_mean(angle_in.value, angle_out.value);
				}
			}
			else
			{
				if(close3)
				{
					angle_in.value = FT_Atan2(d1.x, d1.y);
					angle_mid.value = angle_out.value = FT_Atan2(d2.x, d2.y);
				}
				else
				{
					angle_in.value = FT_Atan2(d1.x, d1.y);
					angle_mid.value = FT_Atan2(d2.x, d2.y);
					angle_out.value = FT_Atan2(d3.x, d3.y);
				}
			}
		}
		theta1 = ft_pos_abs(FT_Angle_Diff(angle_in.value, angle_mid.value));
		theta2 = ft_pos_abs(FT_Angle_Diff(angle_mid.value, angle_out.value));
		return FT_BOOL(theta1 < FT_SMALL_CUBIC_THRESHOLD && theta2 < FT_SMALL_CUBIC_THRESHOLD);
}

export function ft_cubic_split(base: PointerArray<FT_Vector>) {
	let a, b, c;

	base.get(6).x = base.get(3).x;
	a = base.get(0).x + base.get(1).x;
	b = base.get(1).x + base.get(2).x;
	c = base.get(2).x + base.get(3).x;
	base.get(5).x = c >> 1;
	c += b;
	base.get(4).x = c >> 2;
	base.get(1).x = a >> 1;
	a += b;
	base.get(2).x = a >> 2;
	base.get(3).x = (a + c) >> 3;

	base.get(6).y = base.get(3).y;
	a = base.get(0).y + base.get(1).y;
	b = base.get(1).y + base.get(2).y;
	c = base.get(2).y + base.get(3).y;
	base.get(5).y = c >> 1;
	c += b;
	base.get(4).y = c >> 2;
	base.get(1).y = a >> 1;
	a += b;
	base.get(2).y = a >> 2;
	base.get(3).y = (a + c) >> 3;
}

export class FT_StrokeBorderRec {
	num_points: FT_UInt = 0;
	max_points: FT_UInt = 0;
	points: FT_Vector[] = [];
	tags: FT_Byte[] = [];
	movable: FT_Bool = 0;
	start: FT_Int = -1;
	valid: FT_Bool = 0;

	moveTo(to: FT_Vector) {
		if (this.start >= 0) {
			this.close(0)
		}
		this.start = this.num_points
		this.movable = 0
		return this.lineTo(to, 0)
	}
	lineTo(to: FT_Vector, movable: FT_Bool) {
		let error: FT_Error = 0
		if (this.movable) {
			this.points[this.num_points - 1] = to.clone()
		} else {
			if (this.num_points > 0
				&& FT_IS_SMALL(this.points[this.num_points - 1].x - to.x)
				&& FT_IS_SMALL(this.points[this.num_points - 1].y - to.y)
			) {
				return error
			}

			this.points[this.num_points] = to.clone()
			this.tags[this.tags.length] = FT_CURVE_TAG_ON
			this.num_points += 1;
		}
		this.movable = movable;
		return error;
	}
	conicTo(control: FT_Vector, to: FT_Vector): FT_Error
	conicTo(control1: FT_Vector, control2: FT_Vector, to?: FT_Vector): FT_Error {
		let border = this
		if (to) {
			let error = 0;

			border.points.push(control1.clone())
			border.points.push(control2.clone())
			border.points.push(to.clone())

			border.tags.push(FT_StrokeTags.FT_STROKE_TAG_CUBIC)
			border.tags.push(FT_StrokeTags.FT_STROKE_TAG_CUBIC)
			border.tags.push(FT_StrokeTags.FT_STROKE_TAG_ON)

			border.num_points += 3;

			border.movable = false;
			return error;
		} else {
			let error = 0;

			border.points.push(control1.clone())
			border.points.push(control2.clone())

			border.tags.push(0)
			border.tags.push(FT_StrokeTags.FT_STROKE_TAG_ON)

			border.num_points += 2;

			border.movable = false;
			return error;
		}
	}
	close(reverse: FT_Bool) {
		const border = this
		let start = border.start;
		let count = border.num_points;

		if (count <= start + 1) {
			border.num_points = start;
		}
		else {
			border.num_points = --count;
			border.points[start] = border.points[count];
			border.tags[start] = border.tags[count];
			if (reverse) {
				{

					let i = start + 1
					let k = count - 1
					let tmp = FT_Vector.default();
					for (; i < k; i++, k--) {
						tmp.copy(border.points[i])
						border.points[i].copy(border.points[k])
						border.points[k].copy(tmp)
					}
				}
				{


					let i = start + 1
					let k = count - 1
					let tmp = 0;
					for (; i < k; i++, k--) {
						tmp = border.tags[i]
						border.tags[i] = border.tags[k]
						border.tags[k] = tmp
					}


				}
			}
			border.tags[start] |= FT_StrokeTags.FT_STROKE_TAG_BEGIN;
			border.tags[count - 1] |= FT_StrokeTags.FT_STROKE_TAG_END;
		}
		border.start = -1;
		border.movable = 0;
	}
	cubicTo(control1: FT_Vector, control2: FT_Vector, to: FT_Vector): FT_Error {
		let error: FT_Error = 0;
		// this.points[this.num_points] = control1.clone();
		// this.points[this.num_points+1] = control2.clone();
		// this.points[this.num_points+2] = to.clone();

		// this.tags[this.num_points] = FT_StrokeTags.FT_STROKE_TAG_CUBIC;
		// this.tags[this.num_points + 1] = FT_StrokeTags.FT_STROKE_TAG_CUBIC;
		// this.tags[this.num_points + 2] = FT_StrokeTags.FT_STROKE_TAG_ON;
		this.points.push(control1.clone())
		this.points.push(control2.clone())
		this.points.push(to.clone())

		this.tags.push(FT_StrokeTags.FT_STROKE_TAG_CUBIC)
		this.tags.push(FT_StrokeTags.FT_STROKE_TAG_CUBIC)
		this.tags.push(FT_StrokeTags.FT_STROKE_TAG_ON)

		this.num_points += 3;
		this.movable = 0;
		return error;

	}
	arcTo(center: FT_Vector, radius: FT_Fixed, angle_start: FT_Angle, angle_diff: FT_Angle) {
		let coef: FT_Fixed = 0;
		let a0 = FT_Vector.default(), a1 = FT_Vector.default(), a2 = FT_Vector.default(), a3 = FT_Vector.default();
		let i: FT_Int = 0, arcs: FT_Int = 1;
		let error: FT_Error = 0;

		while (angle_diff > FT_ARC_CUBIC_ANGLE * arcs || -angle_diff > FT_ARC_CUBIC_ANGLE * arcs) {
			arcs++;
		}

		coef = FT_Tan(angle_diff / (4 * arcs));
		coef += (coef / 3)>>0;
		FT_Vector_From_Polar(a0, radius, angle_start);
		a1.x = FT_MulFix(-a0.y, coef);
		a1.y = FT_MulFix(a0.x, coef);
		a0.x += center.x;
		a0.y += center.y;
		a1.x += a0.x;
		a1.y += a0.y;
		for (i = 1; i <= arcs; i++) {
			FT_Vector_From_Polar(a3, radius, angle_start + i * angle_diff / arcs);
			a2.x = FT_MulFix(a3.y, coef);
			a2.y = FT_MulFix(-a3.x, coef);
			a3.x += center.x;
			a3.y += center.y;
			a2.x += a3.x;
			a2.y += a3.y;
			error = this.cubicTo(a1, a2, a3);
			if (error) {
				break;
			}
			a1.x = a3.x - a2.x + a3.x;
			a1.y = a3.y - a2.y + a3.y;
		}
		return error;
	}
	reset() {

		this.num_points = 0
		this.start = -1
		this.valid = 0
	}
	done() {
		this.points = []
		this.tags = []
		this.num_points = 0
		this.max_points = 0
		this.start = -1
		this.valid = 0



	}
	export(outline: FT_Outline) {
		let border = this
		if (outline.points && this.points) {
			//memcpy(outline.points + outline.n_points, border.points, border.num_points * sizeof(FT_Vector));
			outline.points.push(...border.points.slice(0, border.num_points));
		}
		if (outline.tags) {
			let count = border.num_points;
			let read = PointerArray.from(border.tags);
			//let write = PointerArray.from(outline.tags).move(outline.n_points);
			for (; count > 0; count--, read.next()) {
				if (read.value & FT_StrokeTags.FT_STROKE_TAG_ON) {
					outline.tags.push(FT_CURVE_TAG_ON)
				}

				else if (read.value & FT_StrokeTags.FT_STROKE_TAG_CUBIC) {
					outline.tags.push(FT_CURVE_TAG_CUBIC)
				}
				else {
					outline.tags.push(FT_CURVE_TAG_CONIC)

				}
			}
		}
		if (outline.contours) {
			let count = border.num_points;
			let tags = PointerArray.from(border.tags);
			//let write = PointerArray.from(outline.contours).move(outline.n_contours);
			let idx = outline.n_points;
			for (; count > 0; count--, tags.next(), idx++) {
				if (tags.value & FT_StrokeTags.FT_STROKE_TAG_END) {
					outline.contours.push(idx)
					outline.n_contours++;
				}
			}
		}
		outline.n_points = (outline.n_points + border.num_points);
		outline.check()
	}
	getCounts(anum_points: RefValue<FT_UInt>, anum_contours: RefValue<FT_UInt>) {
		let border = this
		let error = 0;
		let num_points = 0;
		let num_contours = 0;
		let count = border.num_points;
		let point = PointerArray.from(border.points);
		let tags = PointerArray.from(border.tags);
		let in_contour = 0;

		for (; count > 0; count--, num_points++, point.next(), tags.next()) {
			if (tags.get(0) & FT_StrokeTags.FT_STROKE_TAG_BEGIN) {
				if (in_contour != 0) {
					num_points = 0;
					num_contours = 0;
					break
				}
				in_contour = 1;
			}
			else if (in_contour == 0) {
				num_points = 0;
				num_contours = 0;
				break
			}
			if (tags.get(0) & FT_StrokeTags.FT_STROKE_TAG_END) {
				in_contour = 0;
				num_contours++;
			}
		}
		if (in_contour != 0) {
			num_points = 0;
			num_contours = 0;
		}
		border.valid = true;

		anum_points.value = num_points;
		anum_contours.value = num_contours;
		return error;
	}
}

export const FT_StrokeBorder = FT_StrokeBorderRec
export class FT_Stroker {
	angle_in: FT_Angle = 0;
	angle_out: FT_Angle = 0;
	center: FT_Vector = FT_Vector.default();
	line_length: FT_Fixed = 0;
	first_point: FT_Bool = 0;
	subpath_open: FT_Bool = 0;
	subpath_angle: FT_Angle = 0;
	subpath_start = FT_Vector.default();
	subpath_line_length: FT_Fixed = 0;
	handle_wide_strokes: FT_Bool = 0;
	line_cap: FT_Stroker_LineCap = FT_Stroker_LineCap.FT_STROKER_LINECAP_BUTT;
	line_join: FT_Stroker_LineJoin = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_MITER;
	line_join_saved: FT_Stroker_LineJoin = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_MITER;
	miter_limit: FT_Fixed = 10;
	radius: FT_Fixed = 0;
	borders: FT_StrokeBorderRec[] = [];
	constructor() {
		this.borders = [new FT_StrokeBorderRec(), new FT_StrokeBorderRec()]

	}
	set(radius: FT_Fixed, line_cap: FT_Stroker_LineCap, line_join: FT_Stroker_LineJoin, miter_limit: FT_Fixed): void {
		this.radius = radius;
		this.line_cap = line_cap;
		this.line_join = line_join;
		this.miter_limit = miter_limit;
		if (this.miter_limit < 0x10000) {
			this.miter_limit = 0x10000;
		}
		this.line_join_saved = line_join
		this.rewind()
	}
	rewind() {
		this.borders[0].reset();
		this.borders[1].reset();

	}
	done() {
		this.borders[0].done();
		this.borders[1].done();
	}
	// arcTo(side: FT_Int) {
	// 	let stroker = this
	// 	let total: FT_Angle = 0, rotate: FT_Angle = 0;
	// 	let radius = stroker.radius;
	// 	let error: FT_Error = 0;
	// 	let border = stroker.borders[side];

	// 	rotate = FT_SIDE_TO_ROTATE(side);
	// 	total = FT_Angle_Diff(stroker.angle_in, stroker.angle_out);
	// 	if (total == FT_ANGLE_PI)
	// 		total = -rotate * 2;
	// 	error = border.arcTo(stroker.center, radius, stroker.angle_in + rotate, total);
	// 	border.movable = 0;
	// 	return error;
	// }
	cap(angle: FT_Angle, side: FT_Int) {
		let error = 0;
		let stroker = this
		if (stroker.line_cap == FT_Stroker_LineCap.FT_STROKER_LINECAP_ROUND) {
			stroker.angle_in = angle;
			stroker.angle_out = angle + FT_ANGLE_PI;
			error = stroker.arcTo(side);
		}
		else {
			let middle = FT_Vector.default(), delta = FT_Vector.default();
			let radius = stroker.radius;
			let border = stroker.borders[side];
			FT_Vector_From_Polar(middle, radius, angle);
			delta.x = side ? middle.y : -middle.y;
			delta.y = side ? -middle.x : middle.x;
			if (stroker.line_cap == FT_Stroker_LineCap.FT_STROKER_LINECAP_SQUARE) {
				middle.x += stroker.center.x;
				middle.y += stroker.center.y;
			}
			else {
				middle.x = stroker.center.x;
				middle.y = stroker.center.y;
			}
			delta.x += middle.x;
			delta.y += middle.y;
			error = border.lineTo(delta, 0)
			if (error) {
				return error
			}
			delta.x = middle.x - delta.x + middle.x;
			delta.y = middle.y - delta.y + middle.y;
			error = border.lineTo(delta, 0);
		}
		return error;
	}
	inside(side: FT_Int, line_length: FT_Fixed) {
		let stroker = this
		let border = stroker.borders[side];
		let phi: FT_Angle = 0, theta: FT_Angle = 0, rotate: FT_Angle = 0;
		let length: FT_Fixed = 0;
		let sigma = FT_Vector.default();
		let delta = FT_Vector.default();
		let error: FT_Error = 0;
		let intersect: FT_Bool = 0;

		rotate = FT_SIDE_TO_ROTATE(side);
		theta = FT_Angle_Diff(stroker.angle_in, stroker.angle_out) / 2;
		if (!border.movable || line_length == 0 || theta > 0x59C000 || theta < -0x59C000)
			intersect = 0;
		else {
			let min_length: FT_Fixed = 0;
			FT_Vector_Unit(sigma, theta);
			min_length = ft_pos_abs(FT_MulDiv(stroker.radius, sigma.y, sigma.x));
			intersect = FT_BOOL(!!min_length && stroker.line_length >= min_length && line_length >= min_length);
		}
		if (!intersect) {
			FT_Vector_From_Polar(delta, stroker.radius, stroker.angle_out + rotate);
			delta.x += stroker.center.x;
			delta.y += stroker.center.y;
			border.movable = 0;
		}
		else {
			phi = stroker.angle_in + theta + rotate;
			length = FT_DivFix(stroker.radius, sigma.x);
			FT_Vector_From_Polar(delta, length, phi);
			delta.x += stroker.center.x;
			delta.y += stroker.center.y;
		}
		error = border.lineTo(delta, 0);
		return error;
	}
	outside(side: FT_Int, line_length: FT_Fixed) {
		let stroker = this
		let border = stroker.borders[side];
		let error: FT_Error = 0;
		let rotate: FT_Angle = 0;

		if (stroker.line_join == FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_ROUND)
			error = stroker.arcTo(side);
		else {
			let radius = stroker.radius;
			let sigma = FT_Vector.default();
			let theta: FT_Angle = 0, phi: FT_Angle = 0;
			let bevel: FT_Bool = 0, fixed_bevel: FT_Bool = 0;

			rotate = FT_SIDE_TO_ROTATE(side);
			bevel = FT_BOOL(stroker.line_join == FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_BEVEL);
			fixed_bevel = FT_BOOL(stroker.line_join != FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_MITER_VARIABLE);

			if (!bevel) {
				theta = FT_Angle_Diff(stroker.angle_in, stroker.angle_out) / 2;
				if (theta == FT_ANGLE_PI2)
					theta = -rotate;
				phi = stroker.angle_in + theta + rotate;
				FT_Vector_From_Polar(sigma, stroker.miter_limit, theta);
				if (sigma.x < 0x10000) {
					if (fixed_bevel || ft_pos_abs(theta) > 57)
						bevel = 1;
				}
			}
			if (bevel) {
				if (fixed_bevel) {
					let delta = FT_Vector.default();
					FT_Vector_From_Polar(delta, radius, stroker.angle_out + rotate);
					delta.x += stroker.center.x;
					delta.y += stroker.center.y;
					border.movable = 0;
					error = border.lineTo(delta, 0);
				}
				else {
					let middle = FT_Vector.default(), delta = FT_Vector.default();
					let coef: FT_Fixed;

					FT_Vector_From_Polar(middle, FT_MulFix(radius, stroker.miter_limit), phi);
					coef = FT_DivFix(0x10000 - sigma.x, sigma.y);
					delta.x = FT_MulFix(middle.y, coef);
					delta.y = FT_MulFix(-middle.x, coef);
					middle.x += stroker.center.x;
					middle.y += stroker.center.y;
					delta.x += middle.x;
					delta.y += middle.y;
					error = border.lineTo(delta, 0);
					if (error)
						return error;
					delta.x = middle.x - delta.x + middle.x;
					delta.y = middle.y - delta.y + middle.y;
					error = border.lineTo(delta, 0);
					if (error)
						return error;
					if (line_length == 0) {
						FT_Vector_From_Polar(delta, radius, stroker.angle_out + rotate);
						delta.x += stroker.center.x;
						delta.y += stroker.center.y;
						error = border.lineTo(delta, 0);
					}
				}
			}
			else {
				let length: FT_Fixed;
				let delta = FT_Vector.default();
				length = FT_MulDiv(stroker.radius, stroker.miter_limit, sigma.x);
				FT_Vector_From_Polar(delta, length, phi);
				delta.x += stroker.center.x;
				delta.y += stroker.center.y;
				error = border.lineTo(delta, 0);
				if (error)
					return error;
				if (line_length == 0) {
					FT_Vector_From_Polar(delta, stroker.radius, stroker.angle_out + rotate);
					delta.x += stroker.center.x;
					delta.y += stroker.center.y;
					error = border.lineTo(delta, 0);
				}
			}
		}
		return error;
	}

	reverseLeft(open: FT_Bool) {
		let stroker = this
		let right = stroker.borders[0];
		let left = stroker.borders[1];
		let new_points = 0;
		let error = 0;

		new_points = left.num_points - left.start;
		if (new_points > 0) {
			{
				//	let dst_point = PointerArray.from(right.points).move(right.num_points);
				//let dst_tag = PointerArray.from(right.tags).move(right.num_points);
				let src_point = PointerArray.from(left.points).move(left.num_points - 1);
				let src_tag = PointerArray.from(left.tags).move(left.num_points - 1);
				while (src_point.curIndex >= left.start) {
					//dst_point.value.copy(src_point.value);
					right.points.push(src_point.value.clone());
					//dst_tag.value = src_tag.value;
					right.tags.push(src_tag.value);
					if (open)
						right.tags[right.tags.length - 1] &= ~FT_STROKE_TAG_BEGIN_END;
					else {
						let ttag = (right.tags[right.tags.length - 1] & FT_STROKE_TAG_BEGIN_END);
						if (ttag == FT_StrokeTags.FT_STROKE_TAG_BEGIN || ttag == FT_StrokeTags.FT_STROKE_TAG_END) {
							right.tags[right.tags.length - 1] ^= FT_STROKE_TAG_BEGIN_END;
						}
					}
					src_point.prev();
					src_tag.prev();
					//dst_point.next();
					//dst_tag.next();
				}
			}
			left.num_points = left.start;
			right.num_points += new_points;
			right.movable = 0;
			left.movable = 0;
		}
		return error;
	}
	cubicTo(control1: FT_Vector, control2: FT_Vector, to: FT_Vector): FT_Error {
		const stroker = this
		let error = 0;
		let bez_stack = new Array(37).fill(0).map(() => FT_Vector.default());
		let arc = PointerArray.from(bez_stack);
		let limit = PointerArray.from(bez_stack).move(32);
		let first_arc = true;

		if (FT_IS_SMALL(stroker.center.x - control1.x) &&
			FT_IS_SMALL(stroker.center.y - control1.y) &&
			FT_IS_SMALL(control1.x - control2.x) &&
			FT_IS_SMALL(control1.y - control2.y) &&
			FT_IS_SMALL(control2.x - to.x) &&
			FT_IS_SMALL(control2.y - to.y)) {
			stroker.center.copy(to);
			return error
		}

		arc.get(0).copy(to);
		arc.get(1).copy(control2);
		arc.get(2).copy(control1);
		arc.get(3).copy(stroker.center);
		while (arc.curIndex >= 0) {
			let angle_in = RefValue.from(0), angle_mid = RefValue.from(0), angle_out = RefValue.from(0);
			angle_in.value = angle_out.value = angle_mid.value = stroker.angle_in;
			if (arc.curIndex < limit.curIndex && !ft_cubic_is_small_enough(arc, angle_in, angle_mid, angle_out)) {
				if (stroker.first_point) {
					stroker.angle_in = angle_in.value;
				}
				ft_cubic_split(arc);
				arc.next(3);
				continue;
			}
			if (first_arc) {
				first_arc = false;
				if (stroker.first_point)
					error = stroker.subpathStart(angle_in.value, 0);
				else {
					stroker.angle_out = angle_in.value;
					error = stroker.processCorner(0);
				}
			}
			else if (ft_pos_abs(FT_Angle_Diff(stroker.angle_in, angle_in.value)) > FT_SMALL_CUBIC_THRESHOLD / 4) {
				stroker.center.copy(arc.get(3));
				stroker.angle_out = angle_in.value;
				stroker.line_join = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_ROUND;
				error = stroker.processCorner(0);
				stroker.line_join = stroker.line_join_saved;
			}
			if (error) {
				return error
			}
			{
				let ctrl1 = FT_Vector.default(), ctrl2 = FT_Vector.default(), end = FT_Vector.default();
				let theta1, phi1, theta2, phi2, rotate, alpha0 = 0;
				let length1, length2;
				let border;
				let side;

				theta1 = FT_Angle_Diff(angle_in.value, angle_mid.value) / 2;
				theta2 = FT_Angle_Diff(angle_mid.value, angle_out.value) / 2;
				phi1 = ft_angle_mean(angle_in.value, angle_mid.value);
				phi2 = ft_angle_mean(angle_mid.value, angle_out.value);
				length1 = FT_DivFix(stroker.radius, FT_Cos(theta1));
				length2 = FT_DivFix(stroker.radius, FT_Cos(theta2));
				if (stroker.handle_wide_strokes) {
					alpha0 = FT_Atan2(arc.get(0).x - arc.get(3).x, arc.get(0).y - arc.get(3).y);
				}
				let bordersIndex = 0
				for (side = 0; side <= 1; side++, bordersIndex++) {
					border = stroker.borders[bordersIndex]
					rotate = FT_SIDE_TO_ROTATE(side);
					FT_Vector_From_Polar(ctrl1, length1, phi1 + rotate);
					ctrl1.x += arc.get(2).x;
					ctrl1.y += arc.get(2).y;
					FT_Vector_From_Polar(ctrl2, length2, phi2 + rotate);
					ctrl2.x += arc.get(1).x;
					ctrl2.y += arc.get(1).y;
					FT_Vector_From_Polar(end, stroker.radius, angle_out.value + rotate);
					end.x += arc.get(0).x;
					end.y += arc.get(0).y;
					if (stroker.handle_wide_strokes) {
						let start = FT_Vector.default();
						let alpha1;
						start = border.points[border.num_points - 1];
						alpha1 = FT_Atan2(end.x - start.x, end.y - start.y);
						if (ft_pos_abs(FT_Angle_Diff(alpha0, alpha1)) >
							FT_ANGLE_PI / 2) {
							let beta, gamma;
							let bvec = FT_Vector.default(), delta = FT_Vector.default();
							let blen, sinA, sinB, alen;
							beta = FT_Atan2(arc.get(3).x - start.x, arc.get(3).y - start.y);
							gamma = FT_Atan2(arc.get(0).x - end.x, arc.get(0).y - end.y);
							bvec.x = end.x - start.x;
							bvec.y = end.y - start.y;
							blen = FT_Vector_Length(bvec);
							sinA = ft_pos_abs(FT_Sin(alpha1 - gamma));
							sinB = ft_pos_abs(FT_Sin(beta - gamma));
							alen = FT_MulDiv(blen, sinA, sinB);
							FT_Vector_From_Polar(delta, alen, beta);
							delta.x += start.x;
							delta.y += start.y;
							border.movable = false;
							error = border.lineTo(delta, false);
							if (error) {
								return error
							}
							error = border.lineTo(end, false);
							if (error) {
								return error
							}
							error = border.cubicTo(ctrl2, ctrl1, start);
							if (error) {
								return error
							}
							error = border.lineTo(end, false);
							if (error) {
								return error
							}
							continue;
						}
					}
					error = border.cubicTo(ctrl1, ctrl2, end);
					if (error) {
						return error
					}
				}
			}
			arc.prev(3);
			stroker.angle_in = angle_out.value;
		}
		stroker.center.copy(to)
		stroker.line_length = 0;
		return error;
	}

	// corner(line_length: FT_Fixed) {
	// 	let stroker = this
	// 	let error = 0;
	// 	let turn;
	// 	let inside_side;

	// 	turn = FT_Angle_Diff(stroker.angle_in, stroker.angle_out);
	// 	if (turn == 0)
	// 		return error
	// 	inside_side = 0;
	// 	if (turn < 0)
	// 		inside_side = 1;
	// 	error = stroker.inside(inside_side, line_length);
	// 	if (error)
	// 		return error
	// 	error = stroker.outside(1 - inside_side, line_length);
	// 	Exit:
	// 	return error;
	// }
	lineTo(to: FT_Vector): FT_Error {
		let stroker = this
		let error = 0;
		let border: FT_StrokeBorderRec;
		let delta: FT_Vector = FT_Vector.default();
		let angle: FT_Angle;
		let side: FT_Int;
		let line_length: FT_Fixed;

		delta.x = to.x - stroker.center.x;
		delta.y = to.y - stroker.center.y;
		if (delta.x == 0 && delta.y == 0)
			return error
		line_length = FT_Vector_Length(delta);
		angle = FT_Atan2(delta.x, delta.y);
		FT_Vector_From_Polar(delta, stroker.radius, angle + FT_ANGLE_PI2);
		if (stroker.first_point) {
			error = stroker.subpathStart(angle, line_length);
			if (error)
				return error;
		}
		else {
			stroker.angle_out = angle;
			error = stroker.processCorner(line_length);
			if (error)
				return error
		}

		for (let border = PointerArray.from(stroker.borders), side = 1; side >= 0; side--, border.next()) {
			let point = FT_Vector.default();
			point.x = to.x + delta.x;
			point.y = to.y + delta.y;
			error = border.value.lineTo(point, 1);
			if (error)
				return error
			delta.x = -delta.x;
			delta.y = -delta.y;
		}
		stroker.angle_in = angle;
		stroker.center.copy(to);
		stroker.line_length = line_length;
		return error;
	}
	conicTo(control1: FT_Vector, to: FT_Vector): FT_Error;
	conicTo(control1: FT_Vector, control2: FT_Vector, to: FT_Vector): FT_Error;
	conicTo(control1: FT_Vector, control2OrTo: FT_Vector, to?: FT_Vector): FT_Error {
		if (to) {
			return this.conicTo3(control1, control2OrTo, to);
		} else {
			return this.conicTo2(control1, control2OrTo);
		}
	}
	conicTo2(control: FT_Vector, to: FT_Vector) {
		const stroker = this
		let error = 0;
		let bez_stack = new Array(34).fill(0).map(() => FT_Vector.default());
		let arc = PointerArray.from(bez_stack);
		let limit = 30;
		let first_arc = true;

		function Exit() {
			return error
		}
		if (FT_IS_SMALL(stroker.center.x - control.x) &&
			FT_IS_SMALL(stroker.center.y - control.y) &&
			FT_IS_SMALL(control.x - to.x) &&
			FT_IS_SMALL(control.y - to.y)) {
			stroker.center.copy(to);
			return Exit();
		}
		arc.get(0).copy(to)
		arc.get(1).copy(control)
		arc.get(2).copy(stroker.center)

		while (arc.curIndex >= 0) {
			let angle_in = RefValue.from(stroker.angle_in), angle_out = RefValue.from(stroker.angle_in);

			if (arc.curIndex < limit && !ft_conic_is_small_enough(arc, angle_in, angle_out)) {
				if (stroker.first_point) {
					stroker.angle_in = angle_in.value;
				}
				ft_conic_split(arc);
				arc.next(2);
				continue;
			}
			if (first_arc) {
				first_arc = false;
				if (stroker.first_point)
					error = stroker.subpathStart(angle_in.value, 0);
				else {
					stroker.angle_out = angle_in.value;
					error = stroker.processCorner(0);
				}
			}
			else if (ft_pos_abs(FT_Angle_Diff(stroker.angle_in, angle_in.value)) > FT_SMALL_CONIC_THRESHOLD / 4) {
				stroker.center.copy(arc.get(2));
				stroker.angle_out = angle_in.value;
				stroker.line_join = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_ROUND;
				error = stroker.processCorner(0);
				stroker.line_join = stroker.line_join_saved;
			}
			if (error)
				return Exit();
			{
				let ctrl = FT_Vector.default(), end = FT_Vector.default();
				let theta, phi, rotate, alpha0 = 0;
				let length = 0;
				let border = new FT_StrokeBorder();
				let side = 0;

				theta = FT_Angle_Diff(angle_in.value, angle_out.value) / 2;
				phi = angle_in.value + theta;
				length = FT_DivFix(stroker.radius, FT_Cos(theta));
				if (stroker.handle_wide_strokes) {
					alpha0 = FT_Atan2(arc.get(0).x - arc.get(2).x, arc.get(1).y - arc.get(2).y);
				}
				let bordersIndex = 0
				for (side = 0; side <= 1; side++) {
					 border = stroker.borders[bordersIndex++]

					rotate = FT_SIDE_TO_ROTATE(side);
					FT_Vector_From_Polar(ctrl, length, phi + rotate);
					ctrl.x += arc.get(1).x;
					ctrl.y += arc.get(1).y;
					FT_Vector_From_Polar(end, stroker.radius, angle_out.value + rotate);
					end.x += arc.get(0).x;
					end.y += arc.get(0).y;

					if (stroker.handle_wide_strokes) {
						let start = FT_Vector.default();
						let alpha1;

						start = border.points[border.num_points - 1];
						alpha1 = FT_Atan2(end.x - start.x, end.y - start.y);
						if (ft_pos_abs(FT_Angle_Diff(alpha0, alpha1)) >
							FT_ANGLE_PI / 2) {
							let beta, gamma;
							let bvec = FT_Vector.default(), delta = FT_Vector.default();
							let blen, sinA, sinB, alen;

							beta = FT_Atan2(arc.get(2).x - start.x, arc.get(2).y - start.y);
							gamma = FT_Atan2(arc.get(0).x - end.x, arc.get(0).y - end.y);

							bvec.x = end.x - start.x;
							bvec.y = end.y - start.y;
							blen = FT_Vector_Length(bvec);
							sinA = ft_pos_abs(FT_Sin(alpha1 - gamma));
							sinB = ft_pos_abs(FT_Sin(beta - gamma));
							alen = FT_MulDiv(blen, sinA, sinB);
							FT_Vector_From_Polar(delta, alen, beta);
							delta.x += start.x;
							delta.y += start.y;
							border.movable = false;
							error = border.lineTo(delta, false);
							if (error)
								return Exit();
							error = border.lineTo(end, false);
							if (error)
								return Exit();
							error = border.conicTo(ctrl, start);
							if (error)
								return Exit();
							error = border.lineTo(end, false);
							if (error)
								return Exit();
							continue;
						}
					}
					error = border.conicTo(ctrl, end);
					if (error) {
						return Exit();
					}
				}
			}
			arc.prev(2);
			stroker.angle_in = angle_out.value;
		}
		stroker.center.copy(to);
		stroker.line_length = 0;
		return error;
	}
	conicTo3(control1: FT_Vector, control2: FT_Vector, to: FT_Vector) {
		let stroker = this
		let error = 0;
		let bez_stack = new Array(37).fill(0).map(() => FT_Vector.default());
		let arc: PointerArray<FT_Vector>;
		let limit = PointerArray.from(bez_stack).move(32);
		let first_arc: FT_Bool = 1;

		if (FT_IS_SMALL(stroker.center.x - control1.x) &&
			FT_IS_SMALL(stroker.center.y - control1.y) &&
			FT_IS_SMALL(control1.x - control2.x) &&
			FT_IS_SMALL(control1.y - control2.y) &&
			FT_IS_SMALL(control2.x - to.x) &&
			FT_IS_SMALL(control2.y - to.y)) {
			stroker.center.copy(to);
			return error;
		}
		arc = PointerArray.from(bez_stack);
		arc.get(0).copy(to);
		arc.get(1).copy(control2);
		arc.get(2).copy(control1);
		arc.get(3).copy(stroker.center);
		while (arc.curIndex >= 0) {
			let angle_in = RefValue.from(0), angle_mid = RefValue.from(0), angle_out = RefValue.from(0);
			angle_in.value = angle_out.value = angle_mid.value = stroker.angle_in;
			if (arc.curIndex < limit.curIndex && !ft_conic_is_small_enough(arc, angle_in, angle_out)) {
				if (stroker.first_point)
					stroker.angle_in = angle_in.value;
				ft_conic_split(arc);
				arc.next(3);
				continue;
			}
			if (first_arc) {
				first_arc = 0;
				if (stroker.first_point)
					error = stroker.subpathStart(angle_in.value, 0);
				else {
					stroker.angle_out = angle_in.value;
					error = stroker.processCorner(0);
				}
			}
			else if (ft_pos_abs(FT_Angle_Diff(stroker.angle_in, angle_in.value)) > FT_SMALL_CONIC_THRESHOLD / 4) {
				stroker.center.copy(arc.get(2));
				stroker.angle_out = angle_in.value;
				stroker.line_join = FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_ROUND;
				error = stroker.processCorner(0);
				stroker.line_join = stroker.line_join_saved;
			}
			if (error)
				return error;
			{
				let ctrl1 = FT_Vector.default(), ctrl2 = FT_Vector.default(), end = FT_Vector.default();
				let theta1: FT_Angle, phi1: FT_Angle, theta2: FT_Angle, phi2: FT_Angle, rotate, alpha0 = 0;
				let length1: FT_Fixed, length2: FT_Fixed;
				let border: FT_StrokeBorderRec;
				let side: FT_Int;

				theta1 = FT_Angle_Diff(angle_in.value, angle_mid.value) / 2;
				theta2 = FT_Angle_Diff(angle_mid.value, angle_out.value) / 2;
				phi1 = ft_angle_mean(angle_in.value, angle_mid.value);
				phi2 = ft_angle_mean(angle_mid.value, angle_out.value);
				length1 = FT_DivFix(stroker.radius, FT_Cos(theta1));
				length2 = FT_DivFix(stroker.radius, FT_Cos(theta2));
				if (stroker.handle_wide_strokes) {
					alpha0 = FT_Atan2(arc.get(0).x - arc.get(3).x, arc.get(0).y - arc.get(3).y);
				}
				let bordersIndex = 0
				for (side = 0; side <= 1; side++, bordersIndex++) {
					border = stroker.borders[bordersIndex]
					rotate = FT_SIDE_TO_ROTATE(side);
					FT_Vector_From_Polar(ctrl1, length1, phi1 + rotate);
					ctrl1.x += arc.get(2).x;
					ctrl1.y += arc.get(2).y;
					FT_Vector_From_Polar(ctrl2, length2, phi2 + rotate);
					ctrl2.x += arc.get(1).x;
					ctrl2.y += arc.get(1).y;
					FT_Vector_From_Polar(end, stroker.radius, angle_out.value + rotate);
					end.x += arc.get(0).x;
					end.y += arc.get(0).y;
					if (stroker.handle_wide_strokes) {
						let start = FT_Vector.default();
						let alpha1;
						start = border.points[border.num_points - 1];
						alpha1 = FT_Atan2(end.x - start.x, end.y - start.y);
						if (ft_pos_abs(FT_Angle_Diff(alpha0, alpha1)) >
							FT_ANGLE_PI / 2) {
							let beta, gamma;
							let bvec = FT_Vector.default(), delta = FT_Vector.default();
							let blen, sinA, sinB, alen;
							beta = FT_Atan2(arc.get(3).x - start.x, arc.get(3).y - start.y);
							gamma = FT_Atan2(arc.get(0).x - end.x, arc.get(0).y - end.y);
							bvec.x = end.x - start.x;
							bvec.y = end.y - start.y;
							blen = FT_Vector_Length(bvec);
							sinA = ft_pos_abs(FT_Sin(alpha1 - gamma));
							sinB = ft_pos_abs(FT_Sin(beta - gamma));
							alen = FT_MulDiv(blen, sinA, sinB);
							FT_Vector_From_Polar(delta, alen, beta);
							delta.x += start.x;
							delta.y += start.y;
							border.movable = false;
							error = border.lineTo(delta, false);
							if (error)
								return error;
							error = border.lineTo(end, false);
							if (error)
								return error;
							error = border.cubicTo(ctrl2, ctrl1, start);
							if (error)
								return error;
							error = border.lineTo(end, false);
							if (error)
								return error;
							continue;
						}
					}
					error = border.cubicTo(ctrl1, ctrl2, end);
					if (error) {
						return error;
					}
				}
			}
			arc.prev(3);
			stroker.angle_in = angle_out.value;
		}
		stroker.center.copy(to);
		stroker.line_length = 0;

		return error;
	}
	beginSubPath(to: FT_Vector, open: FT_Bool): FT_Error {
		this.first_point = 1
		this.center.copy(to)
		this.subpath_open = open
		this.handle_wide_strokes = this.line_join !== FT_Stroker_LineJoin.FT_STROKER_LINEJOIN_ROUND
		this.subpath_start.copy(to)
		this.angle_in = 0
		return 0
	}
	endSubPath() {
		let stroker = this
		let error = 0;

		if (stroker.subpath_open) {
			let right = stroker.borders[0];
			error = stroker.cap(stroker.angle_in, 0);
			if (error) {
				return error
			}
			error = stroker.reverseLeft(1);
			if (error) {
				return error
			}
			stroker.center.copy(stroker.subpath_start);
			error = stroker.cap(stroker.subpath_angle + FT_ANGLE_PI, 0);
			if (error)
				return error;
			right.close(0);
		}
		else {
			let turn: FT_Angle;
			let inside_side: FT_Int;
			if (stroker.center.x != stroker.subpath_start.x || stroker.center.y != stroker.subpath_start.y) {
				error = stroker.lineTo(stroker.subpath_start);
				if (error)
					return error
			}
			stroker.angle_out = stroker.subpath_angle;
			turn = FT_Angle_Diff(stroker.angle_in, stroker.angle_out);
			if (turn != 0) {
				inside_side = 0;
				if (turn < 0)
					inside_side = 1;
				error = stroker.inside(inside_side, stroker.subpath_line_length);
				if (error)
					return error
				error = stroker.outside(1 - inside_side, stroker.subpath_line_length);
				if (error)
					return error
			}
			stroker.borders[0].close(0);
			stroker.borders[1].close(1);
		}
		return error;
	}
	subpathStart(start_angle: FT_Angle, line_length: FT_Fixed): FT_Error {
		let delta = FT_Vector.default()
		let point = FT_Vector.default()
		let error: FT_Error = 0;
		let border: FT_StrokeBorderRec[] = []

		FT_Vector_From_Polar(delta, this.radius, start_angle + FT_ANGLE_PI2)
		point.x = this.center.x + delta.x;
		point.y = this.center.y + delta.y;

		error = this.borders[0].moveTo(point)
		if (error) {
			return error
		}
		point.x = this.center.x - delta.x;
		point.y = this.center.y - delta.y;
		error = this.borders[1].moveTo(point)

		this.subpath_angle = start_angle
		this.first_point = 0
		this.subpath_line_length = line_length
		return error

	}
	arcTo(side: FT_Int) {
		let total: FT_Angle = 0, rotate: FT_Angle = 0;
		let radius = this.radius;
		let error: FT_Error = 0;
		let border = this.borders[side];

		rotate = FT_SIDE_TO_ROTATE(side);
		total = FT_Angle_Diff(this.angle_in, this.angle_out);
		if (total == FT_ANGLE_PI) {
			total = -rotate * 2;
		}
		error = border.arcTo(this.center, radius, this.angle_in + rotate, total);
		border.movable = 0;
		return error;
	}
	exportBorder(border: FT_StrokerBorder, outline: FT_Outline) {
		if (border == FT_StrokerBorder.FT_STROKER_BORDER_LEFT || border == FT_StrokerBorder.FT_STROKER_BORDER_RIGHT) {
			let sborder = this.borders[border];
			if (sborder.valid) {
				sborder.export(outline)
			}

		}
	}

	parseOutline(outline: FT_Outline) {
		let stroker = this
		let v_last: FT_Vector = FT_Vector.default();
		let v_control = FT_Vector.default();
		let v_start = FT_Vector.default();
		let point = PointerArray.from(outline.points);
		let limit = PointerArray.from(outline.points);
		let tags = PointerArray.from(outline.tags);
		let error: FT_Error = 0;
		let n: FT_Int = 0;
		let first: FT_UInt = 0;
		let tag: FT_Int = 0;


		stroker.rewind()
		first = 0;
		function Invalid_Outline() {
			return -2
		}
		function Exit() {
			return error;
		}
		function Close() {
			if (error) {
				return Exit();
			}
			if (stroker.first_point) {
				stroker.subpath_open = 1
				error = stroker.subpathStart(0, 0)
				if (error) {
					return Exit()
				}
			}
			error = stroker.endSubPath()
			if (error) {
				return Exit()
			}
			first = last + 1
		}
		let last: FT_UInt = 0;
		for (n = 0; n < outline.n_contours; n++) {

			last = outline.contours[n];
			//limit = outline.points.slice(last);
			limit.move(last)
			if (last <= first) {
				first = last + 1;
				continue;
			}
			v_start = outline.points[first];
			v_last = outline.points[last];
			v_control = v_start;
			//point = outline.points.slice(first);
			point.move(first)
			//tags = outline.tags.slice(first);
			tags.move(first)
			tag = FT_CURVE_TAG(tags.get(0));
			if (tag == FT_CURVE_TAG_CUBIC) {
				return Invalid_Outline();
			}
			if (tag == FT_CURVE_TAG_CONIC) {
				if (FT_CURVE_TAG(outline.tags[last]) == FT_CURVE_TAG_ON) {
					v_start = v_last;
					limit.prev();
				}
				else {
					v_start.x = (v_start.x + v_last.x) / 2;
					v_start.y = (v_start.y + v_last.y) / 2;
				}
				point.prev();
				tags.prev();
			}
			error = this.beginSubPath(v_start, outline.contours_flag[n]);
			if (error) {
				return Exit();
			}
			while (point.curIndex < limit.curIndex) {
				point.next();
				tags.next();
				tag = FT_CURVE_TAG(tags.value);
				switch (tag) {
					case FT_CURVE_TAG_ON:
						{
							let vec = FT_Vector.default();
							vec.x = point.value.x;
							vec.y = point.value.y;
							error = stroker.lineTo(vec);
							if (error) {
								return error
							}
							break
						}
					case FT_CURVE_TAG_CONIC:
						v_control.x = point.value.x;
						v_control.y = point.value.y;
						while (point.curIndex < limit.curIndex) {
							let vec = FT_Vector.default();
							let v_middle = FT_Vector.default();
							point.next();
							tags.next();
							tag = FT_CURVE_TAG(tags.get(0));
							vec = point.get(0);
							if (tag == FT_CURVE_TAG_ON) {
								error = stroker.conicTo(v_control, vec);
								if (error)
									return error
								continue;
							}
							if (tag != FT_CURVE_TAG_CONIC) {
								return Invalid_Outline();
							}
							v_middle.x = (v_control.x + vec.x) / 2;
							v_middle.y = (v_control.y + vec.y) / 2;
							error = stroker.conicTo(v_control, v_middle);
							if (error) {
								return error
							}
							v_control = vec;
						}
						error = stroker.conicTo(v_control, v_start);
						if (Close() === error) {
							return error
						}
						break
					default:
						{
							let vec1 = FT_Vector.default(), vec2 = FT_Vector.default();
							if (point.curIndex + 1 > limit.curIndex ||
								FT_CURVE_TAG(tags.get(1)) != FT_CURVE_TAG_CUBIC) {
								return Invalid_Outline();
							}
							point.next(2);
							tags.next(2);
							vec1 = point.get(-2);
							vec2 = point.get(-1);
							if (point.curIndex <= limit.curIndex) {
								let vec = FT_Vector.default();
								vec = point.get(0);
								error = stroker.cubicTo(vec1, vec2, vec);
								if (error)
									return error
								continue;
							}
							error = stroker.cubicTo(vec1, vec2, v_start);
							if (Close() === error) {
								return error
							}
							break
						}
				}
			}

			if (Close() === error) {
				return error
			}
		}

		return 0

	}

	getCounts(anum_points: RefValue<FT_UInt>, anum_contours: RefValue<FT_UInt>): FT_Error {
		const stroker = this
		let count1 = RefValue.from(0), count2 = RefValue.from(0), num_points = 0;
		let count3 = RefValue.from(0), count4 = RefValue.from(0), num_contours = 0;
		let error = 0
		error = stroker.borders[0].getCounts(count1, count2);
		if (error) {
			return error
		}
		error = stroker.borders[1].getCounts(count3, count4);
		if (error) {
			return error
		}
		num_points = count1.value + count3.value;
		num_contours = count2.value + count4.value;
		anum_points.value = num_points;
		anum_contours.value = num_contours;
		return error;
	}
	export(outline: FT_Outline): void {
		this.exportBorder(FT_StrokerBorder.FT_STROKER_BORDER_LEFT, outline)
		this.exportBorder(FT_StrokerBorder.FT_STROKER_BORDER_RIGHT, outline)
	}

	processCorner(line_length: FT_Fixed) {
		let stroker = this
		let error = 0;
		let turn;
		let inside_side;

		turn = FT_Angle_Diff(stroker.angle_in, stroker.angle_out);
		if (turn == 0)
			return error;
		inside_side = 0;
		if (turn < 0)
			inside_side = 1;
		error = stroker.inside(inside_side, line_length);
		if (error)
			return error;
		error = stroker.outside(1 - inside_side, line_length);
		return error;
	}


}
export const FT_StrokerRec = FT_Stroker

