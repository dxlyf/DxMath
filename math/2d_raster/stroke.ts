
import { Point26_6,Int52_12,int52_12,int26_6,Int26_6 } from './fixed'
import {pAdd,pDot,pLen,pNeg,pNorm,pRot90CCW,pRot90CW,pSub,Path,Adder,pRot45CW,pRot45CCW,AddPathReversed} from './geom'
// Two points are considered practically equal if the square of the distance
// between them is less than one quarter (i.e. 1024 / 4096).
const epsilon = 1024

// A Capper signifies how to begin or end a stroked path.
export interface Capper {
	// Cap adds a cap to p given a pivot point and the normal vector of a
	// terminal segment. The normal's length is half of the stroke width.
	Cap(p: Adder, halfWidth: int26_6, pivot: Point26_6, n1: Point26_6): void
}



// A Joiner signifies how to join interior nodes of a stroked path.
export interface Joiner {
	// Join adds a join to the two sides of a stroked path given a pivot
	// point and the normal vectors of the trailing and leading segments.
	// Both normals have length equal to half of the stroke width.
	Join(lhs: Adder, rhs: Adder, halfWidth: int26_6, pivot: Point26_6, n0: Point26_6, n1: Point26_6): void
}


export class RoundCapper implements Capper {
	Cap(p: Adder, halfWidth: int26_6, pivot: Point26_6, n1: Point26_6): void {
		// The cubic Bézier approximation to a circle involves the magic number
		// (√2 - 1) * 4/3, which is approximately 35/64.
		const k = 35
		let e = pRot90CCW(n1)

		const side = pivot.add(e)
		const start = pivot.sub(n1), end = pivot.add(n1)
		const d = n1.multiplyScalar(k)
		e=e.multiplyScalar(k)

		p.Add3(start.add(e), side.sub(d), side)
		p.Add3(side.add(d), end.add(e), end)
	}
}
export class ButtCapper implements Capper {
	Cap(p: Adder, halfWidth: number, pivot: Point26_6, n1: Point26_6): void {
		p.Add1(pivot.add(n1))
	}
}
export class SquareCapper implements Capper {
	Cap(p: Adder, halfWidth: int26_6, pivot: Point26_6, n1: Point26_6): void {
		const e =pRot90CCW(n1)
		let side = pivot.add(e)
		p.Add1(side.sub(n1))
		p.Add1(side.add(n1))
		p.Add1(pivot.add(n1))
	}
}

export class RoundJoiner implements Joiner {
	Join(lhs: Adder, rhs: Adder, halfWidth: int26_6, pivot: Point26_6, n0: Point26_6, n1: Point26_6): void {
		let dot = pDot(pRot90CW(n0), n1)
		if (dot >= 0) {
			addArc(lhs, pivot, n0, n1)
			rhs.Add1(pivot.sub(n1))
		} else {
			lhs.Add1(pivot.add(n1))
			addArc(rhs, pivot, pNeg(n0), pNeg(n1))
		}
	}

}
export class BevelJoiner implements Joiner {
	Join(lhs: Adder, rhs: Adder, halfWidth: int26_6, pivot: Point26_6, n0: Point26_6, n1: Point26_6): void {
		lhs.Add1(pivot.add(n1))
		rhs.Add1(pivot.sub(n1))
	}

}


