import { Box2 } from "../math/box2";
import { Vector2 } from "../math/vec2";

function pointOnLineSegmentDistance(p: Vector2, a: Vector2, b: Vector2) {
    const ab = Vector2.default().subVectors(b, a);
    const t = Math.max(0, Math.min(1, p.dot(ab) / ab.lengthSq()));
    const proj = Vector2.default().addVectors(a, ab.multiplyScalar(t))
    return p.clone().sub(proj).length();
}

export class QuadraticBezierCurve {
    constructor(public p0: Vector2, public p1: Vector2, public p2: Vector2) {

    }
    // 计算最大曲率
    /**
    * 求二次 Bézier 曲线上曲率最大的 t 值（解析解）
    * @returns {number} t 值，取值范围 [0,1]
    */
    getMaxCurvature() {
        const p0 = this.p0, p1 = this.p1, p2 = this.p2
        // 定义向量 A = P1-P0, D = P2-2P1+P0
        const A = { x: p1.x - p0.x, y: p1.y - p0.y };
        const D = { x: p2.x - 2 * p1.x + p0.x, y: p2.y - 2 * p1.y + p0.y };

        // 辅助函数：点积、模长平方
        function dot(u, v) { return u.x * v.x + u.y * v.y; }
        function normSq(u) { return dot(u, u); }

        // 若 D 退化为零向量，则曲线退化为直线，曲率恒为 0
        if (normSq(D) === 0) return 0;

        // 求最优 t（极值）
        let t = -dot(A, D) / normSq(D);
        // 限制 t 落在 [0,1]
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        return t;
    }

    getPoints(tolerance: number = 100) {
        const points: Vector2[] = []
        points.push(this.p0.clone())
        const deCasteljau = (p0: Vector2, p1: Vector2, p2: Vector2, tolerance = 1) => {
            const d1 = pointOnLineSegmentDistance(p1, p0, p2)
            if (d1 <= tolerance) {
                points.push(p1)
                return
            }
            const [curve1, curve2] = this.subdivide(0.5)
            deCasteljau(curve1.p0, curve1.p1, curve1.p2, tolerance)
            deCasteljau(curve2.p0, curve2.p1, curve2.p2, tolerance)
        }
        deCasteljau(this.p0, this.p1, this.p2, tolerance)
        points.push(this.p2.clone())
    }
    /**
     * 计算贝塞尔曲线上的点
     * @param t 参数 t
     */
    evaluateAt(t: number): Vector2 {
        const one_minus_t = 1 - t;
        const a = one_minus_t * one_minus_t;
        const b = 2 * one_minus_t * t;
        const c = t * t;
        const x = this.p0.x * a + this.p1.x * b + this.p2.x * c;
        const y = this.p0.y * a + this.p1.y * b + this.p2.y * c;
        return Vector2.create(x, y);
    }

    /**
     * 细分二次贝塞尔曲线
     * @param t 细分参数 (0 到 1)
     * @returns 两条新的贝塞尔曲线
     */
    subdivide(t: number): [QuadraticBezierCurve, QuadraticBezierCurve] {
        Vector2.beginPools();

        // 第一层插值
        const q0 = Vector2.pool().interpolateVectors(this.p0, this.p1, t);
        const q1 = Vector2.pool().interpolateVectors(this.p1, this.p2, t);

        // 第二层插值
        const s = Vector2.pool().interpolateVectors(q0, q1, t);

        // 第一条曲线的控制点
        const curve1 = new QuadraticBezierCurve(this.p0.clone(), q0, s);

        // 第二条曲线的控制点
        const curve2 = new QuadraticBezierCurve(s, q1, this.p2.clone());

        Vector2.endPools();
        return [curve1, curve2];
    }

    /**
 * 计算二次贝塞尔曲线的多项式系数
 * @returns 多项式系数 [C0, C1, C2]
 */
    getPolynomialCoefficients(): [Vector2, Vector2, Vector2] {
        const C0 = this.p0.clone();
        const C1 = this.p1.clone().subtract(this.p0).multiplyScalar(2);
        const C2 = this.p0.clone().subtract(this.p1.clone().multiplyScalar(2)).add(this.p2.clone());
        return [C0, C1, C2];
    }

