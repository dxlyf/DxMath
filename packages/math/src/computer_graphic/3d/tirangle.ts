

import { Vertex } from './vertex'
import { mat4, vec3, vec2, mat3, Vec2Like, Vec3Like, Vec4Like, Mat3 } from '../../gl_matrix'

import { Mesh, Camera, Object3D, Material } from './mesh'
import { Geometry } from './geometry'
import {clamp} from '../../math/math'

const lerp = (v0: number, v1: number, t: number) => v0 +t * (v1 - v0);

function z_interpolation(a: Vertex, b: Vertex, c: Vertex, alpha: number, beta: number, gamma: number) {
    let v0 = a.positionScreen;
    let v1 = b.positionScreen;
    let v2 = c.positionScreen;
    let w_reciprocal = 1.0 / (alpha / v0.w + beta / v1.w + gamma / v2.w);
    let z_lerpd = alpha * v0.z / v0.w + beta * v1.z / v1.w + gamma * v2.z / v2.w;
    z_lerpd *= w_reciprocal;
    return z_lerpd
}
// 透视矫正
function perspective_correct(a: Vertex, b: Vertex, c: Vertex, alpha: number, beta: number, gamma: number) {
    let w0 = 1 / a.positionScreen.w * alpha;
    let w1 = 1 / b.positionScreen.w * beta;
    let w2 = 1 / c.positionScreen.w * gamma;
    let normalizer = 1.0 / (w0 + w1 + w2);
    return [w0 * normalizer, w1 * normalizer, w2 * normalizer]
}
export function isInside(a: Vec3Like, b: Vec3Like, c: Vec3Like, p: number[]): boolean {
    const list = [a, b, c].map((v) => vec2.fromValues(v[0], v[1]))
    let r = 0
    for (let i = 0, j = 2; i < 3; j = i++) {
        const p0x = p[0] - list[j][0], p0y = p[1] - list[j][1]
        const p1x = list[i][0] - list[j][0], p1y = list[i][1] - list[j][1]
        const d = p0x * p1y - p0y * p1x
        if (d > 0) {
            r++
        } else {
            r--
        }
    }
    return Math.abs(r) === 3

}
export function getBarycentric2D(a: Vec3Like, b: Vec3Like, c: Vec3Like, p: number[]): number[] {

    const ab = vec2.fromValues(b[0] - a[0], b[1] - a[1])
    const ac = vec2.fromValues(c[0] - a[0], c[1] - a[1])

    const d = ac[0] * ab[1] - ac[1] * ab[0]
    if (d === 0) {
        return [-1, -1, -1]
    }
    const pa = vec2.fromValues(a[0] - p[0], a[1] - p[1])
    const pb = vec2.fromValues(b[0] - p[0], b[1] - p[1])
    const pc = vec2.fromValues(c[0] - p[0], c[1] - p[1])

    // 计算角a
    const alpha = ((pc[0] * pb[1] - pc[1] * pb[0]) / d)
    // 计算角b
    const beta = ((pa[0] * pc[1] - pa[1] * pc[0]) / d)
    // 计算角c
    const gamma = 1 - alpha - beta;
    return [alpha, beta, gamma];
}

