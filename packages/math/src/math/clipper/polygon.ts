import {IVector2} from '../vec2'
/**
 * Sutherland-Hodgman 多边形裁剪算法
 * @param {Array} subjectPolygon 待裁剪多边形顶点数组 [{x,y},...]
 * @param {Array} clipPolygon 裁剪多边形顶点数组 [{x,y},...]
 * @returns {Array} 裁剪后的多边形顶点数组
 */
export function sutherlandHodgmanClip(subjectPolygon:IVector2[], clipPolygon:IVector2[]) {
    let outputList:IVector2[] = subjectPolygon;
    
    // 对裁剪多边形的每条边进行裁剪
    for (let i = 0; i < clipPolygon.length; i++) {
        const clipEdgeStart = clipPolygon[i];
        const clipEdgeEnd = clipPolygon[(i + 1) % clipPolygon.length];
        
        const inputList = outputList;
        outputList = [];
        
        if (inputList.length === 0) break;
        
        let prevPoint = inputList[inputList.length - 1];
        
        for (const currentPoint of inputList) {
            const prevInside = isInside(prevPoint, clipEdgeStart, clipEdgeEnd);
            const currentInside = isInside(currentPoint, clipEdgeStart, clipEdgeEnd);
            
            if (currentInside) {
                if (!prevInside) {
                    const intersection = computeIntersection(
                        prevPoint, currentPoint, clipEdgeStart, clipEdgeEnd
                    );
                   if(intersection){
                    outputList.push(intersection);
                   }
                }
                outputList.push(currentPoint);
            } else if (prevInside) {
                const intersection = computeIntersection(
                    prevPoint, currentPoint, clipEdgeStart, clipEdgeEnd
                );
                if(intersection){
                    outputList.push(intersection);
                   }
            }
            
            prevPoint = currentPoint;
        }
    }
    
    return outputList;
}

// 判断点是否在裁剪边内侧
function isInside(point:IVector2, edgeStart:IVector2, edgeEnd:IVector2) {
    return (
        (edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y) >
        (edgeEnd.y - edgeStart.y) * (point.x - edgeStart.x)
    );
}

// 计算两条线段的交点
function computeIntersection(start1:IVector2, end1:IVector2, start2:IVector2, end2:IVector2) {
    const ab_x=end1.x-start1.x;
    const ab_y=end1.y-start1.y;

    const cd_x=end2.x-start2.x;
    const cd_y=end2.y-start2.y;

    const denom=ab_x*cd_y-ab_y*cd_x;
    if (denom === 0) return null; // 平行或共线
    
    const ac_x=start2.x-start1.x;
    const ac_y=start2.y-start1.y;
    const u=(ac_x*cd_y-ac_y*cd_x)/denom
    const v=(ac_x*ab_y-ac_y*ab_x)/denom
    // if(u<0||u>1||v<0||v>1){
    //     return null
    // }
    return {
        x: start1.x + u * (end1.x - start1.x),
        y: start1.y + u * (end1.y - start1.y)
    } as IVector2;
}

/**
 * Cohen-Sutherland 线段裁剪算法
 * @param {Object} lineStart 线段起点 {x, y}
 * @param {Object} lineEnd 线段终点 {x, y}
 * @param {Object} rect 裁剪矩形 {xMin, yMin, xMax, yMax}
 * @returns {Array|null} 裁剪后的线段 [start, end] 或 null(完全不可见)
 */
function cohenSutherlandClip(lineStart:any, lineEnd:any, rect:any) {
    const INSIDE = 0; // 0000
    const LEFT = 1;   // 0001
    const RIGHT = 2;  // 0010
    const BOTTOM = 4; // 0100
    const TOP = 8;    // 1000

    function computeCode(x:number, y:number) {
        let code = INSIDE;
        if (x < rect.xMin) code |= LEFT;
        else if (x > rect.xMax) code |= RIGHT;
        if (y < rect.yMin) code |= BOTTOM;
        else if (y > rect.yMax) code |= TOP;
        return code;
    }

    let code1 = computeCode(lineStart.x, lineStart.y);
    let code2 = computeCode(lineEnd.x, lineEnd.y);
    let accept = false;

    while (true) {
        if ((code1 | code2) === 0) {
            // 完全在矩形内
            accept = true;
            break;
        } else if ((code1 & code2) !== 0) {
            // 完全在矩形外
            break;
        } else {
            // 部分在矩形内，需要裁剪
            let x, y;
            const codeOut = code1 !== 0 ? code1 : code2;

            // 计算交点
            if (codeOut & TOP) {
                x = lineStart.x + (lineEnd.x - lineStart.x) * 
                    (rect.yMax - lineStart.y) / (lineEnd.y - lineStart.y);
                y = rect.yMax;
            } else if (codeOut & BOTTOM) {
                x = lineStart.x + (lineEnd.x - lineStart.x) * 
                    (rect.yMin - lineStart.y) / (lineEnd.y - lineStart.y);
                y = rect.yMin;
            } else if (codeOut & RIGHT) {
                y = lineStart.y + (lineEnd.y - lineStart.y) * 
                    (rect.xMax - lineStart.x) / (lineEnd.x - lineStart.x);
                x = rect.xMax;
            } else if (codeOut & LEFT) {
                y = lineStart.y + (lineEnd.y - lineStart.y) * 
                    (rect.xMin - lineStart.x) / (lineEnd.x - lineStart.x);
                x = rect.xMin;
            }

            if (codeOut === code1) {
                lineStart = {x, y};
                code1 = computeCode(lineStart.x, lineStart.y);
            } else {
                lineEnd = {x, y};
                code2 = computeCode(lineEnd.x, lineEnd.y);
            }
        }
    }

    return accept ? [lineStart, lineEnd] : null;
}
/**
 * Liang-Barsky 矩形裁剪算法
 * @param {Object} rect 待裁剪矩形 {x, y, width, height}
 * @param {Object} clipRect 裁剪矩形 {x, y, width, height}
 * @returns {Object|null} 裁剪后的矩形 {x, y, width, height} 或 null(完全不可见)
 */
