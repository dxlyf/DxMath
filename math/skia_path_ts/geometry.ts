import { SkConic } from "../2d_path/geometry";
import { Matrix } from "./matrix";
import { Point } from "./point";
import { SkScalarIsNaN } from "./scalar";
import { FloatPoint } from "./util";



export class SkCubicCoeff{
    constructor(src:Point[]) {
        const P0 = src[0].clone()
        const P1 = src[1].clone()
        const P2 = src[2].clone()
        const P3 = src[3].clone()
       let three=Point.splat(3);
        this.fA.copy(P3).add(three.clone().multiplySubtractVectors(P1,P2)).subtract(P0)
        this.fB.copy(three).multiply(P2.clone().subtract(P1.clone().multiplyScalar(2))).add(P0)
        this.fC.copy(three).multiplySubtractVectors(P1,P0);
        this.fD = P0;
    }
     eval(t:Point) {
        return this.fA.clone().multiply(t).add(this.fB).multiply(t).add(this.fC).multiply(t).add(this.fD);
     }
     fA:Point;
     fB:Point;
     fC:Point;
     fD:Point;
}

const     kQuadCount = 8 // should handle most conics
const     kPointCount = 1 + 2 * kQuadCount

export class SkAutoConicToQuads{

     fStorage;
     fQuadCount=0; // #quads for current usage
     computeQuads(conic:SkConic, SkScalar tol) {
        int pow2 = conic.computeQuadPOW2(tol);
        fQuadCount = 1 << pow2;
        SkPoint* pts = fStorage.reset(1 + 2 * fQuadCount);
        fQuadCount = conic.chopIntoQuadsPOW2(pts, pow2);
        return pts;
    }
    omputeQuads(conic:SkConic,tol:number):this
    computeQuads(  pts:Point[],weight:number, tol:number):this
    computeQuads( ...args:any[]) {
        let conic;
        conic.set(pts, weight);
        this.computeQuads(conic, tol);
        return this
    }
  
     countQuads()  { return this.fQuadCount; }
}
enum SkRotationDirection {
    kCW_SkRotationDirection,
    kCCW_SkRotationDirection
};

export class SkConic {

    static kMaxConicsForArc=5
    static make(n:number){
        return Array.from({ length: n }, (_, i) => new SkConic())
    }
    static BuildUnitArc(uStart: Point, uStop: Point, dir: SkRotationDirection, userMatrix: Matrix, dst: SkConic[]) {
        // 计算点积和叉积
        let x = uStart.dot(uStop);
        let y = uStart.cross(uStop);
        const absY = Math.abs(y);
        const SK_Scalar1 = 1
        const SK_ScalarNearlyZero = SK_Scalar1 / (1 << 12)
        // 检查向量是否几乎重合（角度接近 0 或 180 度，y == 0）
        if (
            absY <= SK_ScalarNearlyZero &&
            x > 0 &&
            ((y >= 0 && !dir) ||
                (y <= 0 && dir))
        ) {
            return 0;
        }

        if (dir) {
            y = -y;
        }

        // 计算落在第几个象限
        let quadrant = 0;
        if (y === 0) {
            quadrant = 2; // 180度
            console.assert(
                Math.abs(x + SK_Scalar1) <= SK_ScalarNearlyZero,
                "Assertion failed: |x + 1| <= nearlyZero"
            );
        } else if (x === 0) {
            console.assert(
                Math.abs(absY - SK_Scalar1) <= SK_ScalarNearlyZero,
                "Assertion failed: |absY - 1| <= nearlyZero"
            );
            quadrant = y > 0 ? 1 : 3; // 90度 或 270度
        } else {
            if (y < 0) {
                quadrant += 2;
            }
            if ((x < 0) !== (y < 0)) {
                quadrant += 1;
            }
        }

        // 定义象限点数组（用于构造单位圆弧的 conic 分段）
        const quadrantPts: Point[] = [
            Point.create(1, 0),
            Point.create(1, 1),
            Point.create(0, 1),
            Point.create(-1, 1),
            Point.create(-1, 0),
            Point.create(-1, -1),
            Point.create(0, -1),
            Point.create(1, -1),
        ];
        const quadrantWeight = 0.707106781;

        let conicCount = quadrant;
        // 使用每个完整象限（90度）构造 conic
        for (let i = 0; i < conicCount; i++) {
            // 取出连续 3 个点（注意数组循环取模）
            const pts: Point[] = [
                quadrantPts[(i * 2) % quadrantPts.length].clone(),
                quadrantPts[(i * 2 + 1) % quadrantPts.length].clone(),
                quadrantPts[(i * 2 + 2) % quadrantPts.length].clone(),
            ];
            dst[i] = new SkConic(pts[0], pts[1], pts[2], quadrantWeight);
        }

        // 计算剩余部分（小于 90 度）的弧段
        const finalP: Point = Point.create(x, y);
        const lastQ = quadrantPts[(quadrant * 2) % quadrantPts.length]; // 已是单位向量
        const dotVal = lastQ.dot(finalP)
        console.assert(
            dotVal >= 0 && dotVal <= SK_Scalar1 + SK_ScalarNearlyZero,
            "Assertion failed: dot in [0,1]"
        );

        if (dotVal < 1) {
            const offCurve: Point = Point.create(lastQ.x + x, lastQ.y + y);
            // 计算半角余弦
            const cosThetaOver2 = Math.sqrt((1 + dotVal) / 2);
            // 调整 offCurve 的长度，使其为 1/cosThetaOver2

            offCurve.setLength(1 / cosThetaOver2)
            if (!lastQ.equalsEpsilon(offCurve)) {
                dst[conicCount] = new SkConic(lastQ, offCurve, finalP, cosThetaOver2);
                conicCount++;
            }
        }

        // 处理初始单位向量旋转和逆时针情况
        const matrix = Matrix.identity();
        // C++ 中调用 matrix.setSinCos(uStart.fY, uStart.fX)，这里用 uStart.y 和 uStart.x
        matrix.setSinCos(uStart.y, uStart.x);
        if (dir) {
            matrix.preScale(SK_Scalar1, -SK_Scalar1);
        }
        if (userMatrix) {
            matrix.preConcat(userMatrix);
        }
        // 对每个 conic 的控制点进行矩阵变换（假设每个 conic 有 3 个控制点）
        for (let i = 0; i < conicCount; i++) {
            matrix.mapPoints(dst[i].fPts, dst[i].fPts);
        }

        return conicCount;
    }