// addArc adds a circular arc from pivot+n0 to pivot+n1 to p. The shorter of
// the two possible arcs is taken, i.e. the one spanning <= 180 degrees. The
// two vectors n0 and n1 must be of equal length.
function addArc(p: Adder, pivot: Point26_6, n0: Point26_6, n1: Point26_6) {
	// r2 is the square of the length of n0.
	const r2 = pDot(n0,n0)
	if (r2 < epsilon) {
		// The arc radius is so small that we collapse to a straight line.
		p.Add1(pivot.add(n1))
		return
	}
	// We approximate the arc by 0, 1, 2 or 3 45-degree quadratic segments plus
	// a final quadratic segment from s to n1. Each 45-degree segment has
	// control points {1, 0}, {1, tan(π/8)} and {1/√2, 1/√2} suitably scaled,
	// rotated and translated. tan(π/8) is approximately 27/64.
	const tpo8 = 27
	var s = Point26_6.default()
	// We determine which octant the angle between n0 and n1 is in via three
	// dot products. m0, m1 and m2 are n0 rotated clockwise by 45, 90 and 135
	// degrees.
	let m0 =pRot45CW(n0)
	let m1 = pRot90CW(n0) //pRot90CW(n0)
	let m2 = pRot90CW(n0) //pRot90CW(m0)
	if (pDot(m1,n1) >= 0) {
		if (pDot(n0,n1) >= 0) {
			if (pDot(m2,n1) <= 0) {
				// n1 is between 0 and 45 degrees clockwise of n0.
				s.copy(n0)
			} else {
				// n1 is between 45 and 90 degrees clockwise of n0.
				p.Add2(pivot.add(n0).add(m1.multiplyScalar(tpo8)), pivot.add(m0))
				s = m0
			}
		} else {
			let pm1 = pivot.add(m1), n0t = n0.multiplyScalar(tpo8)
			p.Add2(pivot.add(n0).add(m1.multiplyScalar(tpo8)), pivot.add(m0))
			p.Add2(pm1.add(n0t), pm1)
			if (m0.dot(n1) >= 0) {
				// n1 is between 90 and 135 degrees clockwise of n0.
				s.copy(m1)
			} else {
				// n1 is between 135 and 180 degrees clockwise of n0.
				p.Add2(pm1.sub(n0t), pivot.add(m2))
				s.copy(m2)
			}
		}
	} else {
		if (pDot(n0,n1) >= 0) {
			if (pDot(m0,n1) >= 0) {
				// n1 is between 0 and 45 degrees counter-clockwise of n0.
				s.copy(n0)
			} else {
				// n1 is between 45 and 90 degrees counter-clockwise of n0.
				p.Add2(pivot.add(n0).sub(m1.multiplyScalar(tpo8)), pivot.sub(m2))
				s.copy(pNeg(m2))
			}
		} else {
			let pm1 = pivot.sub(m1), n0t = n0.multiplyScalar(tpo8)
			p.Add2(pivot.add(n0).sub(m1.multiplyScalar(tpo8)), pivot.sub(m2))
			p.Add2(pm1.add(n0t), pm1)
			if (m2.dot(n1) <= 0) {
				// n1 is between 90 and 135 degrees counter-clockwise of n0.
				s.copy(pNeg(m1))
			} else {
				// n1 is between 135 and 180 degrees counter-clockwise of n0.
				p.Add2(pm1.sub(n0t), pivot.sub(m0))
				s.copy(pNeg(m0))
			}
		}
	}
	// The final quadratic segment has two endpoints s and n1 and the middle
	// control point is a multiple of s.Add(n1), i.e. it is on the angle
	// bisector of those two points. The multiple ranges between 128/256 and
	// 150/256 as the angle between s and n1 ranges between 0 and 45 degrees.
	//
	// When the angle is 0 degrees (i.e. s and n1 are coincident) then
	// s.Add(n1) is twice s and so the middle control point of the degenerate
	// quadratic segment should be half s.Add(n1), and half = 128/256.
	//
	// When the angle is 45 degrees then 150/256 is the ratio of the lengths of
	// the two vectors {1, tan(π/8)} and {1 + 1/√2, 1/√2}.
	//
	// d is the normalized dot product between s and n1. Since the angle ranges
	// between 0 and 45 degrees then d ranges between 256/256 and 181/256.
	let d = 256 * pDot(s,n1) / r2
	const multiple = Math.floor(150 - (150 - 128) * (d - 181) / (256 - 181)) >> 2;
	p.Add2(pivot.add(s.add(n1).multiplyScalar(multiple)), pivot.add(n1));
}

// midpoint returns the midpoint of two Points.
function midpoint(a: Point26_6, b: Point26_6) {
	return Point26_6.from((a.x + b.x) / 2, (a.y + b.y) / 2)
}

