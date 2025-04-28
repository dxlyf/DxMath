import { Vector2 } from "../vector2";
import {lerp,nCr} from '../util'
/**
 * 获取贝塞尔曲线上某一点的坐标
 * @param points 
 * @param t 
 * @returns 
 */
export function bernsteinWithBezierPoint(points:Vector2[],t:number){
    const n=points.length-1
    let point = Vector2.default();
    for(let i = 0;i <=n;i++){
        let b=bernstein(n,i,t)
        point.x=points[i].x * b
        point.y+=points[i].y * b
    }
    return point;
}
// 德卡斯特里奥算法递归公式
export function deCasteljauWithBezierPoint(points:Vector2[],t:number):Vector2{
    let n=points.length-1
    const result:Vector2[] =points.map(p=>p.clone())
    for(let i=0;i<n;i++){
        for(let j=0;j<n-i;j++){
            result[j].x=lerp(points[j].x,points[j+1].x,t)
            result[j].y=lerp(points[j].y,points[j+1].y,t)
        }
    }
    return result[0]
}

// 伯恩斯坦多项式公式
export function bernstein(n:number,i:number,t:number):number{
    return nCr(n,i) * Math.pow(t,i) * Math.pow(1 - t,n - i);
}