function liangBarskyClip(rect:any, clipRect:any) {
    let x1 = rect.x;
    let y1 = rect.y;
    let x2 = rect.x + rect.width;
    let y2 = rect.y + rect.height;
    
    const clipX1 = clipRect.x;
    const clipY1 = clipRect.y;
    const clipX2 = clipRect.x + clipRect.width;
    const clipY2 = clipRect.y + clipRect.height;
    
    let u1 = 0, u2 = 1;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - clipX1, clipX2 - x1, y1 - clipY1, clipY2 - y1];
    
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) return null; // 线段平行且在裁剪窗口外
        } else {
            const r = q[i] / p[i];
            if (p[i] < 0) {
                u1 = Math.max(u1, r);
            } else {
                u2 = Math.min(u2, r);
            }
            if (u1 > u2) return null; // 线段完全在裁剪窗口外
        }
    }
    
    const clippedX1 = x1 + u1 * dx;
    const clippedY1 = y1 + u1 * dy;
    const clippedX2 = x1 + u2 * dx;
    const clippedY2 = y1 + u2 * dy;
    
    return {
        x: clippedX1,
        y: clippedY1,
        width: clippedX2 - clippedX1,
        height: clippedY2 - clippedY1
    };
}

/**
 * Cyrus-Beck 线段裁剪算法 (参数化方法)
 * @param {Object} lineStart 线段起点 {x, y}
 * @param {Object} lineEnd 线段终点 {x, y}
 * @param {Array} clipPolygon 裁剪多边形顶点数组 [{x,y},...]
 * @returns {Array|null} 裁剪后的线段 [start, end] 或 null(完全不可见)
 */
function cyrusBeckClip(lineStart:any, lineEnd:any, clipPolygon:any) {
    const n = clipPolygon.length;
    if (n < 2) return null;
    
    const D = {
        x: lineEnd.x - lineStart.x,
        y: lineEnd.y - lineStart.y
    };
    
    let tE = 0; // 进入时间
    let tL = 1; // 离开时间
    
    for (let i = 0; i < n; i++) {
        const edgeStart = clipPolygon[i];
        const edgeEnd = clipPolygon[(i + 1) % n];
        
        // 计算边的法向量 (指向多边形内部)
        const normal = {
            x: edgeStart.y - edgeEnd.y,
            y: edgeEnd.x - edgeStart.x
        };
        
        // 计算向量 P0 - PEi (PEi是边上任意一点)
        const P0_PEi = {
            x: lineStart.x - edgeStart.x,
            y: lineStart.y - edgeStart.y
        };
        
        const numerator = dotProduct(normal, P0_PEi);
        const denominator = dotProduct(normal, D);
        
        if (denominator === 0) {
            // 线段与边平行
            if (numerator < 0) return null; // 线段在边外侧
            continue;
        }
        
        const t = -numerator / denominator;
        
        if (denominator > 0) {
            // 线段进入边内侧
            tE = Math.max(tE, t);
        } else {
            // 线段离开边内侧
            tL = Math.min(tL, t);
        }
        
        if (tE > tL) return null; // 线段完全在裁剪区域外
    }
    
    if (tE > tL) return null;
    
    const clippedStart = {
        x: lineStart.x + tE * D.x,
        y: lineStart.y + tE * D.y
    };
    
    const clippedEnd = {
        x: lineStart.x + tL * D.x,
        y: lineStart.y + tL * D.y
    };
    
    return [clippedStart, clippedEnd];
}

function dotProduct(a:IVector2, b:IVector2) {
    return a.x * b.x + a.y * b.y;
}