// angleGreaterThan45 returns whether the angle between two vectors is more
// than 45 degrees.
function angleGreaterThan45(v0: Point26_6, v1: Point26_6): boolean {
	let v = pRot45CCW(v0)
	return pDot(v, v1) < 0 || pDot(pRot90CW(v), v1) < 0
}

// interpolate returns the point (1-t)*a + t*b.
function interpolate(a: Point26_6, b: Point26_6, t: number) {
	// 计算 s = (1 << 12) - t
	const s = (1 << 12) - t;

	// 计算插值后的 x 和 y 坐标
	const x = s * a.x + t * b.x;
	const y = s * a.y + t * b.y;

	// 右移 12 位，相当于除以 4096
	return Point26_6.from(
		x >> 12,
		y >> 12
	);
}

// curviest2 returns the value of t for which the quadratic parametric curve
// (1-t)²*a + 2*t*(1-t).b + t²*c has maximum curvature.
//
// The curvature of the parametric curve f(t) = (x(t), y(t)) is
// |x′y″-y′x″| / (x′²+y′²)^(3/2).
//
// Let d = b-a and e = c-2*b+a, so that f′(t) = 2*d+2*e*t and f″(t) = 2*e.
// The curvature's numerator is (2*dx+2*ex*t)*(2*ey)-(2*dy+2*ey*t)*(2*ex),
// which simplifies to 4*dx*ey-4*dy*ex, which is constant with respect to t.
//
// Thus, curvature is extreme where the denominator is extreme, i.e. where
// (x′²+y′²) is extreme. The first order condition is that
// 2*x′*x″+2*y′*y″ = 0, or (dx+ex*t)*ex + (dy+ey*t)*ey = 0.
// Solving for t gives t = -(dx*ex+dy*ey) / (ex*ex+ey*ey).

function curviest2(a: Point26_6, b: Point26_6, c: Point26_6) {
	// 计算向量差
	const dx = BigInt(b.x - a.x);
	const dy = BigInt(b.y - a.y);
	const ex = BigInt(c.x - 2 * b.x + a.x);
	const ey = BigInt(c.y - 2 * b.y + a.y);

	// 如果 ex 和 ey 都为 0，返回默认值 2048
	if (ex === 0n && ey === 0n) {
		return 2048;
	}

	// 计算并返回结果
	const numerator = -4096n * (dx * ex + dy * ey);
	const denominator = ex * ex + ey * ey;
	return Number(numerator / denominator);
}


// A stroker holds state for stroking a path.
export class Stroker {
	// p is the destination that records the stroked path.
	p!: Adder
	// u is the half-width of the stroke.
	u: number = 0
	// cr and jr specify how to end and connect path segments.
	cr!: Capper
	jr!: Joiner
	//r是反向路径。抚摸一条路径涉及建造两个
	//平行路径2*U分开。第一个路径立即添加到p，
	//第二路径累积在R中，最终以相反的方式添加。
	r: Path = new Path()
	// a is the most recent segment point. anorm is the segment normal of
	// length u at that point.
	a = Point26_6.default()
	anorm = Point26_6.default()