    /**
     * 计算二次贝塞尔曲线的导数
     * @param t 参数 t
     */
    derivativeAt(t: number): Vector2 {
        const [C1, C2] = this.getPolynomialCoefficients().slice(1);
        const x = C1.x + 2 * C2.x * t;
        const y = C1.y + 2 * C2.y * t;
        return Vector2.create(x, y);
    }

    /**
    * 使用黄金分割搜索找到曲线上离点 p 最近的点对应的参数 t
    * @param p 目标点
    * @param tolerance 容差
    * @param maxIterations 最大迭代次数
    */
    findClosestT(p: Vector2, tolerance: number = 1e-6, maxIterations: number = 100): number {
        const goldenRatio = (Math.sqrt(5) - 1) / 2; // 黄金分割比例
        let a = 0;
        let b = 1;
        let t1 = a + (1 - goldenRatio) * (b - a);
        let t2 = a + goldenRatio * (b - a);

        let f1 = this.evaluateAt(t1).distanceToSquared(p);
        let f2 = this.evaluateAt(t2).distanceToSquared(p);

        for (let i = 0; i < maxIterations; i++) {
            if (f1 < f2) {
                b = t2;
                t2 = t1;
                f2 = f1;
                t1 = a + (1 - goldenRatio) * (b - a);
                f1 = this.evaluateAt(t1).distanceToSquared(p);
            } else {
                a = t1;
                t1 = t2;
                f1 = f2;
                t2 = a + goldenRatio * (b - a);
                f2 = this.evaluateAt(t2).distanceToSquared(p);
            }

            // 检查是否收敛
            if (Math.abs(b - a) < tolerance) {
                return (a + b) / 2;
            }
        }
        throw new Error("未能在最大迭代次数内收敛");
    }

    /**
     * 计算二次贝塞尔曲线的长度（近似值）
     * @param samples 采样点数
     */
    approximateLength(samples: number = 100): number {
        let length = 0;
        let prevPoint = this.evaluateAt(0);

        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const currentPoint = this.evaluateAt(t);
            length += currentPoint.distanceTo(prevPoint);
            prevPoint = currentPoint;
        }

        return length;
    }
    getBounds(): Box2 {
        const p0 = this.p0, p1 = this.p1, p2 = this.p2
        var tValues = [0, 1];

        // 计算 x 方向的极值点
        var a = p1.x - p0.x;
        var b = p2.x - 2 * p1.x + p0.x;
        if (Math.abs(b) >= 1e-12) {
            var t = -a / b;
            if (t >= 0 && t <= 1) {
                tValues.push(t);
            }
        }
        // 计算 y 方向的极值点
        var aY = p1.y - p0.y;
        var bY = p2.y - 2 * p1.y + p0.y;
        if (Math.abs(bY) >= 1e-12) {
            var tY = -aY / bY;
            if (tY >= 0 && tY <= 1) {
                tValues.push(tY);
            }
        }

        // 去重
        tValues = [...new Set(tValues)];

        // 计算所有 t 对应的点
        var points = tValues.map(function (t) {
            var oneMinusT = 1 - t;
            var x = oneMinusT * oneMinusT * p0.x + 2 * t * oneMinusT * p1.x + t * t * p2.x;
            var y = oneMinusT * oneMinusT * p0.y + 2 * t * oneMinusT * p1.y + t * t * p2.y;
            return Vector2.pool(x, y);
        });

        const box = Box2.default()
        points.forEach(p => {
            box.expandByPoint(p)
            p.release()
        })
        return box
    }
}


