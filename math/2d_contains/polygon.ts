type Point = { x: number; y: number };

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
    if (isPointOnLineSegment(point, vj, vi)) return true;

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
export function isPointOnLineSegment(p: Point, a: Point, b: Point): boolean {
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