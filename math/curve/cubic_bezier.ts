import { Box2 } from "../math/box2";
import { Vector2 } from "../math/vec2";
export class CubicBezierCurve {
    constructor(public p0: Vector2, public p1: Vector2, public p2: Vector2, public p3: Vector2) {

    }
/**
 * 求三次 Bézier 曲线上曲率最大的 t 值（解析解，基于求解二次方程）
 * @returns {number} t 值，取值范围 [0,1]
 */
    getMaxCurvature() {
        const p0 = this.p0, p1 = this.p1, p2 = this.p2,p3=this.p3
    // 定义辅助函数：点积和二维叉乘（标量）
    function dot(u, v) { return u.x * v.x + u.y * v.y; }
    function cross(u, v) { return u.x * v.y - u.y * v.x; }
    
    // 计算基本差分向量
    const A = { x: p1.x - p0.x, y: p1.y - p0.y };
    const B = { x: p2.x - p1.x, y: p2.y - p1.y };
    const C = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    // 辅助向量
    const V = { x: p3.x - 3*p2.x + 3*p1.x - p0.x, y: p3.y - 3*p2.y + 3*p1.y - p0.y };
    
    // 根据推导得到下列系数（注意：这只是一种形式）
    const a = dot(V, V) * cross(B, C) - 3 * dot(A, V) * cross(A, V);
    const b = 2 * dot(V, V) * cross(A, C) - 3 * dot(A, V) * (cross(A, V) + cross(B, V));
    const c = dot(V, V) * cross(A, B) - 3 * dot(A, V) * cross(A, V);
    
    // 求二次方程的两个解（若 a 为 0，则退化为线性方程）
    let tCandidates:number[] = [];
    if (Math.abs(a) > 1e-12) {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const sqrtDisc = Math.sqrt(disc);
        tCandidates.push((-b + sqrtDisc) / (2 * a));
        tCandidates.push((-b - sqrtDisc) / (2 * a));
      }
    } else {
      // 线性情况：a≈0，直接解 bt+c=0
      if (Math.abs(b) > 1e-12) {
        tCandidates.push(-c / b);
      }
    }
    // 同时考虑端点
    tCandidates.push(0);
    tCandidates.push(1);
    
    // 定义计算曲率的函数（与前述公式一致）
    function curvature(t) {
      const oneMinusT = 1 - t;
      // 一阶导数 B'(t)
      const bp = {
        x: 3 * (oneMinusT * oneMinusT * (p1.x - p0.x) +
                2 * t * oneMinusT * (p2.x - p1.x) +
                t * t * (p3.x - p2.x)),
        y: 3 * (oneMinusT * oneMinusT * (p1.y - p0.y) +
                2 * t * oneMinusT * (p2.y - p1.y) +
                t * t * (p3.y - p2.y))
      };
      // 二阶导数 B''(t)
      const bpp = {
        x: 6 * (oneMinusT * (p2.x - 2*p1.x + p0.x) + t * (p3.x - 2*p2.x + p1.x)),
        y: 6 * (oneMinusT * (p2.y - 2*p1.y + p0.y) + t * (p3.y - 2*p2.y + p1.y))
      };
      const crossVal = Math.abs(bp.x * bpp.y - bp.y * bpp.x);
      const normBp = Math.hypot(bp.x, bp.y);
      return (normBp === 0) ? 0 : crossVal / Math.pow(normBp, 3);
    }
    
