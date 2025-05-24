// 参考 e:\fanyonglong\projects\private\dxMath\math\2d_intersections\polygon.ts 实现分离轴定理碰撞方法

// 假设 Point 和 Polygon 类型已定义
interface Point {
  x: number;
  y: number;
}

type Polygon = Point[];

// 获取多边形的边向量
function getPolygonEdges(polygon: Polygon): Point[] {
  const edges: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const nextIndex = (i + 1) % polygon.length;
    edges.push({
      x: polygon[nextIndex].x - polygon[i].x,
      y: polygon[nextIndex].y - polygon[i].y,
    });
  }
  return edges;
}

// 获取向量的垂直向量
function getPerpendicular(vector: Point): Point {
  return {
    x: -vector.y,
    y: vector.x,
  };
}

// 投影多边形到轴上
function projectPolygon(polygon: Polygon, axis: Point): {
  min: number;
  max: number;
} {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const dotProduct = polygon[i].x * axis.x + polygon[i].y * axis.y;
    if (dotProduct < min) {
      min = dotProduct;
    }
    if (dotProduct > max) {
      max = dotProduct;
    }
  }
  return {
    min,
    max,
  };
}

// 检查两个投影区间是否重叠
function intervalsOverlap(projection1: {
  min: number;
  max: number;
}, projection2: {
  min: number;
  max: number;
}): boolean {
  return !(projection1.max < projection2.min || projection2.max < projection1.min);
}

// 分离轴定理碰撞检测
function satCollision(polygon1: Polygon, polygon2: Polygon): boolean {
  const edges1 = getPolygonEdges(polygon1);
  const edges2 = getPolygonEdges(polygon2);

  const allEdges = [...edges1, ...edges2];

  for (let i = 0; i < allEdges.length; i++) {
    const axis = getPerpendicular(allEdges[i]);
    const projection1 = projectPolygon(polygon1, axis);
    const projection2 = projectPolygon(polygon2, axis);

    if (!intervalsOverlap(projection1, projection2)) {
      return false;
    }
  }

  return true;
}

// 定义 Circle 类型
interface Circle {
  center: Point;
  radius: number;
}

// 计算点到线段的最近点
function closestPointOnSegment(point: Point, segmentStart: Point, segmentEnd: Point): Point {
  const segmentVector = { x: segmentEnd.x - segmentStart.x, y: segmentEnd.y - segmentStart.y };
  const pointVector = { x: point.x - segmentStart.x, y: point.y - segmentStart.y };
  const segmentLengthSquared = segmentVector.x * segmentVector.x + segmentVector.y * segmentVector.y;
  if (segmentLengthSquared === 0) return segmentStart;
  const t = Math.max(0, Math.min(1, (pointVector.x * segmentVector.x + pointVector.y * segmentVector.y) / segmentLengthSquared));
  return {
    x: segmentStart.x + t * segmentVector.x,
    y: segmentStart.y + t * segmentVector.y
  };
}

// 多边形与圆的碰撞检测，并返回碰撞点和深度
function polygonCircleCollision(polygon: Polygon, circle: Circle): {
  isColliding: boolean;
  collisionPoint?: Point;
  depth?: number;
} {
  let minDistance = Infinity;
  let closestPoint: Point | null = null;

  // 遍历多边形的每条边
  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];
    const pointOnSegment = closestPointOnSegment(circle.center, p1, p2);
    const dx = pointOnSegment.x - circle.center.x;
    const dy = pointOnSegment.y - circle.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = pointOnSegment;
    }
  }

  if (closestPoint && minDistance < circle.radius) {
    const collisionPoint = closestPoint;
    const depth = circle.radius - minDistance;
    return {
      isColliding: true,
      collisionPoint,
      depth
    };
  }

  return {
    isColliding: false
  };
}

// 导出碰撞检测函数
export { satCollision };