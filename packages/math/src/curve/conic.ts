import { Matrix2D } from "../math/mat2d";
import { Vector2 } from "../math/vec2";


/*** 
 * 
 * //-----------------------------------------------------------------------
//误差界为T（0..4），由delta使用，T=0给出
//非常精确的concics，但代价是需要更多的曲线段。
//lin宏在两个坐标之间进行线性插值。
//这由函数ratio（）使用。圆锥函数的工作原理如下
//递归地调用自身，直到中心权重w接近1。
//conic（）函数需要一个函数bezier（）来绘制积分
//二次贝塞尔曲线。每个点定义为（x，y，w）。
//-----------------------------------------------------------------------
#define delta       (pow(4, 4-T)*fabs(w-1))
#define lin(t,a,b)  ((a) + (t)*((b) - (a)))

typedef float       fpt[3];

// ----------------------------------------------
void ratio(float t, fpt p, fpt q, fpt r) {
  r[0] = lin(t, p[0], q[0]);
  r[1] = lin(t, p[1], q[1]);
  r[2] = lin(t, p[2], q[2]);
}

// ----------------------------------------------
void conic(fpt *p, float w) {
  float s;
  fpt l[3], r[3];

  if (w && delta > 1) {
    s = w / (1 + w);
    w = sqrt((1 + w) / 2);

    ratio( 0, p[0], p[0], l[0]);
    ratio( 0, p[2], p[2], r[2]);
    ratio( s, l[0], p[1], l[1]);
    ratio( s, r[2], p[1], r[1]);
    ratio(.5, l[1], r[1], l[2]);
    ratio( 0, l[2], l[2], r[0]);

    conic(l, w);
    conic(r, w);
  }
  else {
    qbezier(p);
  }
}

 * 
*/

const SCALAR_ROOT_2_OVER_2 = 0.707106781;
const SCALAR_NEARLY_ZERO = 1.0 / (1 << 12);
const PathDirection = {
    /// Clockwise direction for adding closed contours.
    CW: 0,
    /// Counter-clockwise direction for adding closed contours.
    CCW: 1,
}
function subdivide_weight_value(w: number) {
    return Math.sqrt(0.5 + w * 0.5)
}

function interp(v0: Vector2, v1: Vector2, t: number) {
    return v0.clone().add(v1.clone().sub(v0)).multiplyScalar(t)
}

function times_2(value: Vector2) {
    return value.clone().add(value)
}


function subdivide(src: Conic, points: Vector2[], level: number) {
    if (level == 0) {
        points[0].copy(src.points[1])
        points[1].copy(src.points[2])
        return points.slice(2)
    } else {
        let dst = src.chop();

        let start_y = src.points[0].y;
        let end_y = src.points[2].y;
        if (between(start_y, src.points[1].y, end_y)) {
            //如果输入是单调的而输出不是，则扫描转换器挂起。
            //确保截断二次曲线保持其 y 顺序。
            let mid_y = dst[0].points[2].y;
            if (!between(start_y, mid_y, end_y)) {
                //如果计算出的中点位于两端之外，则将其移至较近的一端。
                let closer_y
                if (Math.abs(mid_y - start_y) < Math.abs(mid_y - end_y)) {
                    closer_y = start_y
                } else {
                    closer_y = end_y
                };
                dst[0].points[2].y = closer_y;
                dst[1].points[0].y = closer_y;
            }

            if (!between(start_y, dst[0].points[1].y, dst[0].points[2].y)) {
                //如果第一个控件不在开始和结束之间，则将其放在开始处。
                //这也将四边形减少为一条线。
                dst[0].points[1].y = start_y;
            }

            if (!between(dst[1].points[0].y, dst[1].points[1].y, end_y)) {
                //如果第二个控件不在开始和结束之间，则将其放在末尾。
                //这也将四边形减少为一条线。
                dst[1].points[1].y = end_y;
            }

            //     // Verify that all five points are in order.
            //     debug_assert!(between(start_y, dst.0.points[1].y, dst.0.points[2].y));
            //     debug_assert!(between(
            //         dst.0.points[1].y,
            //         dst.0.points[2].y,
            //         dst.1.points[1].y
            //     ));
            //     debug_assert!(between(dst.0.points[2].y, dst.1.points[1].y, end_y));
        }

        level -= 1;
        points = subdivide(dst[0], points, level);
        return subdivide(dst[1], points, level)
    }
}

