import { Box2 } from '../math/box2';
import { Matrix3 } from '../math/mat3'
import { Vector2 } from '../math/vec2'
import { Rect } from '../math/rrect'
import {Color} from '../math/color'
enum PATH_VERBS {
    MOVE,
    LINE,
    QUAD,
    CUBIC,
    CLOSE
}
enum PaintStyle{
    fill,
    stroke,
    fillAndStroke
}
enum FillRule{
    nonZero,
    evenOdd
}
enum LineJoin{
    bevel,
    round,
    miter
}
enum LineCap{
    butt,
    round,
    square
}
type Paint={
    style:PaintStyle
    color:Color
    lineWidth:number
    lineJoin:LineJoin
    lineCap:LineCap
    miterLimit:number
    fillRule;FillRule
}




export const PathEncoding = {
    Absolute: 0,
    Relative: 1
}

export function fromSVGString(data:string,path:PathBuilder) {
    let m, lastCmd;
    let x = 0, y = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0
    const REG_SVG_PATH_DATA = /([mlhvcsqtaz])([^mlhvcsqtaz]*)/gi
    while ((m = REG_SVG_PATH_DATA.exec(data))) {
        const cmd = m[1].trim()
        const upperCmd = cmd.toUpperCase()
        const args = m[2].trim().split(/[\s,]/g).map(Number)
        const isRelative = cmd !== upperCmd
        switch (cmd) {
            case "M": //M x y
            case "m":
                x = isRelative ? x + args[0] : args[0]
                y = isRelative ? y + args[1] : args[1]
                path.moveTo(x, y)
                break
            case "L": // L x y
            case "l":
                x = isRelative ? x + args[0] : args[0]
                y = isRelative ? y + args[1] : args[1]
                path.lineTo(x, y)
                break
            case "H": // H x
            case "h":
                x = isRelative ? x + args[0] : args[0]
                path.lineTo(x, y)
                break
            case "V":// V y
            case "v":
                y = isRelative ? y + args[0] : args[0]
                path.lineTo(x, y)
                break
            case "C": // C x1 y1, x2 y2, x y
            case "c":
                x1 = isRelative ? x + args[0] : args[0]
                y1 = isRelative ? y + args[1] : args[1]
                x2 = isRelative ? x + args[2] : args[2]
                y2 = isRelative ? y + args[3] : args[3]
                x = isRelative ? x + args[4] : args[4]
                y = isRelative ? y + args[5] : args[5]
                path.bezierCurveTo(x1, y1, x2, y2, x, y)
                break
            case "S":// S x2 y2, x y
            case "s":
                if (lastCmd === 'S' || lastCmd == 'C') {
                    x1 = -(x2 - x) + x
                    y1 = -(y2 - y) + y
                } else {
                    x1 = x
                    y1 = y
                }
                x2 = isRelative ? x + args[0] : args[0]
                y2 = isRelative ? y + args[1] : args[1]
                x = isRelative ? x + args[2] : args[2]
                y = isRelative ? y + args[3] : args[3]
                path.bezierCurveTo(x1, y1, x2, y2, x, y)
                break
            case "Q": // Q x1 y1, x y
            case "q":

                x1 = isRelative ? x + args[0] : args[0]
                y1 = isRelative ? y + args[1] : args[1]
                x = isRelative ? x + args[2] : args[2]
                y = isRelative ? y + args[3] : args[3]
                path.quadraticCurveTo(x1, y1, x, y)
                break
            case "T":// T x y
            case "t":
                if (lastCmd === 'Q' || lastCmd == 'T') {
                    x1 = -(x1 - x) + x
                    y1 = -(y1 - y) + y
                } else {
                    x1 = x
                    y1 = y
                }
                x = isRelative ? x + args[0] : args[1]
                y = isRelative ? y + args[1] : args[2]
                path.quadraticCurveTo(x1, y1, x, y)
                break
            case "A":
            case "a":
                let rx = args[0],
                    ry = args[1],
                    xAxisRotation = args[2] * Math.PI / 180,
                    largeArcFlag = !!args[3], sweepFlag = !!args[4], _x = args[5], _y = args[6];
                if (isRelative) {
                    _x += x
                    _y += y
                }
                /** / A(p)=[cos(xaxisRotation),-sin(xaxisRotation)   [rx*cos(theta{0-360})]   [cx]
                 *                                                  *                       +
                            sin(xaxisRotation),cos(xaxisRotation) ]  [ry*sin(theta{0-360})]    [cy]
                **/
                // https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
                //  A rx ry x-axis-rotation large-arc-flag sweep-flag x y
                // this.arc()
                let endPoint = Vector2.pool(_x, _y)
                let midPoint = Vector2.pool(x, y).subtract(endPoint).multiplyScalar(0.5).rotate(-xAxisRotation)
                let lambda = (midPoint.x * midPoint.x) / (rx * rx) + (midPoint.y * midPoint.y) / (ry * ry);
                if (lambda > 1) {
                    lambda = Math.sqrt(lambda);
                    rx *= lambda;
                    ry *= lambda;
                }
                let centerPoint = Vector2.pool((rx * midPoint.y) / ry, -(ry * midPoint.x) / rx)
                let t1 = rx * rx * ry * ry;
                let t2 = rx * rx * midPoint.y * midPoint.y + ry * ry * midPoint.x * midPoint.x;
                if (sweepFlag !== largeArcFlag) {
                    centerPoint.multiplyScalar(Math.sqrt((t1 - t2) / t2) || 0)
                } else {
                    centerPoint.multiplyScalar(-Math.sqrt((t1 - t2) / t2) || 0)
                }
                let startAngle = Math.atan2((midPoint.y - centerPoint.y) / ry, (midPoint.x - centerPoint.x) / rx);
                let endAngle = Math.atan2(-(midPoint.y + centerPoint.y) / ry, -(midPoint.x + centerPoint.x) / rx);
                centerPoint.rotate(xAxisRotation)
                centerPoint.translate((endPoint.x + x) / 2, (endPoint.y + y) / 2)

                path.ellipse(centerPoint.x, centerPoint.y, rx, ry, xAxisRotation, startAngle, endAngle, !sweepFlag)

                x = _x
                y = _y

                break
            case "Z":// Z
            case "z":
                path.close()
                break
        }
        lastCmd = upperCmd
    }
}