    // 在候选解中挑选落在 [0,1] 内且曲率最大的 t
    let tMax = 0, maxKappa = -Infinity;
    for (const t of tCandidates) {
      if (t >= 0 && t <= 1) {
        const k = curvature(t);
        if (k > maxKappa) {
          maxKappa = k;
          tMax = t;
        }
      }
    }
    return tMax;
  }
  
    /**
     * 计算贝塞尔曲线上的点
     * @param t 参数 t
     */
    evaluateAt(t: number): Vector2 {
        const one_minus_t = 1 - t;
        const one_minus_t_squared = one_minus_t * one_minus_t;
        const a = one_minus_t_squared * one_minus_t;
        const b = 3 * one_minus_t_squared * t;
        const t_squared = t * t;
        const c = 3 * one_minus_t * t_squared;
        const d = t_squared * t;
        const x = this.p0.x * a + this.p1.x * b + this.p2.x * c + this.p3.x * d;
        const y = this.p0.y * a + this.p1.y * b + this.p2.y * c + this.p3.y * d;
        return Vector2.create(x, y);
    }

    /**
     * 计算贝塞尔曲线的导数
     * @param t 参数 t
     */
    derivativeAt(t: number): Vector2 {
        const one_minus_t = 1 - t;
        const dt0 = -3 * one_minus_t * one_minus_t;
        const dt1 = 3 * one_minus_t * one_minus_t - 6 * one_minus_t * t;
        const dt2 = 6 * one_minus_t * t - 3 * t * t;
        const dt3 = 3 * t * t;
        const x = this.p0.x * dt0 + this.p1.x * dt1 + this.p2.x * dt2 + this.p3.x * dt3;
        const y = this.p0.y * dt0 + this.p1.y * dt1 + this.p2.y * dt2 + this.p3.y * dt3;
        return Vector2.create(x, y);
    }

    /**
     * 计算贝塞尔曲线的二阶导数
     * @param t 参数 t
     */
    secondDerivativeAt(t: number): Vector2 {
        const ddt0 = 6 * (1 - t);
        const ddt1 = -12 * (1 - t) + 6 * t;
        const ddt2 = 6 * (1 - t) - 12 * t;
        const ddt3 = 6 * t;
        const x = this.p0.x * ddt0 + this.p1.x * ddt1 + this.p2.x * ddt2 + this.p3.x * ddt3;
        const y = this.p0.y * ddt0 + this.p1.y * ddt1 + this.p2.y * ddt2 + this.p3.y * ddt3;
        return Vector2.create(x, y);
    }

    /**
     * 找到曲线上离点 p 最近的点对应的参数 t
     * @param p 目标点
     * @param tolerance 容差
     * @param maxIterations 最大迭代次数
     */
    findClosestT(p: Vector2, tolerance: number = 1e-6, maxIterations: number = 100): number {
        let t = 0.5; // 初始猜测
        for (let i = 0; i < maxIterations; i++) {
            const B = this.evaluateAt(t); // 当前点
            const dB = this.derivativeAt(t); // 一阶导数
            const ddB = this.secondDerivativeAt(t); // 二阶导数

            // 计算 f(t) 和 f'(t)
            const f = B.sub(p); // f(t) = B(t) - p
            const df = dB; // f'(t) = B'(t)
            const ddf = ddB; // f''(t) = B''(t)

            // 计算牛顿迭代的 delta t
            const numerator = f.dot(df);
            const denominator = df.dot(df) + f.dot(ddf);
            const dt = numerator / denominator;

            // 更新 t
            t -= dt;

            // 检查收敛
            if (Math.abs(dt) < tolerance) {
                return t;
            }
        }
        throw new Error("未能在最大迭代次数内收敛");
    }

    /**
     * 找到曲线上离点 p 最近的点对应的参数 t，并限制在 [0, 1] 范围内
     * @param p 目标点
     * @param tolerance 容差
     * @param maxIterations 最大迭代次数
     */
    findClosestTClamped(p: Vector2, tolerance: number = 1e-6, maxIterations: number = 100): number {
        const t = this.findClosestT(p, tolerance, maxIterations);
        return Math.min(1, Math.max(0, t)); // 限制 t 在 [0, 1] 范围内
    }
    /**
     * 细分三次贝塞尔曲线
     * @param t 细分参数 (0 到 1)
     * @returns 两条新的贝塞尔曲线
     */
    subdivide(t: number): [CubicBezierCurve, CubicBezierCurve] {
        Vector2.beginPools()
        // 第一层插值
        const q0 = Vector2.pool().interpolateVectors(this.p0, this.p1, t);
        const q1 = Vector2.pool().interpolateVectors(this.p1, this.p2, t);
        const q2 = Vector2.pool().interpolateVectors(this.p2, this.p3, t);

        // 第二层插值
        const r0 = Vector2.pool().interpolateVectors(q0, q1, t);
        const r1 = Vector2.pool().interpolateVectors(q1, q2, t);

        // 第三层插值（细分点）
        const s = Vector2.pool().interpolateVectors(r0, r1, t);

        // 第一条曲线的控制点
        const curve1 = new CubicBezierCurve(this.p0.clone(), q0, r0, s);

        // 第二条曲线的控制点
        const curve2 = new CubicBezierCurve(s, r1, q2, this.p3.clone());
        Vector2.endPools()
        return [curve1, curve2];
    }
    /**
       * 计算三次贝塞尔曲线的多项式系数
       * @returns 多项式系数 [C0, C1, C2, C3]
       */
    getPolynomialCoefficients(): [Vector2, Vector2, Vector2, Vector2] {
        const C0 = this.p0.clone();
        const C1 = this.p1.clone().subtract(this.p0).multiplyScalar(3);
        const C2 = this.p0.clone().multiplyScalar(3)
            .subtract(this.p1.clone().multiplyScalar(6))
            .add(this.p2.clone().multiplyScalar(3));
        const C3 = this.p3.clone()
            .subtract(this.p2.clone().multiplyScalar(3))
            .add(this.p1.clone().multiplyScalar(3))
            .subtract(this.p0.clone());

        return [C0, C1, C2, C3];
    }
    getBounds():Box2{
        const p0=this.p0, p1=this.p1, p2=this.p2,p3=this.p3;
         // 二次方程求解函数
         function solveQuadratic(a:number, b:number, c:number) {
            if (Math.abs(a) < 1e-12) {
                if (Math.abs(b) < 1e-12) {
                    return [];
                } else {
                    return [-c / b];
                }
            } else {
                var discriminant = b * b - 4 * a * c;
                if (discriminant < 0) {
                    return [];
                } else if (Math.abs(discriminant) < 1e-12) {
                    return [-b / (2 * a)];
                } else {
                    var sqrtD = Math.sqrt(discriminant);
                    return [(-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a)];
                }
            }
        }

        var tValues:number[] = [0, 1];

        // 计算 x 方向的极值点
        var aX = 9 * (p1.x - p2.x) + 3 * (p3.x - p0.x);
        var bX = 6 * (p2.x + p0.x - 2 * p1.x);
        var cX = 3 * (p1.x - p0.x);
        var tValuesX = solveQuadratic(aX, bX, cX);
        tValues = tValues.concat(tValuesX.filter(t => t >= 0 && t <= 1));

        // 计算 y 方向的极值点
        var aY = 9 * (p1.y - p2.y) + 3 * (p3.y - p0.y);
        var bY = 6 * (p2.y + p0.y - 2 * p1.y);
        var cY = 3 * (p1.y - p0.y);
        var tValuesY = solveQuadratic(aY, bY, cY);
        tValues = tValues.concat(tValuesY.filter(t => t >= 0 && t <= 1));

        // 去重
        tValues = [...new Set(tValues)];

        // 计算所有 t 对应的点
        var points = tValues.map(function (t) {
            var oneMinusT = 1 - t;
            var x = oneMinusT * oneMinusT * oneMinusT * p0.x
                + 3 * t * oneMinusT * oneMinusT * p1.x
                + 3 * t * t * oneMinusT * p2.x
                + t * t * t * p3.x;
            var y = oneMinusT * oneMinusT * oneMinusT * p0.y
                + 3 * t * oneMinusT * oneMinusT * p1.y
                + 3 * t * t * oneMinusT * p2.y
                + t * t * t * p3.y;
            return Vector2.pool(x,y);
        });


        const box=Box2.default()
        points.forEach(p=>{
            box.expandByPoint(p)
            p.release()
        })
        return box
    }
}




  /**
   * 计算两点的中点
   */
  function midpoint(p: Vector2, q: Vector2): Vector2 {
    return Vector2.create((p.x + q.x) / 2, (p.y + q.y) / 2 );
  }
  
  /**
   * 计算点 p 到直线 a-b 的距离
   */
  function pointLineDistance(p: Vector2, a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const denominator = Math.hypot(dx, dy);
    if (denominator === 0) {
      return Math.hypot(p.x - a.x, p.y - a.y);
    }
    // 直线的一般式 Ax + By + C = 0 中，A = dy, B = -dx, C = b.x * a.y - b.y * a.x
    const numerator = Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x);
    return numerator / denominator;
  }
  
  /**
   * 判断三次贝塞尔曲线是否“平坦”，即控制点到端点直线的最大距离是否小于容差 tolerance。
   */
  function isFlatEnough(
    p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2,
    tolerance: number
  ): boolean {
    const d1 = pointLineDistance(p1, p0, p3);
    const d2 = pointLineDistance(p2, p0, p3);
    return Math.max(d1, d2) <= tolerance;
  }
  
  /**
   * 细分三次贝塞尔曲线，并返回近似该曲线的多边形顶点数组（包含起点和终点）。
   * @param p0 起始点
   * @param p1 控制点1
   * @param p2 控制点2
   * @param p3 终点
   * @param tolerance 容差，数值越小，近似越精细
   */
  function approximateCubicBezier(
    p0: Vector2,
    p1: Vector2,
    p2: Vector2,
    p3: Vector2,
    tolerance: number = 0.5
  ): Vector2[] {
    const points: Vector2[] = [];
    // 将 p0 加入结果
    points.push(p0);
  
    /**
     * 递归细分函数：
     * 当曲线平坦时，只添加终点 p3；否则细分成两条子曲线递归处理。
     */
    function recursiveSubdivide(p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2): void {
      if (isFlatEnough(p0, p1, p2, p3, tolerance)) {
        // 平坦，则近似为一条直线，添加终点
        points.push(p3);
      } else {
        // 使用 de Casteljau 算法细分曲线为两条子曲线
        const q0 = midpoint(p0, p1);
        const q1 = midpoint(p1, p2);
        const q2 = midpoint(p2, p3);
  
        const r0 = midpoint(q0, q1);
        const r1 = midpoint(q1, q2);
  
        const s = midpoint(r0, r1); // 曲线中点
  
        // 先处理左半部分，再处理右半部分
        recursiveSubdivide(p0, q0, r0, s);
        recursiveSubdivide(s, r1, q2, p3);
      }
    }
  
    recursiveSubdivide(p0, p1, p2, p3);
    return points;
  }
  
 
  