// 重心填充
export function barycentricFillTriangle(v1: Vertex, v2: Vertex, v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    let a = v1.positionScreen
    let b = v2.positionScreen
    let c = v3.positionScreen

    let minX = Math.floor(Math.min(a[0], b[0], c[0]))
    let minY = Math.floor(Math.min(a[1], b[1], c[1]))
    let maxX = Math.ceil(Math.max(a[0], b[0], c[0]))
    let maxY = Math.ceil(Math.max(a[1], b[1], c[1]))

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            // if(!isInside(a,b,c,[x,y])){
            //     continue
            // }
            let [alpha, beta, gamma] = getBarycentric2D(a, b, c, [x, y])
            if (alpha < 0 || beta < 0 || gamma < 0 || alpha > 1 || beta > 1 || gamma > 1) {
                continue
            }


            let u = (v1.uv[0] * alpha + v2.uv[0] * beta + v3.uv[0] * gamma)
            let v = (v1.uv[1] * alpha + v2.uv[1] * beta + v3.uv[1] * gamma)

            let depth = (v1.position[2] * alpha + v2.position[2] * beta + v3.position[2] * gamma)


            setPixel(x, y, depth, u, v)
        }
    }

}
// 重心填充
export function barycentricFillTriangle2(v1: Vertex, v2: Vertex, v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    let a = v1.positionScreen
    let b = v2.positionScreen
    let c = v3.positionScreen

    let minX = Math.floor(Math.min(a[0], b[0], c[0]))
    let minY = Math.floor(Math.min(a[1], b[1], c[1]))
    let maxX = Math.ceil(Math.max(a[0], b[0], c[0]))
    let maxY = Math.ceil(Math.max(a[1], b[1], c[1]))

    const matrix=mat3.fromValues(
        a.x,b.x,c.x,
        a.y,b.y,c.y,
        1,1,1
    )
    const invMatrix=mat3.invert(mat3.create(),matrix)!
    const e0=vec3.fromValues(1,0,0)
    const e1=vec3.fromValues(0,1,0)
    const e2=vec3.fromValues(0,0,1)
    vec3.transformMat3(e0,e0,invMatrix)
    vec3.transformMat3(e1,e1,invMatrix)
    vec3.transformMat3(e2,e2,invMatrix)


    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            // if(!isInside(a,b,c,[x,y])){
            //     continue
            // }
            let sample=vec3.fromValues(x+0.5,y+0.5,1)
            let alpha=vec3.dot(e0,sample)
            let beta=vec3.dot(e1,sample)
            let gamma=vec3.dot(e2,sample)

            //let [alpha, beta, gamma] = getBarycentric2D(a, b, c, [x, y])
            if (alpha < 0 || beta < 0 || gamma < 0 || alpha > 1 || beta > 1 || gamma > 1) {
                continue
            }


            let u = (v1.uv[0] * alpha + v2.uv[0] * beta + v3.uv[0] * gamma)
            let v = (v1.uv[1] * alpha + v2.uv[1] * beta + v3.uv[1] * gamma)

            let depth = (v1.position[2] * alpha + v2.position[2] * beta + v3.position[2] * gamma)


            setPixel(x, y, depth, u, v)
        }
    }

}

// 重心填充，透视相机
export function perspectiveBarycentricFillTriangle(v1: Vertex, v2: Vertex, v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    let a = v1.positionScreen
    let b = v2.positionScreen
    let c = v3.positionScreen

    let minX = Math.floor(Math.min(a[0], b[0], c[0]))
    let minY = Math.floor(Math.min(a[1], b[1], c[1]))
    let maxX = Math.ceil(Math.max(a[0], b[0], c[0]))
    let maxY = Math.ceil(Math.max(a[1], b[1], c[1]))

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            // if(!isInside(a,b,c,[x,y])){
            //     continue
            // }
            let [alpha, beta, gamma] = getBarycentric2D(a, b, c, [x, y])
            if (alpha < 0 || beta < 0 || gamma < 0 || alpha > 1 || beta > 1 || gamma > 1) {
                continue
            }
            let depth = z_interpolation(v1, v2, v3, alpha, beta, gamma)

            // 透视矫正
            let barycenter = perspective_correct(v1, v2, v3, alpha, beta, gamma)


            // UV计算（需要同样应用透视校正）

            // let u = (v1.uv[0] * alpha * w1 + v2.uv[0] * beta * w2 + v3.uv[0] * gamma * w3) * invW
            // let v = (v1.uv[1] * alpha + v2.uv[1] * beta * w2 + v3.uv[1] * gamma * w3) * invW

            let u = (v1.uv[0] * alpha + v2.uv[0] * beta + v3.uv[0] * gamma)
            let v = (v1.uv[1] * alpha + v2.uv[1] * beta + v3.uv[1] * gamma)


            setPixel(x, y, depth, u, v)
        }
    }

}

