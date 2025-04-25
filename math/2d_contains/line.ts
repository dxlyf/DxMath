type Point = { x: number; y: number };

/**
 * 判断点是否在线段上（支持误差范围和端点控制）
 * @param point 待检测的点
 * @param start 线段起点
 * @param end 线段终点
 * @param epsilon 允许的误差范围（默认 0）
 * @param inclusive 是否包含线段的端点（默认 true）
 * @returns 是否在线段上
 */
export function isPointOnLineSegment(
  point: Point,
  start: Point,
  end: Point,
  epsilon: number = 0,
  inclusive: boolean = true
): boolean {
  // 处理线段长度为 0 的特殊情况（起点和终点重合）
  if (start.x === end.x && start.y === end.y) {
    return (
      Math.hypot(point.x - start.x, point.y - start.y) <= epsilon
    );
  }

  // 计算向量
  const lineVec = { x: end.x - start.x, y: end.y - start.y };  // 线段方向向量
  const pointVec = { x: point.x - start.x, y: point.y - start.y }; // 起点到点的向量

  // 计算投影参数 t（点在线段上的投影位置）
  const t = (pointVec.x * lineVec.x + pointVec.y * lineVec.y) / 
            (lineVec.x * lineVec.x + lineVec.y * lineVec.y);

  // 根据投影参数 t 判断最近点
  let closestPoint: Point;
  if (t < 0) {
    closestPoint = start; // 投影在起点外，最近点为起点
  } else if (t > 1) {
    closestPoint = end;   // 投影在终点外，最近点为终点
  } else {
    // 在线段上的投影点
    closestPoint = {
      x: start.x + t * lineVec.x,
      y: start.y + t * lineVec.y
    };
  }

  // 计算点与最近点的距离
  const dx = point.x - closestPoint.x;
  const dy = point.y - closestPoint.y;
  const distance = Math.hypot(dx, dy);

  // 根据是否包含端点和误差范围判断
  if (distance > epsilon) return false;
  if (inclusive) return true;

  // 如果不包含端点，需要额外检查是否恰好在端点上
  const isOnStart = Math.hypot(point.x - start.x, point.y - start.y) <= epsilon;
  const isOnEnd = Math.hypot(point.x - end.x, point.y - end.y) <= epsilon;
  return !isOnStart && !isOnEnd;
}