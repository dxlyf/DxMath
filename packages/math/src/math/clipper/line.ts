/***
 * 这是六种不同的直线裁剪方法的 TypeScript 实现，包括：

逐边裁剪法 (Liang-Barsky)
矢量裁剪法 (Nicholl-Lee-Nicholl, 近似实现)
Cohen-Sutherland 编码裁剪法
中点分割算法
直线方程法 (近似为 Liang-Barsky)
Cyrus-Beck 参数化裁剪 (近似实现)

算法	时间复杂度	适用场景	优点
Cohen-Sutherland	O(n)	矩形窗口	快速拒绝不可见线段
中点分割	O(log n)	硬件实现/高精度需求	无浮点运算
Sutherland-Hodgman	O(kn)	任意凸多边形窗口	通用性强
Cyrus-Beck	O(n)	任意凸多边形	参数化计算高效

 */
type Point = { x: number; y: number };
type Rect = { xmin: number; ymin: number; xmax: number; ymax: number };

/** ① 逐边裁剪法 (Liang-Barsky) */
export function liangBarsky(p1: Point, p2: Point, rect: Rect): Point[] | null {
    let t0 = 0, t1 = 1;
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const clip = (p: number, q: number) => {
        // 如果线段是垂直或水平，线段完全在窗口外，直接返回 false;
        if (p == 0 && q < 0) return false;
        const r = q / p;// 计算线段与窗口边界的交点比例
        if (p < 0) {
            if (r > t1) return false;
            if (r > t0) t0 = r;
        } else if (p > 0) {
            if (r < t0) return false;
            if (r < t1) t1 = r;
        }
        return true;
    };
    if (!clip(-dx, p1.x - rect.xmin) || !clip(dx, rect.xmax - p1.x) ||
        !clip(-dy, p1.y - rect.ymin) || !clip(dy, rect.ymax - p1.y)) {
        return null;
    }
    return [
        { x: p1.x + t0 * dx, y: p1.y + t0 * dy },
        { x: p1.x + t1 * dx, y: p1.y + t1 * dy }
    ];
}

/** ② 矢量裁剪法 (Nicholl-Lee-Nicholl) */
export function nichollLeeNicholl(p1: Point, p2: Point, rect: Rect): Point[] | null {
    // 需要额外处理不同象限的情况
    return liangBarsky(p1, p2, rect); // 这里用 Liang-Barsky 近似实现
}

/** ③ Cohen-Sutherland 编码裁剪法 */
const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;
function computeOutCode(p: Point, rect: Rect): number {
    let code = INSIDE;
    if (p.x < rect.xmin) code |= LEFT;
    else if (p.x > rect.xmax) code |= RIGHT;
    if (p.y < rect.ymin) code |= BOTTOM;
    else if (p.y > rect.ymax) code |= TOP;
    return code;
}
export function cohenSutherland(p1: Point, p2: Point, rect: Rect): Point[] | null {
    let out1 = computeOutCode(p1, rect), out2 = computeOutCode(p2, rect);
    while (true) {
        if (!(out1 | out2)) return [p1, p2];
        if (out1 & out2) return null;
        let x = 0, y = 0;
        const out = out1 ? out1 : out2;
        if (out & TOP) {
            x = p1.x + (p2.x - p1.x) * (rect.ymax - p1.y) / (p2.y - p1.y);
            y = rect.ymax;
        } else if (out & BOTTOM) {
            x = p1.x + (p2.x - p1.x) * (rect.ymin - p1.y) / (p2.y - p1.y);
            y = rect.ymin;
        } else if (out & RIGHT) {
            y = p1.y + (p2.y - p1.y) * (rect.xmax - p1.x) / (p2.x - p1.x);
            x = rect.xmax;
        } else if (out & LEFT) {
            y = p1.y + (p2.y - p1.y) * (rect.xmin - p1.x) / (p2.x - p1.x);
            x = rect.xmin;
        }
        if (out === out1) {
            p1 = { x, y };
            out1 = computeOutCode(p1, rect);
        } else {
            p2 = { x, y };
            out2 = computeOutCode(p2, rect);
        }
    }
}

/** ④ 中点分割算法 */
export function midpointSubdivision(p1: Point, p2: Point, rect: Rect): Point[] | null {
    let out1 = computeOutCode(p1, rect), out2 = computeOutCode(p2, rect);
    if (!(out1 | out2)) return [p1, p2];
    if (out1 & out2) return null;
    if (Math.abs(p2.x - p1.x) < 1e-6 && Math.abs(p2.y - p1.y) < 1e-6) return null;
    const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    return [...(midpointSubdivision(p1, mid, rect) || []), ...(midpointSubdivision(mid, p2, rect) || [])];
}

/** ⑤ 直线方程法 */
export function equationBasedClipping(p1: Point, p2: Point, rect: Rect): Point[] | null {
    return liangBarsky(p1, p2, rect);
}