interface Point {
    x: number;
    y: number;
  }
  
  class QuadraticBezierCurve2 {
    constructor(
      private p0: Point,
      private p1: Point,
      private p2: Point
    ) {}
  
    getPoint(t: number): Point {
      const u = 1 - t;
      return {
        x: u * u * this.p0.x + 2 * u * t * this.p1.x + t * t * this.p2.x,
        y: u * u * this.p0.y + 2 * u * t * this.p1.y + t * t * this.p2.y
      };
    }
  
    getRoots(): number[] {
      return this.solveQuadratic(
        this.p0.y - 2 * this.p1.y + this.p2.y,
        2 * (this.p1.y - this.p0.y),
        this.p0.y
      ).filter(t => t >= 0 && t <= 1);
    }
  
    getBounds(): { min: Point; max: Point } {
      const xExtrema = this.getExtrema('x');
      const yExtrema = this.getExtrema('y');
      
      const points = [0, 1, ...xExtrema, ...yExtrema]
        .filter(t => t >= 0 && t <= 1)
        .map(t => this.getPoint(t));
      
      return {
        min: {
          x: Math.min(...points.map(p => p.x)),
          y: Math.min(...points.map(p => p.y))
        },
        max: {
          x: Math.max(...points.map(p => p.x)),
          y: Math.max(...points.map(p => p.y))
        }
      };
    }
  
    getMaxCurvature(): number {
      const [t1, t2] = this.getCurvatureCriticalPoints();
      const curvatures = [0, 1, t1, t2]
        .filter(t => t !== null && t >= 0 && t <= 1)
        .map(t => this.calculateCurvature(t!));
      
      return Math.max(...curvatures);
    }
  
    getLength(): number {
      return this.simpsonIntegration(0, 1, 1e-4);
    }
  
    private solveQuadratic(a: number, b: number, c: number): number[] {
      if (Math.abs(a) < 1e-9) {
        return Math.abs(b) < 1e-9 ? [] : [-c / b];
      }
  
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) return [];
      const sqrtD = Math.sqrt(discriminant);
      return [(-b + sqrtD) / (2 * a), (-b - sqrtD) / (2 * a)];
    }
  
    private getExtrema(axis: keyof Point): number[] {
      const a = this.p0[axis];
      const b = this.p1[axis];
      const c = this.p2[axis];
      const denominator = a - 2 * b + c;
      
      if (denominator === 0) return [];
      const t = (a - b) / denominator;
      return t >= 0 && t <= 1 ? [t] : [];
    }
  
    private getCurvatureCriticalPoints(): (number | null)[] {
      const B1 = { x: this.p1.x - this.p0.x, y: this.p1.y - this.p0.y };
      const B2 = { x: this.p2.x - 2 * this.p1.x + this.p0.x, y: this.p2.y - 2 * this.p1.y + this.p0.y };
      
      const a = B2.x * B2.x + B2.y * B2.y;
      const b = 3 * (B1.x * B2.x + B1.y * B2.y);
      const c = 2 * (B1.x * B1.x + B1.y * B1.y);
      
      return this.solveQuadratic(a, b, c);
    }
  
    private calculateCurvature(t: number): number {
      const d = this.getFirstDerivative(t);
      const dd = this.getSecondDerivative();
      const cross = d.x * dd.y - d.y * dd.x;
      const denominator = Math.pow(d.x * d.x + d.y * d.y, 1.5);
      return Math.abs(denominator < 1e-8 ? 0 : cross / denominator);
    }
  
    private getFirstDerivative(t: number): Point {
      return {
        x: 2 * ((1 - t) * (this.p1.x - this.p0.x) + t * (this.p2.x - this.p1.x)),
        y: 2 * ((1 - t) * (this.p1.y - this.p0.y) + t * (this.p2.y - this.p1.y))
      };
    }
  
    private getSecondDerivative(): Point {
      return {
        x: 2 * (this.p2.x - 2 * this.p1.x + this.p0.x),
        y: 2 * (this.p2.y - 2 * this.p1.y + this.p0.y)
      };
    }
  
    private simpsonIntegration(a: number, b: number, eps: number): number {
      const n = 4;
      const h = (b - a) / n;
      let sum = this.speedAt(a) + this.speedAt(b);
      
      for (let i = 1; i < n; i++) {
        sum += i % 2 === 0 ? 2 * this.speedAt(a + i * h) : 4 * this.speedAt(a + i * h);
      }
      
      return (h / 3) * sum;
    }
  
    private speedAt(t: number): number {
      const d = this.getFirstDerivative(t);
      return Math.sqrt(d.x * d.x + d.y * d.y);
    }
  }