function fillTriangleScanline(_v1: Vertex, _v2: Vertex, _v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {
    // 将顶点按 y 排序
    const vertices = [_v1, _v2, _v3].sort((v1, v2) => v1.positionScreen.y - v2.positionScreen.y);
    const v0 = vertices[0], v1 = vertices[1], v2 = vertices[2];

    // 计算包围盒（y方向）
    const yStart = Math.floor(v0.positionScreen.y);
    const yEnd = Math.ceil(v2.positionScreen.y);

    // 辅助函数：在两点之间线性插值



    const intersections: { u: number, v: number, x: number, z: number }[] = []

    // 对三条边求交点（只考虑 y 在边范围内的情况）
    function edgeIntersect(y: number, vA: Vertex, vB: Vertex) {
        if ((y >= vA.positionScreen.y && y <= vB.positionScreen.y) ||
            (y >= vB.positionScreen.y && y <= vA.positionScreen.y)) {
            const t = (y - vA.positionScreen.y) / (vB.positionScreen.y - vA.positionScreen.y);
            const x = lerp(vA.positionScreen.x, vB.positionScreen.x, t);
            const u = lerp(vA.uv[0], vB.uv[0], t);
            const v = lerp(vA.uv[1], vB.uv[1], t);
            const z = lerp(vA.positionScreen.z, vB.positionScreen.z, t)

            intersections.push({ x, u, v, z })
        }
    }
    // 对每条扫描线进行处理
    for (let y = yStart; y <= yEnd; y++) {
        intersections.length = 0

        edgeIntersect(y, v0, v1);
        edgeIntersect(y, v1, v2);
        edgeIntersect(y, v0, v2);

        if (intersections.length < 2) continue;

        // 取左、右两个交点（如果有多个交点，取最左和最右）
        let left: { u: number, v: number, x: number, z: number } = { x: Infinity, u: 0, v: 0, z: 0 }
        let right: { u: number, v: number, x: number, z: number } = { x: -Infinity, u: 0, v: 0, z: 0 }

        intersections.forEach(d => {
            if (d.x < left.x) {
                left = d
            }
            if (d.x > right.x) {
                right = d
            }

        })

        const xStart = Math.ceil(left.x);
        const xEnd = Math.floor(right.x);
        const span = right.x - left.x;
        if (span === 0) continue;

        for (let x = xStart; x <= xEnd; x++) {
            // 计算水平插值因子 t
            const t = (x - left.x) / span;
            const u = lerp(left.u, right.u, t)
            const v = lerp(left.v, right.v, t)
            const depth = lerp(left.z, right.z, t)
            setPixel(x, y, depth, u, v);
        }
    }
}

// 预定义交点结构体避免GC
interface Intersection {
    x: number;
    u: number;
    v: number;
    z: number;
    w: number; // 新增透视校正因子
}

// 预分配数组（最大可能交点数）
const MAX_INTERSECTIONS = 4;
const intersections: Intersection[] = new Array(MAX_INTERSECTIONS);

function fillTriangleScanlineOptimized(
    v1: Vertex, 
    v2: Vertex, 
    v3: Vertex,
    setPixel: (x: number, y: number, depth: number, u: number, v: number) => void
) {
    v1.invW=1/v1.positionScreen.w
    v2.invW=1/v2.positionScreen.w
    v3.invW=1/v3.positionScreen.w

    // 按Y排序顶点
    let v0 = v1, vMid = v2, vTop = v3;
    if (v0.positionScreen.y > vMid.positionScreen.y) [v0, vMid] = [vMid, v0];
    if (vMid.positionScreen.y > vTop.positionScreen.y) [vMid, vTop] = [vTop, vMid];
    if (v0.positionScreen.y > vMid.positionScreen.y) [v0, vMid] = [vMid, v0];

    // 预计算各边参数（减少循环内计算）
    const edges = [
        { // v0-vMid边
            yMin: Math.ceil(v0.positionScreen.y),
            yMax: Math.floor(vMid.positionScreen.y),
            dy: vMid.positionScreen.y - v0.positionScreen.y,
            invDy: 1 / (vMid.positionScreen.y - v0.positionScreen.y || 1),
            xSlope: (vMid.positionScreen.x - v0.positionScreen.x) / (vMid.positionScreen.y - v0.positionScreen.y || 1),
            zSlope: (vMid.positionScreen.z - v0.positionScreen.z) / (vMid.positionScreen.y - v0.positionScreen.y || 1),
            uSlope: (vMid.uv[0] - v0.uv[0]) / (vMid.positionScreen.y - v0.positionScreen.y || 1),
            vSlope: (vMid.uv[1] - v0.uv[1]) / (vMid.positionScreen.y - v0.positionScreen.y || 1),
            wSlope: (vMid.invW - v0.invW) / (vMid.positionScreen.y - v0.positionScreen.y || 1)
        },
        { // vMid-vTop边
            yMin: Math.ceil(vMid.positionScreen.y),
            yMax: Math.floor(vTop.positionScreen.y),
            dy: vTop.positionScreen.y - vMid.positionScreen.y,
            invDy: 1 / (vTop.positionScreen.y - vMid.positionScreen.y || 1),
            xSlope: (vTop.positionScreen.x - vMid.positionScreen.x) / (vTop.positionScreen.y - vMid.positionScreen.y || 1),
            zSlope: (vTop.positionScreen.z - vMid.positionScreen.z) / (vTop.positionScreen.y - vMid.positionScreen.y || 1),
            uSlope: (vTop.uv[0] - vMid.uv[0]) / (vTop.positionScreen.y - vMid.positionScreen.y || 1),
            vSlope: (vTop.uv[1] - vMid.uv[1]) / (vTop.positionScreen.y - vMid.positionScreen.y || 1),
            wSlope: (vTop.invW - vMid.invW) / (vTop.positionScreen.y - vMid.positionScreen.y || 1)
        },
        { // v0-vTop边
            yMin: Math.ceil(v0.positionScreen.y),
            yMax: Math.floor(vTop.positionScreen.y),
            dy: vTop.positionScreen.y - v0.positionScreen.y,
            invDy: 1 / (vTop.positionScreen.y - v0.positionScreen.y || 1),
            xSlope: (vTop.positionScreen.x - v0.positionScreen.x) / (vTop.positionScreen.y - v0.positionScreen.y || 1),
            zSlope: (vTop.positionScreen.z - v0.positionScreen.z) / (vTop.positionScreen.y - v0.positionScreen.y || 1),
            uSlope: (vTop.uv[0] - v0.uv[0]) / (vTop.positionScreen.y - v0.positionScreen.y || 1),
            vSlope: (vTop.uv[1] - v0.uv[1]) / (vTop.positionScreen.y - v0.positionScreen.y || 1),
            wSlope: (vTop.invW - v0.invW) / (vTop.positionScreen.y - v0.positionScreen.y || 1)
        }
    ];

    // 主循环
    for (let y = edges[0].yMin; y <= edges[2].yMax; y++) {
        let count = 0;

        // 处理v0-vMid边
        if (y >= edges[0].yMin && y <= edges[0].yMax) {
            const t = (y - v0.positionScreen.y) * edges[0].invDy;
            intersections[count++] = {
                x: v0.positionScreen.x + edges[0].xSlope * (y - v0.positionScreen.y),
                z: v0.positionScreen.z + edges[0].zSlope * (y - v0.positionScreen.y),
                u: v0.uv[0] + edges[0].uSlope * (y - v0.positionScreen.y),
                v: v0.uv[1] + edges[0].vSlope * (y - v0.positionScreen.y),
                w: v0.invW + edges[0].wSlope * (y - v0.positionScreen.y)
            };
        }

        // 处理vMid-vTop边
        if (y >= edges[1].yMin && y <= edges[1].yMax) {
            const t = (y - vMid.positionScreen.y) * edges[1].invDy;
            intersections[count++] = {
                x: vMid.positionScreen.x + edges[1].xSlope * (y - vMid.positionScreen.y),
                z: vMid.positionScreen.z + edges[1].zSlope * (y - vMid.positionScreen.y),
                u: vMid.uv[0] + edges[1].uSlope * (y - vMid.positionScreen.y),
                v: vMid.uv[1] + edges[1].vSlope * (y - vMid.positionScreen.y),
                w: vMid.invW + edges[1].wSlope * (y - vMid.positionScreen.y)
            };
        }

        // 处理v0-vTop边（仅当不在其他边范围内时）
        if (count < 2 && y >= edges[2].yMin && y <= edges[2].yMax) {
            const t = (y - v0.positionScreen.y) * edges[2].invDy;
            intersections[count++] = {
                x: v0.positionScreen.x + edges[2].xSlope * (y - v0.positionScreen.y),
                z: v0.positionScreen.z + edges[2].zSlope * (y - v0.positionScreen.y),
                u: v0.uv[0] + edges[2].uSlope * (y - v0.positionScreen.y),
                v: v0.uv[1] + edges[2].vSlope * (y - v0.positionScreen.y),
                w: v0.invW + edges[2].wSlope * (y - v0.positionScreen.y)
            };
        }

        if (count < 2) continue;

        // 确定左右交点
        let left = intersections[0], right = intersections[1];
        if (left.x > right.x) [left, right] = [right, left];

        // 透视校正插值
        const span = right.x - left.x;
        if (span <= 0) continue;

        const xStart = Math.ceil(left.x);
        const xEnd = Math.floor(right.x);
        const xDelta = xEnd - xStart;
        
        // 预计算增量步长
        const invSpan = 1 / span;
        const wLeft = left.w, wRight = right.w;
        const wStep = (wRight - wLeft) * invSpan;
        
        // 初始化参数
        let currentW = wLeft + (xStart - left.x) * wStep;
        const zStep = (right.z - left.z) * invSpan;
        let currentZ = left.z + (xStart - left.x) * zStep;
        const uStep = (right.u - left.u) * invSpan;
        let currentU = left.u + (xStart - left.x) * uStep;
        const vStep = (right.v - left.v) * invSpan;
        let currentV = left.v + (xStart - left.x) * vStep;

        // 水平扫描
        for (let x = xStart; x <= xEnd; x++) {
            // 透视校正
            const invW = currentW;
            const depth = currentZ * invW; // 已经过校正的深度
            const u = currentU * invW;
            const v = currentV * invW;

            setPixel(x, y, depth, u, v);

            // 增量更新
            currentW += wStep;
            currentZ += zStep;
            currentU += uStep;
            currentV += vStep;
        }
    }
}
function fillTriangleScanline2(a:Vertex, b:Vertex, c:Vertex, setPixel:any) {
    // 辅助函数
    const lerp = (a:number, b:number, t:number) => a + t * (b - a);
    const clamp = (v:number, min:number, max:number) => Math.max(min, Math.min(max, v));

    // 排序顶点（按y升序）
    const points = [a, b, c].sort((p1, p2) => p1.positionScreen.y - p2.positionScreen.y);
    const [v0, v1, v2] = points;
    
    const y0 = v0.positionScreen.y, y1 = v1.positionScreen.y, y2 = v2.positionScreen.y;
    if (y0 === y2) return;

    // 处理下半部分（v0到v1）
    if (y0 < y1) {
        const dy = y1 - y0 || 1;
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
            const t1 = (y - y0) / (y2 - y0);
            const t2 = (y - y0) / dy;
            
            // 左右边插值
            const xA = lerp(v0.positionScreen.x, v2.positionScreen.x, t1);
            const xB = lerp(v0.positionScreen.x, v1.positionScreen.x, t2);
            const [xL, xR] = xA < xB ? [xA, xB] : [xB, xA];

            // UV插值
            const uA = lerp(v0.uv[0], v2.uv[0], t1);
            const uB = lerp(v0.uv[0], v1.uv[0], t2);
            const vA = lerp(v0.uv[1], v2.uv[1], t1);
            const vB = lerp(v0.uv[1], v1.uv[1], t2);

            // z插值
            const zA = lerp(v0.positionScreen.z, v2.positionScreen.z, t1);
            const zB = lerp(v0.positionScreen.z, v1.positionScreen.z, t2);

            // 水平遍历
            const startX = Math.floor(xL);
            const endX = Math.ceil(xR);
            for (let x = startX; x <= endX; x++) {
                const t = (x - xL) / (xR - xL || 1);
                const u = lerp(uA, uB, t);
                const v = lerp(vA, vB, t);
                const z = lerp(zA, zB, t);
                setPixel(x, y,z, u, v);
            }
        }
    }

    // 处理上半部分（v1到v2）
    if (y1 < y2) {
        const dy = y2 - y1 || 1;
        for (let y = Math.floor(y1); y <= Math.ceil(y2); y++) {
            const t1 = (y - y0) / (y2 - y0);
            const t2 = (y - y1) / dy;
            
            // 左右边插值
            const xA = lerp(v0.positionScreen.x, v2.positionScreen.x, t1);
            const xB = lerp(v1.positionScreen.x, v2.positionScreen.x, t2);
            const [xL, xR] = xA < xB ? [xA, xB] : [xB, xA];

            // UV插值
            const uA = lerp(v0.uv[0], v2.uv[0], t1);
            const uB = lerp(v1.uv[0], v2.uv[0], t2);
            const vA = lerp(v0.uv[1], v2.uv[1], t1);
            const vB = lerp(v1.uv[1], v2.uv[1], t2);
            // z插值
            const zA = lerp(v0.positionScreen.z, v2.positionScreen.z, t1);
            const zB = lerp(v1.positionScreen.z, v2.positionScreen.z, t2);

            // 水平遍历
            const startX = Math.floor(xL);
            const endX = Math.ceil(xR);
            for (let x = startX; x <= endX; x++) {
                const t = (x - xL) / (xR - xL || 1);
                const u = lerp(uA, uB, t);
                const v = lerp(vA, vB, t);
                const z = lerp(zA, zB, t);
                setPixel(x, y,z, u, v);
            }
        }
    }
}
export function fillTriangle(v1: Vertex, v2: Vertex, v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    return interpolateFillTriangle3(v1, v2, v3, setPixel)
}
// 插值填充三角形