	constructor(){
		
	}
	//addnoncurvy2向stroker添加了一个二次段，
	//（K.A，b，c）定义在K.A或C处达到最大曲率。
	addNonCurvy2(b: Point26_6, c: Point26_6) {
		// We repeatedly divide the segment at its middle until it is straight
		// enough to approximate the stroke by just translating the control points.
		// ds and ps are stacks of depths and points. t is the top of the stack.
		const maxDepth = 5
		const k = this
		let
			ds: number[] = new Array(maxDepth + 1),
			ps: Point26_6[] = Array.from({ length: 2 * maxDepth + 3 }, () => Point26_6.default()),
			t: number = 0;

		// Initially the ps stack has one quadratic segment of depth zero.
		ds[0] = 0
		ps[2] = k.a.clone()
		ps[1] = b
		ps[0] = c
		const anorm = k.anorm.clone()
		let cnorm = Point26_6.default()

		while (true) {
			let depth = ds[t]
			let a = ps[2 * t + 2]
			let b = ps[2 * t + 1]
			let c = ps[2 * t + 0]
			let ab = b.clone().sub(a)
			let bc = c.clone().sub(b)
			// let abIsSmall = ab.dot(ab) < (1 << 12)
			// let bcIsSmall = bc.dot(bc) < (1 << 12)
			let abIsSmall = pDot(ab, ab) < (1<<12)
			let bcIsSmall = pDot(bc, bc) < (1<<12)
			if (abIsSmall && bcIsSmall) {
				// Approximate the segment by a circular arc.
				//cnorm = pRot90CCW(pNorm(bc, k.u))
				// const _bc=bc.clone()	
				// _bc.setLength(k.u)
				// _bc.rotateDegrees(-90)
				cnorm = pRot90CCW(pNorm(bc, k.u))
				let mac = midpoint(a, c)
				addArc(k.p, mac, anorm, cnorm)
				addArc(k.r, mac, pNeg(anorm),pNeg(cnorm))
			} else if (depth < maxDepth && angleGreaterThan45(ab, bc)) {
				// Divide the segment in two and push both halves on the stack.
				let mab = midpoint(a, b)
				let mbc = midpoint(b, c)
				t++
				ds[t + 0] = depth + 1
				ds[t - 1] = depth + 1
				ps[2 * t + 2] = a.clone()
				ps[2 * t + 1] = mab.clone()
				ps[2 * t + 0] = midpoint(mab, mbc)
				ps[2 * t - 1] = mbc.clone()
				continue
			} else {
				// Translate the control points.
				let bnorm = pRot90CCW(pNorm(c.sub(a), k.u))
				let cnorm = pRot90CCW(pNorm(bc, k.u))
				k.p.Add2(b.add(bnorm), c.add(cnorm))
				k.r.Add2(b.sub(bnorm), c.sub(cnorm))
			}
			if (t == 0) {
				k.a.copy(c)
				k.anorm.copy(cnorm)
				return
			}
			t--
			anorm.copy(cnorm)
		}

	}

	// Add1 adds a linear segment to the stroker.
	Add1(b: Point26_6) {
		const k = this
		let bnorm = pRot90CCW(pNorm(b.sub(k.a), k.u))
		if (k.r.length == 0) {
			k.p.Start(k.a.add(bnorm))
			k.r.Start(k.a.sub(bnorm))
		} else {
			k.jr.Join(k.p, k.r, k.u, k.a, k.anorm, bnorm)
		}
		k.p.Add1(b.add(bnorm))
		k.r.Add1(b.sub(bnorm))
		k.a=b;
		k.anorm =bnorm
	}
	Add2(b: Point26_6, c: Point26_6) {
		const ab = pSub(b, this.a);
		const bc = pSub(c, b);
		const abnorm = pRot90CCW(pNorm(ab, this.u));

		if (this.r.length === 0) {
			this.p.Start(pAdd(this.a, abnorm));
			this.r.Start(pSub(this.a, abnorm));
		} else {
			this.jr.Join(this.p, this.r, this.u, this.a, this.anorm, abnorm);
		}

		// Approximate nearly-degenerate quadratics by linear segments
		const abIsSmall = pDot(ab, ab) < epsilon;
		const bcIsSmall = pDot(bc, bc) < epsilon;
		if (abIsSmall || bcIsSmall) {
			const acnorm = pRot90CCW(pNorm(pSub(c, this.a), this.u));
			this.p.Add1(pAdd(c, acnorm));
			this.r.Add1(pSub(c, acnorm));
			this.a = c;
			this.anorm = acnorm;
			return;
		}

		// Find the point of maximum curvature
		const t = curviest2(this.a, b, c);
		if (t <= 0 || t >= 4096) {
			this.addNonCurvy2(b, c);
			return;
		}

		// Perform de Casteljau decomposition
		const mab = interpolate(this.a, b, t);
		const mbc = interpolate(b, c, t);
		const mabc = interpolate(mab, mbc, t);

		// Check if the vectors are nearly opposite
		const bcnorm = pRot90CCW(pNorm(bc, this.u));
		if (pDot(abnorm, bcnorm) < -this.u * this.u * 2047 / 2048) {
			const pArc = pDot(abnorm, bc) < 0;

			this.p.Add1(pAdd(mabc, abnorm));
			if (pArc) {
				const z = pRot90CW(abnorm);
				addArc(this.p, mabc, abnorm, z);
				addArc(this.p, mabc, z, bcnorm);
			}
			this.p.Add1(pAdd(mabc, bcnorm));
			this.p.Add1(pAdd(c, bcnorm));

			this.r.Add1(pSub(mabc, abnorm));
			if (!pArc) {
				const z = pRot90CW(abnorm);
				addArc(this.r, mabc, pNeg(abnorm), z);
				addArc(this.r, mabc, z, pNeg(bcnorm));
			}
			this.r.Add1(pSub(mabc, bcnorm));
			this.r.Add1(pSub(c, bcnorm));

			this.a = c;
			this.anorm = bcnorm;
			return;
		}

		// Process the decomposed parts
		this.addNonCurvy2(mab, mabc);
		this.addNonCurvy2(mbc, c);
	}
	Add3(b, c, d) {
		console.assert("freetype/raster: stroke unimplemented for cubic segments")
	}