export class PathBuilder {
    static parse(svgPathData:string){
        const path=this.new()
        fromSVGString(svgPathData, path)
        return path

    }
    static new() {
        return new this()
    }
    points: Vector2[] = []
    verbs: PATH_VERBS[] = []
    moveToRequired: boolean = false
    lastMoveIndex: number = -1
    constructor() {

    }
    get isEmpty() {
        return this.verbs.length <= 0
    }
    get lastMovePoint() {
        if (this.isEmpty) {
            return null
        }
        return this.points[this.lastMoveIndex]
    }
    get lastPoint() {
        if (this.isEmpty) {
            return null
        }
        return this.points[this.points.length - 1]
    }
    get lastVerb() {
        return this.isEmpty ? null : this.verbs[this.verbs.length - 1]
    }
    injectMoveToIfNeeded() {
        if (!this.moveToRequired) {
            return this
        }
        let lastPoint = this.lastPoint
        if (lastPoint !== null) {
            this.moveTo(lastPoint.x, lastPoint.y)
        } else {
            this.moveTo(0, 0)
        }
        return this
    }
    clear() {
        this.points.length = 0
        this.verbs.length = 0
        this.moveToRequired = true
        this.lastMoveIndex = -1
    }
    addPoint(x, y) {
        this.points[this.points.length] = Vector2.create(x, y)
        return this;
    }
    addVerb(verb) {
        this.verbs[this.verbs.length] = verb
        return this;
    }
    addRect(rect: Rect) {
        this.moveTo(rect.left, rect.top);
        this.lineTo(rect.right, rect.top);
        this.lineTo(rect.right, rect.bottom);
        this.lineTo(rect.left, rect.bottom);
        this.close();
    }
    addRoundRect(rect: Rect, radii: number[]) {
        // ul ur  lr ll  upper lower
        const radii_points = [Vector2.splat(radii[0]), Vector2.splat(radii[1]), Vector2.splat(radii[2]), Vector2.splat(radii[3])]
        const T = rect.top, B = rect.bottom, R = rect.right, L = rect.left;
        const rrectIter: Point[] = new Array(8);
        rrectIter[0] = Vector2.create(L + radii_points[0].x, T);
        rrectIter[1] = Vector2.create(R - radii_points[1].x, T);
        rrectIter[2] = Vector2.create(R, T + radii_points[1].y);
        rrectIter[3] = Vector2.create(R, B - radii_points[2].y);
        rrectIter[4] = Vector2.create(R - radii_points[2].x, B);
        rrectIter[5] = Vector2.create(L + radii_points[3].x, B);
        rrectIter[6] = Vector2.create(L, B - radii_points[3].y);
        rrectIter[7] = Vector2.create(L, T + radii_points[0].y);


        const rectIter: Vector2[] = new Array(4)
        rectIter[0] = Vector2.create(rect.left, rect.top);
        rectIter[1] = Vector2.create(rect.right, rect.top);
        rectIter[2] = Vector2.create(rect.right, rect.bottom);
        rectIter[3] = Vector2.create(rect.left, rect.bottom);


        this.moveTo(rrectIter[7].x, rrectIter[7].y);
        const weight = 0.707106781
        for (let i = 0, k = 7; i < 4; ++i) {
            k = k % rrectIter.length
            this.lineTo(rrectIter[k].x, rrectIter[k].y);
            k++
            k = k % rrectIter.length
            this.conicTo(rectIter[i].x, rectIter[i].y, rrectIter[k].x, rrectIter[k].y, weight);
            k++;
        }

        this.close()
    }