export function interpolateFillTriangle(v1: Vertex, v2: Vertex, v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    let a = v1
    let b = v2
    let c = v3

    if (a.positionScreen.y > b.positionScreen.y) {
        let tmp = a;
        a = b
        b = tmp
    }
    if (b.positionScreen.y > c.positionScreen.y) {
        let tmp = b;
        b = c
        c = tmp
    }
    if (a.positionScreen.y > b.positionScreen.y) {
        let tmp = a;
        a = b
        b = tmp
    }
    let minY = Math.floor(a.positionScreen.y), maxY = Math.ceil(c.positionScreen.y)
    let polygons=[a,b,c]
    let intersections:Intersection[]=[]
    for (let y = minY; y <= maxY; y++) {
            intersections.length=0
            for(let i=0,j=2;i<3;j=i++){
                let v0=polygons[j]
                let v1=polygons[i]
                if(v0.positionScreen.y>y!==v1.positionScreen.y>y){
                    let t=(y-v0.positionScreen.y)/(v1.positionScreen.y-v0.positionScreen.y)

                    intersections.push({
                        x:lerp(v0.positionScreen.x,v1.positionScreen.x,t),
                        z:lerp(v0.positionScreen.z,v1.positionScreen.z,t),
                        u:lerp(v0.uv[0],v1.uv[0],t),
                        v:lerp(v0.uv[1],v1.uv[1],t),
                        w:v0.invW+(v1.invW-v0.invW)*t
                    })

                }
            }
            if(intersections.length<2)continue

            intersections.sort((a,b)=>a.x-b.x)
            let left=intersections[0]
            let right=intersections[intersections.length-1]
            let startX=Math.floor(left.x),endX=Math.ceil(right.x)
            if(startX!==endX){
                for(let x=startX;x<=endX;x++){
                    let t=(x-startX)/(endX-startX)
                    let u=left.u+(right.u-left.u)*t
                    let v=left.v+(right.v-left.v)*t
                    let depth=left.z+(right.z-left.z)*t
    
                    setPixel(x,y,depth,u,v)
                }
            }

    }   



}



