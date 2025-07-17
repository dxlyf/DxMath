import {Vector2} from '../Vector2'

/**
 * 两次贝塞尔曲线转换为三次贝塞尔曲线。
 * @param p0 
 * @param p1 
 * @param p2 
 * @returns 
 */
export function quadBezierToCubic(p0:Vector2, p1:Vector2, p2:Vector2) {
    const cp1=Vector2.lerp(Vector2.default(), p0, p1, 2/3)
    const cp2=Vector2.lerp(Vector2.default(), p2, p1, 2/3)
    return [p0, cp1,cp2,p2]
}