    addCircle(x: number, y: number, r: number) {
        this.addOval(Rect.fromXYWH(x - r, y - r, r + r, r + r));
    }
    addOval(oval: Rect) {
        let cx = oval.cx
        let cy = oval.cy
        let oval_points = [
            Vector2.create(cx, oval.bottom),
            Vector2.create(oval.left, cy),
            Vector2.create(cx, oval.top),
            Vector2.create(oval.right, cy),
        ];

        let rect_points = [
            Vector2.create(oval.right, oval.bottom),
            Vector2.create(oval.left, oval.bottom),
            Vector2.create(oval.left, oval.top),
            Vector2.create(oval.right, oval.top),
        ];

        let weight = 0.707106781;
        this.moveTo(oval_points[3].x, oval_points[3].y);
        for (let i = 0; i < 4; ++i) {
            let p1 = rect_points[i]
            let p2 = oval_points[i]
            this.conicTo(p1.x, p1.y, p2.x, p2.y, weight);
        }
        this.close();
    }
    moveTo(x, y) {
        if (this.lastVerb === PATH_VERBS.MOVE) {
            this.points[this.lastMoveIndex].set(x, y)
        } else {
            this.lastMoveIndex = this.points.length
            this.moveToRequired = false
            this.addPoint(x, y).addVerb(PATH_VERBS.MOVE)
        }
        return this;

    }
    lineTo(x, y) {
        this.injectMoveToIfNeeded()
        return this.addPoint(x, y).addVerb(PATH_VERBS.LINE)
    }
    quadraticCurveTo(x1, y1, x2, y2) {
        this.injectMoveToIfNeeded()
        this.addPoint(x1, y1)
        this.addPoint(x2, y2)
        this.addVerb(PATH_VERBS.QUAD)
        return this;
    }
    quadraticToCubic(p0, p1, p2) {
        // cp1=lerp(p0,p1,2/3)=p0*(1-2/3)+p1*2/3=p0*(1/3)+p1*(2/3)
        // cp1=(p0.x + 2 * p1.x) / 3=p0.x*(1/3)+p1*2/3
        var cp1 = {
            x: (p0.x + 2 * p1.x) / 3,
            y: (p0.y + 2 * p1.y) / 3
        };
        var cp2 = {
            x: (2 * p1.x + p2.x) / 3,
            y: (2 * p1.y + p2.y) / 3
        };
        this.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
    }
    bezierCurveTo(x1, y1, x2, y2, x3, y3) {
 
        this.injectMoveToIfNeeded()
        this.addPoint(x1, y1)
        this.addPoint(x2, y2)
        this.addPoint(x3, y3)
        this.addVerb(PATH_VERBS.CUBIC)
        return this;
    }
    conicToQuadratic(
        x0, y0,
        x1, y1,
        x2, y2,
        w
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
    conicTo(x1, y1, x, y, weight) {

        if(!(weight > 0.0)) {
            this.lineTo(x, y);
        } else if (!Number.isFinite(weight)) {
            this.lineTo(x1, y1);
            this.lineTo(x, y);
        } else if(weight == 1.0 ){
            this.quadraticCurveTo(x1, y1, x, y);
        } else {
            this.injectMoveToIfNeeded()
            
            let last = this.lastPoint!
            let quadder=this.conicToQuadratic(last.x,last.y,x1,y1,x,y,weight)
            if(quadder){
                
                for(let i=0;i<quadder.length;i++) {
                    if(quadder[i].length===3){
                        let pt2 = quadder[i][1];
                        let pt3 = quadder[i][2];
                        this.quadraticCurveTo(pt2[0], pt2[1], pt3[0], pt3[1]); 
                    }
               
                }
            }
        }
    }
    close() {
        if (!this.isEmpty) {
            if (this.lastVerb !== PATH_VERBS.CLOSE) {
                this.addVerb(PATH_VERBS.CLOSE)
            }
        }
        this.moveToRequired = true

    }
    transform(matrix: Matrix3) {
        this.points.forEach(p => {
            p.applyMatrix3(matrix)
        })
    }
    getQuadraticBounds(p0, p1, p2) {
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
            return { x: x, y: y };
        });