//这最初是为 pathops 开发和测试的：请参阅 SkOpTypes.h
//返回 true if (a <= b <= c) || (a >= b >= c)
function between(a: number, b: number, c: number) {
    return (a - b) * (c - b) <= 0.0
}

export class Conic {
    points: Vector2[] = new Array(3)
    weight = 0
    static new(pt0: Vector2, pt1: Vector2, pt2: Vector2, weight: number) {
        const conic = new this()
        conic.points = [pt0, pt1, pt2]
        conic.weight = weight
        return conic
    }
    static from_points(points: Vector2[], weight: number) {
        const conic = new this()
        conic.points = [points[0], points[1], points[2]]
        conic.weight = weight
        return conic
    }
    copy(source: Conic) {
        this.points = source.points.map(d => d.clone())
        this.weight = source.weight
        return this;
    }
    clone() {
        return new Conic().copy(this)
    }
    compute_quad_pow2(tolerance: number) {
        const self = this;
        if (tolerance < 0.0 || !Number.isFinite(tolerance)) {
            return 0;
        }

        if (!self.points[0].isFinite() || !self.points[1].isFinite() || !self.points[2].isFinite()) {
            return 0;
        }

        // Limit the number of suggested quads to approximate a conic
        const MAX_CONIC_TO_QUAD_POW2 = 4;

        // "High order approximation of conic sections by quadratic splines"
        // by Michael Floater, 1993
        let a = self.weight - 1.0;
        let k = a / (4.0 * (2.0 + a));
        let x = k * (self.points[0].x - 2.0 * self.points[1].x + self.points[2].x);
        let y = k * (self.points[0].y - 2.0 * self.points[1].y + self.points[2].y);

        let error = Math.sqrt(x * x + y * y);
        let pow2 = 0;
        for (let i = 0; i < MAX_CONIC_TO_QUAD_POW2; ++i) {
            if (error <= tolerance) {
                break;
            }

            error *= 0.25;
            pow2 += 1;
        }

        // Unlike Skia, we always expect `pow2` to be at least 1.
        // Otherwise it produces ugly results.
        return Math.max(pow2, 1)
    }
    chop_into_quads_pow2(pow2: number, points: Vector2[]) {
        const self = this;

        points[0].copy(self.points[0])
        subdivide(self, points.slice(1), pow2);

        let quad_count = 1 << pow2;
        let pt_count = 2 * quad_count + 1;
        if (points.slice(0, pt_count).some(n => !n.isFinite())) {
            // if we generated a non-finite, pin ourselves to the middle of the hull,
            // as our first and last are already on the first/last pts of the hull.
            // for p in points.iter_mut().take(pt_count - 1).skip(1) {
            //     *p = self.points[1];
            // }
            let points2 = points.slice(0, pt_count - 1).slice(1)
            for (let p of points2) {
                p.copy(this.points[1])
            }
        }

        return 1 << pow2
    }
    chop() {
        const self = this;
        let scale = Vector2.splat(1 / (1.0 + self.weight));
        let new_w = subdivide_weight_value(self.weight);

        let p0 = self.points[0].clone();
        let p1 = self.points[1].clone();
        let p2 = self.points[2].clone();
        let ww = Vector2.splat(self.weight);

        let wp1 = ww.clone().mul(p1);
        let m = (p0.clone().add(times_2(wp1)).add(p2)).mul(scale).mul(Vector2.splat(0.5));
        let m_pt = m.clone();
        if (!m_pt.isFinite()) {
            let w_d = self.weight;
            let w_2 = w_d * 2.0;
            let scale_half = 1.0 / (1.0 + w_d) * 0.5;
            m_pt.x = ((self.points[0].x
                + w_2 * self.points[1].x
                + self.points[2].x)
                * scale_half);

            m_pt.y = ((self.points[0].y
                + w_2 * self.points[1].y
                + self.points[2].y)
                * scale_half);
        }

        return [
            Conic.from_points([self.points[0].clone(), p0.clone().add(wp1).mul(scale), m_pt.clone()], new_w),
            Conic.from_points([m_pt.clone(), wp1.clone().add(p2).mul(scale), self.points[2].clone()], new_w)
        ]
    }
    static build_unit_arc(
        u_start: Vector2,
        u_stop: Vector2,
        dir: number,
        user_transform: Matrix2D,
        dst: Conic[]
    ) {
        // rotate by x,y so that u_start is (1.0)
        let x = u_start.dot(u_stop);
        let y = u_start.cross(u_stop);

        let abs_y = Math.abs(y);

        // check for (effectively) coincident vectors
        // this can happen if our angle is nearly 0 or nearly 180 (y == 0)
        // ... we use the dot-prod to distinguish between 0 and 180 (x > 0)
        if (abs_y <= SCALAR_NEARLY_ZERO
            && x > 0.0
            && ((y >= 0.0 && dir == PathDirection.CW) || (y <= 0.0 && dir == PathDirection.CCW))) {
            return;
        }

        if (dir == PathDirection.CCW) {
            y = -y;
        }

        // We decide to use 1-conic per quadrant of a circle. What quadrant does [xy] lie in?
        //      0 == [0  .. 90)
        //      1 == [90 ..180)
        //      2 == [180..270)
        //      3 == [270..360)
        //
        let quadrant = 0;
        if (y == 0.0) {
            quadrant = 2; // 180
            // debug_assert!((x + 1.0) <= SCALAR_NEARLY_ZERO);
        } else if (x == 0.0) {
            //  debug_assert!(abs_y - 1.0 <= SCALAR_NEARLY_ZERO);
            quadrant = y > 0.0 ? 1 : 3; // 90 / 270
        } else {
            if (y < 0.0) {
                quadrant += 2;
            }

            if ((x < 0.0) != (y < 0.0)) {
                quadrant += 1;
            }
        }

        let quadrant_points = [
            Vector2.create(1.0, 0.0),
            Vector2.create(1.0, 1.0),
            Vector2.create(0.0, 1.0),
            Vector2.create(-1.0, 1.0),
            Vector2.create(-1.0, 0.0),
            Vector2.create(-1.0, -1.0),
            Vector2.create(0.0, -1.0),
            Vector2.create(1.0, -1.0),
        ];

        const QUADRANT_WEIGHT = SCALAR_ROOT_2_OVER_2;

        let conic_count = quadrant;
        for (let i = 0; i < conic_count; i++) {
            dst[i] = Conic.from_points(quadrant_points.slice(i * 2), QUADRANT_WEIGHT);
        }

        //现在计算最后一个圆锥曲线的剩余（低于 90 度）弧
        let final_pt = Vector2.create(x, y);
        let last_q = quadrant_points[quadrant * 2]; // will already be a unit-vector
        let dot = last_q.dot(final_pt);
        // debug_assert!(0.0 <= dot && dot <= 1.0 + SCALAR_NEARLY_ZERO);

        if (dot < 1.0) {
            let off_curve = Vector2.create(last_q.x + x, last_q.y + y);
            //计算平分线向量，然后重新缩放为曲线外点。
            //我们根据 cos(theta/2) = length /1 计算其长度，使用我们得到的半角恒等式
            //length = sqrt(2 /(1 + cos(theta)). 我们已经有了 cos() 来计算点。
            //这很好，因为我们计算的权重也是 cos(theta/2)！
            let cos_theta_over_2 = Math.sqrt((1.0 + dot) / 2.0);
            off_curve.setLength(1 / cos_theta_over_2);
            if (!last_q.equalsEpsilon(off_curve)) {
                dst[conic_count] = Conic.new(last_q.clone(), off_curve.clone(), final_pt.clone(), cos_theta_over_2);
                conic_count += 1;
            }
        }

        //现在处理逆时针和初始单位开始旋转
        let transform = Matrix2D.fromSinCos(u_start.y, u_start.x);
        if (dir == PathDirection.CCW) {
            transform = transform.preScale(1.0, -1.0);
        }
        transform = transform.premultiply(user_transform);

        // for conic in dst.iter_mut().take(conic_count) {
        //     transform.map_points(&mut conic.points);
        // }
        for (let conic of dst.slice(0, conic_count)) {
            transform.mapPoints(conic.points, conic.points)
        }
        if (conic_count == 0) {
            return
        } else {
            //   Some(&dst[0..conic_count])
            return dst.slice(0, conic_count)
        }
    }
}