	//冲程将中风路径Q添加到P中，其中Q完全由一条曲线组成。
	stroke(q: Path) {
		//抚摸是通过在q之外的每条k.u的两条路径来实现的。
		//左侧路径立即添加到K.P；右侧
		//路径累积在K.R.一旦我们将LHS添加到K.P
		//我们以相反的顺序添加RHS。
		
		this.r =new Path()
		this.a = Point26_6.from(q.points[1], q.points[2])
		for(let i= 4; i < q.length; ){
			switch (q.points[i]) {
				case 1:
					this.Add1(
						Point26_6.from(q.points[i+1], q.points[i+2])
					)
					i += 4
					break
				case 2:
					this.Add2(
						Point26_6.from(q.points[i+1], q.points[i+2]),
						Point26_6.from(q.points[i+3], q.points[i+4])
					)
					i += 6
					break
				case 3:
					this.Add3(
						Point26_6.from(q.points[i+1], q.points[i+2]),
						Point26_6.from(q.points[i+3], q.points[i+4]),
						Point26_6.from(q.points[i+5], q.points[i+6]),
					)
					i += 8
					break
				default:
					break
					//panic("freetype/raster: bad path")
				}
		}
		if (this.r.length == 0) {
			return
		}
		// TODO(nigeltao): if q is a closed curve then we should join the first and
		// last segments instead of capping them.
		this.cr.Cap(this.p, this.u, q.lastPoint(), pNeg(this.anorm))
		AddPathReversed(this.p, this.r)
		let pivot = q.firstPoint()
		this.cr.Cap(this.p, this.u, pivot, pivot.clone().sub(Point26_6.from(this.r.points[1], this.r.points[2])))

	}

}


// Add3 adds a cubic segment to the stroker.
// func (k *stroker) Add3(b, c, d fixed.Point26_6) {
// 	panic("freetype/raster: stroke unimplemented for cubic segments")
// }

// Stroke adds q stroked with the given width to p. The result is typically
// self-intersecting and should be rasterized with UseNonZeroWinding.
// cr and jr may be nil, which defaults to a RoundCapper or RoundJoiner.
export function Stroke(p: Adder, q: Path, width: number, cr: Capper, jr:Joiner) {
	if (q.length === 0) {
        return;
    }

    if (cr === null) {
        cr = new RoundCapper()
    }

    if (jr === null) {
        jr = new RoundJoiner()
    }

    if (q.points[0] !== 0) {
        throw new Error("freetype/raster: bad path");
    }

    const s = new Stroker();
	s.p=p;
	s.u=width/2
	s.cr=cr;
	s.jr=jr
    let i = 0;

	for(let j = 4; j < q.length;) {
		switch( q.points[j]) {
		case 0:
			s.stroke(q.slice(i,j))
			i=j
			j =j+4
			break
		case 1:
			j += 4
			break
		case 2:
			j += 6
			break
		case 3:
			j += 8
			break
		default:
			break
			//panic("freetype/raster: bad path")
		}
	}
	s.stroke(q.slice(i))
}