    fPts: Vector2[] =[]
    fW: number = 1
    constructor();
    constructor(p0: Vector2, p1: Vector2, p2: Vector2, w: number);
    constructor(pts: Vector2[], w: number);
    constructor(...args: any[]) {
        this.fPts=Vector2.makeZeroArray(3)
        if (args.length == 4) {
            const p0 = args[0], p1 = args[1], p2 = args[2], w = args[3];
            this.set(p0, p1, p2, w);
        } else if (args.length === 2) {
            const pts = args[0], w = args[1];
            this.set(pts, w);
        }
    }

    set(p0: Vector2, p1: Vector2, p2: Vector2, w: number):void;
    set(pts: Vector2[], w: number):void;
    set(...args: any[]) {
        let w = 1
        if (args.length === 2) {
            const pts = args[0] as Vector2[]
            w = args[1]

            this.fPts.forEach((p,i)=>{
                p.copy(pts[i])
            })
        } else if (args.length === 4) {
            this.fPts[0].copy(args[0])
            this.fPts[1].copy(args[1])
            this.fPts[2].copy(args[2])
            w = args[3]

        }
        this.setW(w);
    }

    setW(w: number) {
        // Guard against bad weights by forcing them to 1.
        this.fW = w > 0 && Number.isFinite(w) ? w : 1;
    }

    /**
     *  Given a t-value [0...1] return its position and/or tangent.
     *  If pos is not null, return its position at the t-value.
     *  If tangent is not null, return its tangent at the t-value. NOTE the
     *  tangent value's length is arbitrary, and only its direction should
     *  be used.
     */
    evalAt(t: number);
    evalAt(t: number, pos: Vector2, tangent: Vector2)
    evalAt(...args: any[]) {

    };
    chopAt(t, dst: SkConic[])
    chopAt(t1, t2, dst: SkConic[])
    chopAt(...args: any[]) {

    }
    chop(dst: SkConic[]) {

    };

    evalTangentAt(t: number) {

    }

    computeAsQuadError(err: Vector2) {

    };
    asQuadTol(tol: number) {

    };

    /**
     *  return the power-of-2 number of quads needed to approximate this conic
     *  with a sequence of quads. Will be >= 0.
     */
    computeQuadPOW2(tol: number) {

    }

    /**
     *  Chop this conic into N quads, stored continguously in pts[], where
     *  N = 1 << pow2. The amount of storage needed is (1 + 2 * N)
     */
    chopIntoQuadsPOW2(pts: Vector2[], pow2: number) {

    }

    findMidTangent() {

    }
    findXExtrema(t: number) { };
    findYExtrema(t: number) { };
    chopAtXExtrema(dst: SkConic[]) { };
    chopAtYExtrema(dst: SkConic[]) { };

    computeTightBounds(bounds: BoundingRect) {

    };
    computeFastBounds(bounds: BoundingRect) {

    }

};