export class AutoConicToQuads {
    static compute(pt0: Vector2, pt1: Vector2, pt2: Vector2, weight: number) {
        const conic = Conic.new(pt0.clone(), pt1.clone(), pt2.clone(), weight)
        let pow2 = conic.compute_quad_pow2(0.25)
        let points = Array.from({ length: 64 }, () => Vector2.zero())
        let len = conic.chop_into_quads_pow2(pow2, points)
        return new this(points, len)
    }
    points: Vector2[] = []
    len = 0
    constructor(points: Vector2[], len: number) {
        this.points = points
        this.len = len;
    }

}



export function convertConicToQuads(prevX: number, prevY: number, x0: number, y0: number, x1: number, y1: number, w: number, maxDepth = 3, depth = 0) {
    const quads: any[] = [];
    const epsilon = 0.01; // 权重接近1的阈值

    if (depth >= maxDepth || Math.abs(w - 1) < epsilon) {
        // 直接转换为单个quadTo
        const denominator = 2 * (1 + w);
        const cpx = ((1 - w) * prevX + 4 * w * x0 + (1 - w) * x1) / denominator;
        const cpy = ((1 - w) * prevY + 4 * w * y0 + (1 - w) * y1) / denominator;
        quads.push({ cpx, cpy, x: x1, y: y1 });
    } else {
        // 分割conic为两个子conic（递归）
        const midT = 0.5;

        // 计算分割后的中间点及新权重
        const w_prime = Math.sqrt((1 + w) / 2);

        // 第一个子conic的终点（中点）
        const midX = (prevX + 2 * w * x0 + x1) / (2 * (1 + w));
        const midY = (prevY + 2 * w * y0 + y1) / (2 * (1 + w));

        // 第一个子conic的控制点（原控制点）
        const ctrl1X = (prevX + w * x0) / (1 + w);
        const ctrl1Y = (prevY + w * y0) / (1 + w);

        // 第二个子conic的控制点（新控制点）
        const ctrl2X = (w * x0 + x1) / (1 + w);
        const ctrl2Y = (w * y0 + y1) / (1 + w);

        // 递归处理两个子conic
        quads.push(
            ...convertConicToQuads(prevX, prevY, ctrl1X, ctrl1Y, midX, midY, w_prime, maxDepth, depth + 1),
            ...convertConicToQuads(midX, midY, ctrl2X, ctrl2Y, x1, y1, w_prime, maxDepth, depth + 1)
        );
    }

    return quads;
}

