import { endpoint_to_center,center_to_endpoint } from '../../../curve/arc'
import { Vector2 } from '../Vector2'

export {
    endpoint_to_center,
    center_to_endpoint
}
/***
 * 点在椭圆上xAxisRotation处，再旋转至theta处，返回该点坐标
 */
export function pointOnEllipse(cx: number, cy: number, rx: number, ry: number, xAxisRotation: number, theta: number) {
    const cos = Math.cos(theta)*rx
    const sin = Math.sin(theta)*ry
    const cosRx = Math.cos(xAxisRotation)
    const sinRx = Math.sin(xAxisRotation)
    return {
        x: cx + cosRx * cos-sinRx*sin,
        y: cy + sinRx * cos+cosRx*sin,
    }
}

/**
 * 四分之一椭圆弧转贝塞尔曲线段

 * @param cx 
 * @param cy 
 * @param rx 
 * @param ry 
 * @param theta1 
 * @param theta2 
 */
export function quarterArcToCubicBezier(cx: number, cy: number, rx: number, ry: number, xAxisRotation: number, theta1: number, theta2: number) {

    const deltaAngle = theta2 - theta1;
    const kappa = 4 / 3 * Math.tan(deltaAngle / 4);
    // 单位圆
    const p0 = Vector2.fromRotation(theta1)
    const p3 = Vector2.fromRotation(theta2)
    const p1 = Vector2.fromPoint(p0)
    const p2 = Vector2.fromPoint(p3)
  
    // 根据椭圆弧公式与贝赛尔曲线公式，推导楕圆B'(0)=R'(0)
    // 3(p1-p0)=delta*(-sin*rx,cos*ry), p1=p0-(delta/3)*(-sin*rx,cos*ry)  kappa=(delta/3) 
    // kappa= 4 / 3 * Math.tan(deltaAngle / 4);更精确

    p1.translate(-kappa * p0.y, kappa * p0.x);
    p2.translate(kappa  * p3.y, -kappa * p3.x);

    p0.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)
    p1.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)
    p2.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)
    p3.scale(rx,ry).rotate(xAxisRotation).translate(cx,cy)

    return [p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]
}


/**
 * svg A命令的椭圆弧转细分成贝塞尔曲线

 * @param x1 
 * @param y1 
 * @param x2 
 * @param y2 
 * @param _rx 
 * @param _ry 
 * @param xAxisRotation 
 * @param largeArcFlag 
 * @param sweepFlag 
 */
export function ellipseArcToCubicBezier(x1: number, y1: number, x2: number, y2: number,
    _rx: number, _ry: number, xAxisRotation: number,
    largeArcFlag: boolean, sweepFlag: boolean, callback?: (x0: number, y0: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, index: number) => void) {
    const { cx, cy, theta1, dtheta, rx, ry } = endpoint_to_center(x1, y1, x2, y2, largeArcFlag, sweepFlag, _rx, _ry, xAxisRotation)

    // 将弧划分为若干段，每段弧跨度不超过 PI/2
    const segments = Math.ceil(Math.abs(dtheta / (Math.PI / 2)));
    const delta = dtheta / segments;
    const curves: number[] = [];
    let thetaStart = theta1;

    for (let i = 0; i < segments; i++) {
        const thetaEnd = thetaStart + delta;
        let [x0, y0, cp1x, cp1y, cp2x, cp2y, x, y] = quarterArcToCubicBezier(cx, cy, rx, ry, xAxisRotation, thetaStart, thetaEnd)
        callback?.(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y, i)
        thetaStart = thetaEnd
        curves.push(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y)
    }
    return curves
}