        // 找到最小和最大的 x 和 y
        var minX = Math.min.apply(null, points.map(function (p) { return p.x; }));
        var maxX = Math.max.apply(null, points.map(function (p) { return p.x; }));
        var minY = Math.min.apply(null, points.map(function (p) { return p.y; }));
        var maxY = Math.max.apply(null, points.map(function (p) { return p.y; }));

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    getCubicBounds(p0, p1, p2, p3) {
        // 二次方程求解函数 Ax^2+Bx+C=0 的解，其中 A, B 和 C 是二次方程的系数。

        function solveQuadratic(a, b, c) {
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

        var tValues = [0, 1];
        // p0(1-t)^3+3t(1-t)^2p1+3t^2(1-t)p2+t^3p3
        // p0(1-3t+3t^2-t^3)


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
            return { x: x, y: y };
        });

        // 找到最小和最大的 x 和 y
        var minX = Math.min.apply(null, points.map(function (p) { return p.x; }));
        var maxX = Math.max.apply(null, points.map(function (p) { return p.x; }));
        var minY = Math.min.apply(null, points.map(function (p) { return p.y; }));
        var maxY = Math.max.apply(null, points.map(function (p) { return p.y; }));

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    // 计算点到线段的距离
    distancePointToLineSegment(point, lineStart, lineEnd) {
        var x = point.x;
        var y = point.y;
        var x1 = lineStart.x;
        var y1 = lineStart.y;
        var x2 = lineEnd.x;
        var y2 = lineEnd.y;

        var dx = x2 - x1;
        var dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            // 线段长度为0，直接计算点到点的距离
            return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
        }

        // 计算参数t
        var t = ((x - x1) * dx + (y - y1) * dy) / (dx ** 2 + dy ** 2);