//   // 示例用法：
//   const currentPoint = { x: 100, y: 100 }; // 起点
//   const conicParams = { x0: 150, y0: 200, x1: 300, y1: 100, w: 0.5 }; // conic参数

//   const quadSegments = convertConicToQuads(
//     currentPoint.x, currentPoint.y,
//     conicParams.x0, conicParams.y0,
//     conicParams.x1, conicParams.y1,
//     conicParams.w,
//     3 // 最大分割次数（控制精度）
//   );

//   // 绘制所有quadTo
//   quadSegments.forEach(segment => {
//     ctx.quadraticCurveTo(segment.cpx, segment.cpy, segment.x, segment.y);
//   });




/**
 * 将圆锥曲线转换为二次贝塞尔曲线集合
 * @param {number} x0 - 起点X坐标
 * @param {number} y0 - 起点Y坐标
 * @param {number} x1 - 控制点X坐标
 * @param {number} y1 - 控制点Y坐标
 * @param {number} x2 - 终点X坐标
 * @param {number} y2 - 终点Y坐标
 * @param {number} w - 控制点权重
 * @returns {Array} 二次贝塞尔曲线数组，每个元素为 [P0, P1, P2]
 */
export function conicToBeziers(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number) {
    // 特殊情况处理：权重为1时直接返回原曲线
    if (Math.abs(w - 1) < 1e-6) {
        return [[[x0, y0], [x1, y1], [x2, y2]]];
    }

    // 计算最佳分割参数（根据误差估计）
    const t = findOptimalSplit(x0, y0, x1, y1, x2, y2, w);

    // 使用德卡斯特里奥算法分割曲线
    const [left, right] = splitRationalCurve(x0, y0, x1, y1, x2, y2, w, t);

    // 递归处理子曲线
    const segments: any[] = [];
    if (needsSplit(left.weight)) {
        segments.push(...conicToBeziers(left.p0[0], left.p0[1], left.p1[0], left.p1[1], left.p2[0], left.p2[1], left.weight));
    } else {
        segments.push([left.p0, left.p1, left.p2]);
    }

    if (needsSplit(right.weight)) {
        segments.push(...conicToBeziers(right.p0[0], right.p0[1], right.p1[0], right.p1[1], right.p2[0], right.p2[1], right.weight));
    } else {
        segments.push([right.p0, right.p1, right.p2]);
    }

    return segments;

    // 辅助函数：查找最优分割点
    function findOptimalSplit(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number) {
        // 基于曲率变化的启发式分割算法
        const angle = Math.atan2(y2 - y0, x2 - x0);
        const k = curvatureAt(0.5, x0, y0, x1, y1, x2, y2, w);
        return k > 0.5 ? 0.25 : 0.5;
    }

    // 计算曲率
    function curvatureAt(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number) {
        const [dx, dy] = derivative(t, x0, y0, x1, y1, x2, y2, w);
        const [ddx, ddy] = secondDerivative(t, x0, y0, x1, y1, x2, y2, w);
        return Math.abs(dx * ddy - dy * ddx) / Math.pow(dx * dx + dy * dy, 1.5);
    }

    // 判断是否需要继续分割
    function needsSplit(w: number) {
        return Math.abs(w - 1) > 0.1;
    }

    // 有理曲线分割算法
    function splitRationalCurve(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number, t: number) {
        const w0 = 1, w1 = w, w2 = 1;

        // 第一段曲线
        const q0x = x0;
        const q0y = y0;
        const q1x = (w0 * x0 * (1 - t) + w1 * x1 * t) / (w0 * (1 - t) + w1 * t);
        const q1y = (w0 * y0 * (1 - t) + w1 * y1 * t) / (w0 * (1 - t) + w1 * t);
        const q2x = (w0 * x0 * (1 - t) ** 2 + 2 * w1 * x1 * t * (1 - t) + w2 * x2 * t ** 2) /
            (w0 * (1 - t) ** 2 + 2 * w1 * t * (1 - t) + w2 * t ** 2);
        const q2y = (w0 * y0 * (1 - t) ** 2 + 2 * w1 * y1 * t * (1 - t) + w2 * y2 * t ** 2) /
            (w0 * (1 - t) ** 2 + 2 * w1 * t * (1 - t) + w2 * t ** 2);

        // 第二段曲线
        const r0x = q2x;
        const r0y = q2y;
        const r1x = (w1 * x1 * (1 - t) + w2 * x2 * t) / (w1 * (1 - t) + w2 * t);
        const r1y = (w1 * y1 * (1 - t) + w2 * y2 * t) / (w1 * (1 - t) + w2 * t);
        const r2x = x2;
        const r2y = y2;

        return [
            {
                p0: [q0x, q0y],
                p1: [q1x, q1y],
                p2: [q2x, q2y],
                weight: w0 * (1 - t) ** 2 + 2 * w1 * t * (1 - t) + w2 * t ** 2
            },
            {
                p0: [r0x, r0y],
                p1: [r1x, r1y],
                p2: [r2x, r2y],
                weight: w1 * (1 - t) ** 2 + 2 * w1 * t * (1 - t) + w2 * t ** 2
            }
        ];
    }

    // 导数计算
    function derivative(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number) {
        const numeratorX = 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1);
        const numeratorY = 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1);
        const denominator = (1 - t) ** 2 + 2 * w * t * (1 - t) + t ** 2;
        return [
            (numeratorX * denominator - (x0 * (1 - t) ** 2 + 2 * w * x1 * t * (1 - t) + x2 * t ** 2) * 2 * (w * (1 - 2 * t) - (1 - t) + t)) / denominator ** 2,
            (numeratorY * denominator - (y0 * (1 - t) ** 2 + 2 * w * y1 * t * (1 - t) + y2 * t ** 2) * 2 * (w * (1 - 2 * t) - (1 - t) + t)) / denominator ** 2
        ];
    }

    // 二阶导数计算
    function secondDerivative(t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number) {
        // 简化的二阶导数近似计算
        const dt = 0.001;
        const [dx1, dy1] = derivative(t - dt, x0, y0, x1, y1, x2, y2, w);
        const [dx2, dy2] = derivative(t + dt, x0, y0, x1, y1, x2, y2, w);
        return [
            (dx2 - dx1) / (2 * dt),
            (dy2 - dy1) / (2 * dt)
        ];
    }
}