/** ⑥ Cyrus-Beck 参数化裁剪算法 */
export function cyrusBeck(p1: Point, p2: Point, rect: Rect): Point[] | null {
    return liangBarsky(p1, p2, rect); // 这里只是近似实现，完整实现需要求点积判断进入/退出
}



type RegionCode = number; // 4位区域码：上下右左
//编码裁剪法（Cohen-Sutherland算法）

export const CohenSutherlandClip = (
    line: [Point, Point], 
    bounds: { left: number, right: number, top: number, bottom: number }
): [Point, Point] | null => {
    
    // 区域码生成函数[4,6](@ref)
    const encode = (p: Point): RegionCode => {
        let code = 0;
        if (p.x < bounds.left) code |= 1;   // 左
        if (p.x > bounds.right) code |= 2;   // 右
        if (p.y < bounds.bottom) code |= 4; // 下
        if (p.y > bounds.top) code |= 8;     // 上
        return code;
    };

    let [p1, p2] = line;
    let code1 = encode(p1);
    let code2 = encode(p2);

    while (true) {
        if ((code1 | code2) === 0) return [p1, p2]; // 完全可见[4](@ref)
        if ((code1 & code2) !== 0) return null;     // 完全不可见
        
        // 选择外点进行裁剪[6](@ref)
        const code = code1 !== 0 ? code1 : code2;
        let intersect: Point = { x: 0, y: 0 };

        // 边界交点计算[4,8](@ref)
        if (code & 8) { // 上边界
            intersect.x = p1.x + (p2.x - p1.x) * (bounds.top - p1.y) / (p2.y - p1.y);
            intersect.y = bounds.top;
        } else if (code & 4) { // 下边界
            intersect.x = p1.x + (p2.x - p1.x) * (bounds.bottom - p1.y) / (p2.y - p1.y);
            intersect.y = bounds.bottom;
        } else if (code & 2) { // 右边界
            intersect.y = p1.y + (p2.y - p1.y) * (bounds.right - p1.x) / (p2.x - p1.x);
            intersect.x = bounds.right;
        } else if (code & 1) { // 左边界
            intersect.y = p1.y + (p2.y - p1.y) * (bounds.left - p1.x) / (p2.x - p1.x);
            intersect.x = bounds.left;
        }

        // 更新端点[5](@ref)
        code === code1 ? (p1 = intersect, code1 = encode(p1)) 
                       : (p2 = intersect, code2 = encode(p2));
    }
};
// 逐边裁剪法（Sutherland-Hodgman算法）
export const SutherlandHodgmanClip = (
    line: [Point, Point],
    edges: { normal: [number, number], point: Point }[] // 窗口各边参数化
): Point[] => {
    
    let output: Point[] = [line[0], line[1]];
    
    // 逐边处理[5,11](@ref)
    for (const edge of edges) {
        const newPoints: Point[] = [];
        for (let i = 0; i < output.length; i++) {
            const a = output[i];
            const b = output[(i + 1) % output.length];
            
            // 点与边的位置测试[11](@ref)
            const dotA = edge.normal[0]*(a.x - edge.point.x) + edge.normal[1]*(a.y - edge.point.y);
            const dotB = edge.normal[0]*(b.x - edge.point.x) + edge.normal[1]*(b.y - edge.point.y);

            if (dotA <= 0) newPoints.push(a); // 内部点保留
            if ((dotA < 0 && dotB > 0) || (dotA > 0 && dotB < 0)) { // 交点计算
                const t = -dotA / (dotB - dotA);
                newPoints.push({
                    x: a.x + t * (b.x - a.x),
                    y: a.y + t * (b.y - a.y)
                });
            }
        }
        output = newPoints;
    }
    return output;
};
// 中点分割算法（硬件友好型）
export const MidpointClip = (
    line: [Point, Point],
    bounds: { left: number, right: number, top: number, bottom: number },
    epsilon = 1 // 收敛精度
): [Point, Point] | null => {

    // 二分逼近交点[7,9](@ref)
    const findEdgePoint = (start: Point, end: Point): Point => {
        let p0 = start, p1 = end;
        while (Math.hypot(p1.x - p0.x, p1.y - p0.y) > epsilon) {
            const mid = { 
                x: (p0.x + p1.x)/2, 
                y: (p0.y + p1.y)/2 
            };
            // 区域码测试[9](@ref)
            if (mid.x < bounds.left || mid.x > bounds.right || 
                mid.y < bounds.bottom || mid.y > bounds.top) {
                p1 = mid;
            } else {
                p0 = mid;
            }
        }
        return p0;
    };

    // 查找两个可见点[8](@ref)
    const pA = findEdgePoint(line[0], line[1]);
    const pB = findEdgePoint(line[1], line[0]);
    
    return (Math.abs(pA.x - pB.x) > epsilon || Math.abs(pA.y - pB.y) > epsilon) 
           ? [pA, pB] : null;
};