export function interpolateFillTriangle2(_v1: Vertex, _v2: Vertex, _v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    let a = _v1
    let b = _v2
    let c = _v3

    if (a.positionScreen.y > b.positionScreen.y) {
        let tmp = a;
        a = b
        b = tmp
    }
    if (b.positionScreen.y > c.positionScreen.y) {
        let tmp = b;
        b = c
        c = tmp
    }
    if (a.positionScreen.y > b.positionScreen.y) {
        let tmp = a;
        a = b
        b = tmp
    }


    let k = 0;
    let k2 = 0
    if (b.positionScreen.y - a.positionScreen.y > 0) {
        k = (b.positionScreen.x - a.positionScreen.x) / (b.positionScreen.y - a.positionScreen.y )
    }
    if (c.positionScreen.y - a.positionScreen.y > 0) {
        k2 = (c.positionScreen.x - a.positionScreen.x) / (c.positionScreen.y - a.positionScreen.y )
    }

    // b在a的边，否则b在a的左边
    let isRight = k > k2// bx >= cx;
    let isFlatBottom = Math.abs(c.positionScreen.y-b.positionScreen.y)<1e-6
    let isFlatTop =Math.abs(a.positionScreen.y-b.positionScreen.y)<1e-6;
    // 从Y轴，最小y开始逐行扫描 

    let startY=Math.floor(a.positionScreen.y),endY=Math.ceil(c.positionScreen.y)
    let t=0,t2=0
    let left,right,u1,u2,v1,v2,z1,z2,t3
    for (let y = startY; y <=endY; y++) {
         t = (c.positionScreen.y - y) > 0 ? (y - a.positionScreen.y) / (c.positionScreen.y - a.positionScreen.y) : 1
        // 如果不是平顶或其它
        if (y < b.positionScreen.y) {
            t2 = isFlatBottom ? t : (y - a.positionScreen.y) / (b.positionScreen.y - a.positionScreen.y);
            if (isRight) {
                left = lerp(a.positionScreen.x, c.positionScreen.x, t)
                right = lerp(a.positionScreen.x, b.positionScreen.x, t2)

                u1 = lerp(a.uv[0], c.uv[0], t)
                u2 = lerp(a.uv[0], b.uv[0], t2)

                v1 = lerp(a.uv[1], c.uv[1], t)
                v2 = lerp(a.uv[1], b.uv[1], t2)

                z1 = lerp(a.positionScreen.z, c.positionScreen.z, t)
                z2 = lerp(a.positionScreen.z,b.positionScreen.z, t2)
            } else {
                left = lerp(a.positionScreen.x, b.positionScreen.x, t2)
                right = lerp(a.positionScreen.x, c.positionScreen.x, t)

                u1 = lerp(a.uv[0], b.uv[0], t2)
                u2 = lerp(a.uv[0], c.uv[0], t)

                v1 = lerp(a.uv[1], b.uv[1], t2)
                v2 = lerp(a.uv[1], c.uv[1], t)

                z1 = lerp(a.positionScreen.z, b.positionScreen.z, t2)
                z2 = lerp(a.positionScreen.z, b.positionScreen.z, t)
            }

        } else {
            // 如果是平顶或其它
            t2 = isFlatTop ? t : (y - b.positionScreen.y) / (c.positionScreen.y - b.positionScreen.y);
            if (isRight) {
    
                left = lerp(a.positionScreen.x, c.positionScreen.x, t)
                right = lerp(b.positionScreen.x, c.positionScreen.x, t2)

                u1 = lerp(a.uv[0], c.uv[0], t)
                u2 = lerp(b.uv[0], c.uv[0], t2)

                v1 = lerp(a.uv[1], c.uv[1], t)
                v2 = lerp(b.uv[1], c.uv[1], t2)


                z1 = lerp(a.positionScreen.z, c.positionScreen.z, t)
                z2 = lerp(b.positionScreen.z,c.positionScreen.z, t2)
            } else {
          
                left = lerp(b.positionScreen.x, c.positionScreen.x, t2)
                right = lerp(a.positionScreen.x, c.positionScreen.x, t)

                u1 = lerp(b.uv[0], c.uv[0], t2)
                u2 = lerp(a.uv[0], c.uv[0], t)

                v1 = lerp(b.uv[1], c.uv[1], t2)
                v2 = lerp(a.uv[1], c.uv[1], t)

     
                z1 = lerp(b.positionScreen.z, c.positionScreen.z, t2)
                z2 = lerp(a.positionScreen.z, c.positionScreen.z, t)
            }

        }
        let startX = Math.floor(left)
        let endX = Math.ceil(right)

        for (let x = startX; x <= endX; x++) {
            t3 = right - left > 0 ? (x - left) / (right - left) : 1
            let u = lerp(u1, u2, t3)
            let v = lerp(v1, v2, t3)
            let z = lerp(z1, z2, t3)

            setPixel(x,y,z,u,v)
        }
    }


}