/****
 * 给定p0,p1,p2三个点连成的夹角线段，radius半径，绘制夹角的弧
 * 
 * @param p0 
 * @param p1 join点
 * @param p2 
 * @param radius 
 * @returns 
 */
export function arcTo(p0: Vector2, p1: Vector2, p2: Vector2, radius: number): null | Vector2[] {
    const n0 = p1.clone().sub(p0).normalize()
    const n1 = p2.clone().sub(p1).normalize()
    const cosh = n0.dot(n1)
    const sinh = n0.cross(n1)
    if (Math.abs(sinh) < 1e-6) {
        return null
    }
    // 切线长度
    // tan(a/2)
    const tangent = Math.abs((1 - cosh) / sinh)
    const dist = radius * tangent
    const k = 4 / 3 * (Math.sqrt(2) - 1)
    const cp1 = p0.clone().add(n0.clone().multiplyScalar(dist * k))
    const cp2 = p2.clone().sub(n1.clone().multiplyScalar(dist * k))
    return [p0, cp1, cp2, p2] // cubicBezier(p0,cp1,cp2,p2)
}

/****
 * 给定p0,p1,p2 
 * 
 * @param p0 原点
 * @param p1 
 * @param p2 
 * @param radius 
 * @returns 
 */
export function arcToFromOrigin(p0: Vector2, p1: Vector2, p2: Vector2, radius: number): null | Vector2[] {
    const n0 = p1.clone().sub(p0).normalize()
    const n1 = p2.clone().sub(p0).normalize()
    const cosh = n0.dot(n1)
    const sinh = n0.cross(n1)
    if (Math.abs(sinh) < 1e-6) {
        return null
    }
    // 切线长度
    // tan(a/2)
    const tangent = Math.abs((1 - cosh) / sinh)
    const dist = radius * tangent
    const k = 4 / 3 * (Math.sqrt(2) - 1) // 弧圆的比例系数，近似值，并非精确值
    // p1和p2的切线方向
    const tangentDir1=n0.clone().cw()
    const tangentDir2=n1.clone().ccw()

    // 交点
    //const intersection=p1.clone().add(tangentDir1.clone().multiplyScalar(dist))
    // weight=Math.sqrt(0.5+cosh*0.5)
    // const cp1 = intersection.clone().sub(tangentDir1.clone().multiplyScalar(dist))
    // const cp2 = intersection.clone().sub(tangentDir2.clone().multiplyScalar(dist))
    // conicTo(cp1,intersection,cp2,weight)
    const cp1 = p1.clone().add(tangentDir1.clone().multiplyScalar(dist * k))
    const cp2 = p2.clone().sub(tangentDir2.clone().multiplyScalar(dist * k))
    return [p0, cp1, cp2, p2] // cubicBezier(p0,cp1,cp2,p2)
}
/****
 * 给定p0,p1,p2三个点和radius半径，绘制夹角的弧
*/
export function arcToWithConic(p0: Vector2, p1: Vector2, p2: Vector2, radius: number): null | Vector2[] {
    const n0 = p1.clone().sub(p0).normalize()
    const n1 = p2.clone().sub(p1).normalize()
    const cosh = n0.dot(n1)
    const sinh = n0.cross(n1)
    if (Math.abs(sinh) < 1e-6) {
        return null
    }
    // 切线长度
    // tan(a/2)
    const tangent = Math.abs((1 - cosh) / sinh)
    const dist = radius * tangent
    const weight = Math.sqrt(0.5 + cosh * 0.5)
    const cp1 = p1.clone().sub(n0.clone().multiplyScalar(dist))
    const cp2 = p1.clone().add(n1.clone().multiplyScalar(dist))
    return conicToCubic(cp1, p1, cp2, weight)
}