        if (t < 0) {
            // 最近点是起点
            return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
        } else if (t > 1) {
            // 最近点是终点
            return Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);
        } else {
            // 最近点在线段上
            var projX = x1 + t * dx;
            var projY = y1 + t * dy;
            return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
        }
    }

    // 基于误差细分
    // 二次贝塞尔曲线优化细分
    subdivideQuadratic(P0, P1, P2, threshold, depth = 0) {
        if (depth > 100) {
            // 防止过深的递归
            // segments.push(P2);
            this.lineTo(P2.x, P2.y)
            return;
        }
        // 计算误差
        let error = this.distancePointToLineSegment(P1, P0, P2);
        if (error < threshold) {
            // 不需要细分，将P2加入segments
            // segments.push(P2);
            this.lineTo(P2.x, P2.y)
        } else {
            // 细分曲线
            let P0P1 = {
                x: (P0.x + P1.x) / 2,
                y: (P0.y + P1.y) / 2
            };
            let P1P2 = {
                x: (P1.x + P2.x) / 2,
                y: (P1.y + P2.y) / 2
            };
            let P0P1P2 = {
                x: (P0P1.x + P1P2.x) / 2,
                y: (P0P1.y + P1P2.y) / 2
            };
            // 左边的曲线: P0, P0P1, P0P1P2
            this.subdivideQuadratic(P0, P0P1, P0P1P2, threshold, depth + 1);
            // 右边的曲线: P0P1P2, P1P2, P2
            this.subdivideQuadratic(P0P1P2, P1P2, P2, threshold, depth + 1);
        }
    }
    // 三次贝塞尔曲线优化细分
    subdivideCubic(P0, P1, P2, P3, threshold, depth = 0) {
        if (depth > 100) {
            // 防止过深的递归
            this.lineTo(P3.x, P3.y);
            return;
        }
        // 计算误差
        let error1 = this.distancePointToLineSegment(P1, P0, P3);
        let error2 = this.distancePointToLineSegment(P2, P0, P3);
        let error = Math.max(error1, error2);
        if (error < threshold) {
            // 不需要细分，将P3加入segments
            this.lineTo(P3.x, P3.y);
        } else {
            // 细分曲线
            let P0P1 = {
                x: (P0.x + P1.x) / 2,
                y: (P0.y + P1.y) / 2
            };
            let P1P2 = {
                x: (P1.x + P2.x) / 2,
                y: (P1.y + P2.y) / 2
            };
            let P2P3 = {
                x: (P2.x + P3.x) / 2,
                y: (P2.y + P3.y) / 2
            };
            let P0P1P2 = {
                x: (P0P1.x + P1P2.x) / 2,
                y: (P0P1.y + P1P2.y) / 2
            };
            let P1P2P3 = {
                x: (P1P2.x + P2P3.x) / 2,
                y: (P1P2.y + P2P3.y) / 2
            };
            let P0P1P2P3 = {
                x: (P0P1P2.x + P1P2P3.x) / 2,
                y: (P0P1P2.y + P1P2P3.y) / 2
            };
            // 左边的曲线: P0, P0P1, P0P1P2, P0P1P2P3
            this.subdivideCubic(P0, P0P1, P0P1P2, P0P1P2P3, threshold, depth + 1);
            // 右边的曲线: P0P1P2P3, P1P2P3, P2P3, P3
            this.subdivideCubic(P0P1P2P3, P1P2P3, P2P3, P3, threshold, depth + 1);
        }
    }

    getBounds() {
        let min = Vector2.create(Infinity, Infinity), max = Vector2.create(-Infinity, -Infinity)
        for (let [verb, d] of this) {
            
            switch (verb) {
                case PATH_VERBS.MOVE:
                case PATH_VERBS.LINE:
                    min.min(d.p0!)
                    max.max(d.p0!)
                    break;
                case PATH_VERBS.QUAD:
                    {
                        let { x, y, width, height } = this.getQuadraticBounds(d.p0, d.p1, d.p2)
                        min.min(Vector2.create(x, y))
                        max.max(Vector2.create(x + width, y + height))
                    }
                    break;
                case PATH_VERBS.CUBIC:
                    {
                        let { x, y, width, height } = this.getCubicBounds(d.p0, d.p1, d.p2, d.p3)
                        min.min(Vector2.create(x, y))
                        max.max(Vector2.create(x + width, y + height))
                    }
                    break
            }
        }
        min.round()
        max.round()
        return Box2.create(min, max)
    }
    [Symbol.iterator]():Iterator<[PATH_VERBS,{index:number,p0?:Vector2,p1?:Vector2,p2?:Vector2,p3?:Vector2}]> {
        const self=this;
        return (function* () {
            const verbs = self.verbs, points = self.points
            let index = 0, p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2, lastMove;
            for (let i = 0; i < verbs.length; i++) {
                const verb = verbs[i]
                switch (verb) {
                    case PATH_VERBS.MOVE:
                        index += 1;
                        p0 = points[index - 1].clone()
                        yield [verb, { index: index - 1, p0 }]
                        break;
                    case PATH_VERBS.LINE:
                        index += 1;
                        p0 = points[index - 1].clone()
                        yield [verb, { index: index - 1, p0 }]
                        break;
                    case PATH_VERBS.QUAD:
                        index += 2;
                        p0 = points[index - 3].clone()
                        p1 = points[index - 2].clone()
                        p2 = points[index - 1].clone()
                        yield [verb, { index: index - 1, p0, p1, p2 }]
                        break;
                    case PATH_VERBS.CUBIC:
                        index += 3;
                        p0 = points[index - 4].clone()
                        p1 = points[index - 3].clone()
                        p2 = points[index - 2].clone()
                        p3 = points[index - 1].clone()
                        yield [verb, { index: index - 1, p0, p1, p2, p3 }]
                        break;
                    case PATH_VERBS.CLOSE:
                        yield [verb, { index: index - 1, }]
                        break;
                }
            }
        })();
    }
    getPoints() {
        const points:Vector2[] = []
        const path = this.flatten()
        for (let [verb, seg] of path) {
            if (verb === PATH_VERBS.MOVE) {
                points.push(seg.p0!)
            } else if (verb === PATH_VERBS.LINE) {
                points.push(seg.p0!)
            }
        }
        return points
    }

    flatten() {
        let path = PathBuilder.new(), firstMove:Vector2|null = null
        for (let [verb, { p0, p1, p2, p3 }] of this) {
            switch (verb) {
                case PATH_VERBS.MOVE:
                    path.moveTo(p0!.x, p0!.y)
                    if (firstMove === null) {
                        firstMove = p0!.clone()
                    }
                    break;
                case PATH_VERBS.LINE:
                    path.lineTo(p0!.x, p0!.y)
                    break;
                case PATH_VERBS.QUAD:
                    path.subdivideQuadratic(p0, p1, p2, 1)
                    break;
                case PATH_VERBS.CUBIC:
                    path.subdivideCubic(p0, p1, p2, p3, 1)
                    break;
                case PATH_VERBS.CLOSE:
                    if (firstMove) {
                        path.lineTo(firstMove.x, firstMove.y)
                        firstMove = null
                    }
                    break;
            }
        }
        return path
    }
    /**
     * @param {Path2D} path
    */
    toPath2D(path) {
        for (let [verb, { p0, p1, p2, p3 }] of this) {
            switch (verb) {
                case PATH_VERBS.MOVE:
                    path.moveTo(p0!.x, p0!.y)
                    break;
                case PATH_VERBS.LINE:
                    path.lineTo(p0!.x, p0!.y)
                    break;
                case PATH_VERBS.QUAD:
                    path.quadraticCurveTo(p1!.x, p1!.y, p2!.x, p2!.y)
                    break;
                case PATH_VERBS.CUBIC:
                    path.bezierCurveTo(p1!.x, p1!.y, p2!.x, p2!.y, p3!.x, p3!.y)
                    break;
                case PATH_VERBS.CLOSE:
                    path.closePath()
                    break;
            }
        }
    }
    stroke(paint:Paint):Uint8ClampedArray{
        
    }
    fill(paint:Paint):Uint8ClampedArray{

    }
}