export function interpolateFillTriangle3(_v1: Vertex, _v2: Vertex, _v3: Vertex, setPixel: (x: number, y: number, depth: number, u: number, v: number) => void) {

    let a = _v1;
    let b = _v2;
    let c = _v3;

    
    if (a.positionScreen.y > b.positionScreen.y) {
        let tmp = a;
        a = b
        b = tmp
    }
    if (b.positionScreen.y > c.positionScreen.y) {
        let tmp = b;
        b = c
        c = tmp
    }
    if (a.positionScreen.y > b.positionScreen.y) {
        let tmp = a;
        a = b
        b = tmp
    }


    let k = 0;
    let k2 = 0
    if (b.positionScreen.y - a.positionScreen.y > 0) {
        k = (b.positionScreen.x - a.positionScreen.x) / (b.positionScreen.y - a.positionScreen.y )
    }
    if (c.positionScreen.y - a.positionScreen.y > 0) {
        k2 = (c.positionScreen.x - a.positionScreen.x) / (c.positionScreen.y - a.positionScreen.y )
    }

    let startY=Math.floor(a.positionScreen.y),endY=Math.ceil(c.positionScreen.y)
    // if(startY===endY){
    //     return
    // }
    const processScanLine=(y:number,a:Vertex,b:Vertex,c:Vertex,d:Vertex)=>{
        let t0 = b.positionScreen.y!==a.positionScreen.y?(y - a.positionScreen.y) / (b.positionScreen.y - a.positionScreen.y ):1
        let t1 = d.positionScreen.y!==c.positionScreen.y?(y - c.positionScreen.y) / (d.positionScreen.y - c.positionScreen.y ):1

        let x0=lerp(a.positionScreen.x,b.positionScreen.x,t0)
        let x1=lerp(c.positionScreen.x,d.positionScreen.x,t1)
        let u0=lerp(a.uv[0],b.uv[0],t0)
        let v0=lerp(a.uv[1],b.uv[1],t0)
        let u1=lerp(c.uv[0],d.uv[0],t1)
        let v1=lerp(c.uv[1],d.uv[1],t1)

        let z0=lerp(a.positionScreen.z,b.positionScreen.z,t0)
        let z1=lerp(c.positionScreen.z,d.positionScreen.z,t1)

        const w0 = lerp(1/a.invW, 1/b.invW, t0);
        const w1 = lerp(1/c.invW, 1/d.invW, t1);

        let startX=Math.floor(x0),endX=Math.ceil(x1)
        if(startX===endX){
            return
        }
        for(let x=startX;x<=endX;x++){
            let t2=(x-startX)/(endX-startX)
            let u=lerp(u0,u1,t2)
            let v=lerp(v0,v1,t2)
          //  let z=lerp(z0,z1,t2)
            // 原线性插值（错误）
            //let z = lerp(z0, z1, t2);
            // 应改为透视校正插值 ↓
       
            const invW = lerp(w0, w1, t2);
            let z = (lerp(z0*w0, z1*w1, t2)) / invW;
            setPixel(x,y,z,u,v)
        }
    }
            // c
            // -
            // -- 
            // - -
            // -  -
            // -   - b
            // -  -
            // - -
            // -
            // a
    // 如果b在c右边,否则b在c左边
    if(k>k2){
        for (let y = startY; y <=endY; y++) {

            if(y<b.positionScreen.y){
                processScanLine(y,a,c,a,b)
            }else{
                processScanLine(y,a,c,b,c)
            }
        }
    }else{
            //        c
            //        -
            //       -- 
            //      - -
            //     -  -
            // b -    - 
            //     -  -
            //      - -
            //        -
            //        a
        for (let y = startY; y <=endY; y++) {
            if(y<b.positionScreen.y){
                processScanLine(y,a,b,a,c)
            }else{
                processScanLine(y,b,c,a,c)
            }
        }
    }
  


}