export function conicToCubic(p0: Vector2, p1: Vector2, p2: Vector2, w: number, dst: Vector2[] = []) {
    let k = 4.0 * w / (3.0 * (1.0 + w));

    dst[0]=p0.clone()
    dst[1] = Vector2.default().interpolateVectors(p0, p1, k) // p0 + (p1 - p0) * k;
    dst[2] = Vector2.default().interpolateVectors(p2, p1, k)  // p2 + (p1 - p2) * k;
    dst[3] = p2.clone() //p2;

    return dst
}
export function conicToQuadratic(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, w: number
) {
    // 定义原有理曲线的三个控制点
    const P0 = [x0, y0];
    const P1 = [x1, y1];
    const P2 = [x2, y2];

    // 计算左侧中间控制点 Q = (P0 + w*P1) / (1+w)
    const Q = [
        (x0 + w * x1) / (1 + w),
        (y0 + w * y1) / (1 + w)
    ];

    // 计算右侧中间控制点 R = (P2 + w*P1) / (1+w)
    const R = [
        (x2 + w * x1) / (1 + w),
        (y2 + w * y1) / (1 + w)
    ];

    // 计算在 t = 0.5 处的分割点 M = (P0 + 2w*P1 + P2) / (2*(1+w))
    const M = [
        (x0 + 2 * w * x1 + x2) / (2 * (1 + w)),
        (y0 + 2 * w * y1 + y2) / (2 * (1 + w))
    ];

    // 返回两段标准二次 Bézier 曲线
    // 第一段：P0, Q, M
    // 第二段：M, R, P2
    return [
        [P0, Q, M],
        [M, R, P2]
    ];
}

