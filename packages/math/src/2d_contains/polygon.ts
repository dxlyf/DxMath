type Point = { x: number; y: number };

type FillRule="evenodd" | "nonzero" 
// 点是否在多边形内
export const pointInPolygon2 = (point: Point,polygon: Point[],fillRule:FillRule='nonzero'): boolean => {
  let winding = 0;
  for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length];

      if(p1.y>point.y!==p2.y>point.y) {
          let isLeft=(p2.x-p1.x)*(point.y-p1.y)-(p2.y-p1.y)*(point.x-p1.x)
          if (p2.y>point.y&&isLeft > 0) {
              winding++
          }
          if (p2.y<=point.y&&isLeft < 0) {
              winding--
          }
      }
  }
  if(fillRule==='nonzero'){
      return winding!==0

  }
  return winding%2!==0
  
}
export function pointInPolygon(x:number,y:number,polygon:Point[]){
  let wind=0
  for(let i=0;i<polygon.length;i++){
      let p0=polygon[i]
      let p1=polygon[(i+1)%polygon.length]
      if(y>p0.y!=y>p1.y){
          if(x>=p0.x+(p1.x-p0.x)*(y-p0.y)/(p1.y-p0.y)){
              wind++
          }
      }
  }
  return wind
}
export const computeWindingNumber = (point:Point, polygon:Point[]) => {
  let wn = 0;
  const n = polygon.length;
  if (n < 3)
      return 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
      const pi = polygon[i];
      const pj = polygon[j];
      // 射线与边的相交测试（向右水平射线）
      if (pj.y <= point.y) {
          if (pi.y > point.y) {
              // 向上的边
              const isLeft = ((pi.x - pj.x) * (point.y - pj.y) - (point.x - pj.x) * (pi.y - pj.y));
              if (isLeft > 0)
                  wn++;
          }
      }
      else {
          if (pi.y <= point.y) {
              // 向下的边
              const isLeft = ((pi.x - pj.x) * (point.y - pj.y) - (point.x - pj.x) * (pi.y - pj.y));
              if (isLeft < 0)
                  wn--;
          }
      }
  }
  // 奇偶规则：wn%2 非零，点在多边形内；wn 等于0，点在多边形外。
  // 非零规则：wn 不等于0，点在多边形内；wn 等于0，点在多边形外。

  return wn;
};
/**
 * 判断点是否在多边形内（含边界）
 * @param point 待检测的点
 * @param polygon 多边形顶点数组（按顺序排列，自动闭合）
 * @returns 是否在多边形内部或边界上
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false; // 至少需要3个顶点

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const vi = polygon[i];
    const vj = polygon[j];

    // 检查点是否在顶点上
    if (vi.x === point.x && vi.y === point.y) return true;

    // 检查点是否在边 vj-vi 上
    if (isPointOnLineSegment2(point, vj, vi)) return true;

    // 射线与边相交判断逻辑
    const intersectY = (vi.y > point.y) !== (vj.y > point.y);
    if (!intersectY) continue;

    // 计算交点 X 坐标（使用直线方程参数形式避免除零错误）
    const slope = (vj.x - vi.x) / (vj.y - vi.y);
    const intersectX = vi.x + (point.y - vi.y) * slope;

    // 判断交点是否在射线右侧
    if (point.x < intersectX) {
      inside = !inside;
    } else if (point.x === intersectX) { // 点在边上
      return true;
    }
  }

  return inside;
}

/**
 * 判断点是否在线段上（简化版，不含误差）
 */
export function isPointOnLineSegment2(p: Point, a: Point, b: Point): boolean {
  // 检查点是否在线段的包围盒内
  if (Math.min(a.x, b.x) > p.x || p.x > Math.max(a.x, b.x) ||
      Math.min(a.y, b.y) > p.y || p.y > Math.max(a.y, b.y)) {
    return false;
  }

  // 检查点是否共线
  const crossProduct = (p.y - a.y) * (b.x - a.x) - (p.x - a.x) * (b.y - a.y);
  if (crossProduct !== 0) return false;

  // 计算参数 t
  const t = (a.x !== b.x) ? (p.x - a.x) / (b.x - a.x) : (p.y - a.y) / (b.y - a.y);
  return t >= 0 && t <= 1;
}