export function conicToQuadratic2(points: Vector2[], w: number) {

    const quads: Vector2[][] = []
    // 假设 T 是一个全局变量，例如：
    let T = 0; // 根据需要调整


    // ratio 函数：计算 p 和 q 之间按比例 t 的插值，返回一个新的 3D 点
    function ratio(t: number, p: Vector2, q: Vector2, r: Vector2) {
        r.interpolateVectors(p, q, t)
    }

    function conic(p: Vector2[], w: number) {
        // delta 的定义：4^(4-T)*|w-1|
        const delta = Math.pow(4, 4 - T) * Math.abs(w - 1);

        if (w && delta > 1) {
            const s = w / (1 + w);
            // 更新 w，用于递归调用
            const newW = Math.sqrt((1 + w) / 2);

            // 定义左右分割的控制点数组，长度均为 3
            const l: Vector2[] = Array.from({ length: 3 }, () => Vector2.zero());
            const r: Vector2[] = Array.from({ length: 3 }, () => Vector2.zero());

            ratio(0, p[0], p[0], l[0]);
            ratio(0, p[2], p[2], r[2]);
            ratio(s, l[0], p[1], l[1]);
            ratio(s, r[2], p[1], r[1]);
            ratio(.5, l[1], r[1], l[2]);
            ratio(0, l[2], l[2], r[0]);

            // 递归细分左右两部分
            conic(l, newW);
            conic(r, newW);
        } else {
            // 收敛时调用 qbezier 绘制贝塞尔曲线（你需要实现 qbezier 函数）
            quads.push(p);
        }
    }
    conic(points, w)
    return quads

}