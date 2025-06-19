function getPolygonPolygonIntersections(polygon1: Polygon, polygon2: Polygon): Point[] {
    const intersections: Point[] = [];
  
    for (let i = 0; i < polygon1.length; i++) {
      for (let j = 0; j < polygon2.length; j++) {
        const p1 = polygon1[i];
        const p2 = polygon1[(i + 1) % polygon1.length];
        const q1 = polygon2[j];
        const q2 = polygon2[(j + 1) % polygon2.length];
  
        const intersection = getLineIntersection(p1, p2, q1, q2);
        if (intersection) {
          intersections.push(intersection);
        }
      }
    }
  
    return intersections;
  }
  

/** 计算两个向量的点积 */
function dotProduct(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

/** 计算向量的长度 */
function vectorLength(v: Point): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/** 将向量归一化 */
function normalize(v: Point): Point {
  const len = vectorLength(v);
  if (len === 0) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / len, y: v.y / len };
}

/** 获取多边形所有边的向量 */
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

/** 将多边形的顶点投影到某个轴上，返回投影区间 */
function projectPolygonOntoAxis(polygon: Polygon, axis: Point): { min: number; max: number } {
  // 这里要求 axis 为单位向量
  let min = dotProduct(polygon[0], axis);
  let max = min;
  for (let i = 1; i < polygon.length; i++) {
    const projection = dotProduct(polygon[i], axis);
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }
  return { min, max };
}

/** 将圆投影到某个轴上，返回投影区间 */
function projectCircleOntoAxis(circle: Circle, axis: Point): { min: number; max: number } {
  const centerProjection = dotProduct(circle.center, axis);
  return { min: centerProjection - circle.radius, max: centerProjection + circle.radius };
}

/** 检测两个投影区间是否重叠 */
function isOverlap(proj1: { min: number; max: number }, proj2: { min: number; max: number }): boolean {
  return !(proj1.max < proj2.min || proj2.max < proj1.min);
}

/*===========================================
 1. 多边形与多边形的碰撞检测 (凸多边形)
 ===========================================*/
function isPolygonsColliding(polygonA: Polygon, polygonB: Polygon): boolean {
  const axes: Point[] = [];

  // 取 polygonA 每条边的法向量
  const edgesA = getPolygonEdges(polygonA);
  for (const edge of edgesA) {
    // 这里选取边的法向量（垂直于边），并归一化
    axes.push(normalize({ x: -edge.y, y: edge.x }));
  }

  // 取 polygonB 每条边的法向量
  const edgesB = getPolygonEdges(polygonB);
  for (const edge of edgesB) {
    axes.push(normalize({ x: -edge.y, y: edge.x }));
  }

  // 对每个轴做投影检测
  for (const axis of axes) {
    const projA = projectPolygonOntoAxis(polygonA, axis);
    const projB = projectPolygonOntoAxis(polygonB, axis);
    if (!isOverlap(projA, projB)) {
      // 找到了分离轴，说明不碰撞
      return false;
    }
  }
  return true; // 所有轴上均有重叠，说明碰撞
}

/*===========================================
 2. 多边形与圆的碰撞检测 (多边形为凸多边形)
 ===========================================*/
function isPolygonCircleColliding(polygon: Polygon, circle: Circle): boolean {
  const axes: Point[] = [];

  // 取多边形每条边的法向量作为候选轴
  const edges = getPolygonEdges(polygon);
  for (const edge of edges) {
    axes.push(normalize({ x: -edge.y, y: edge.x }));
  }

  // 另外，增加一个从圆心到多边形最近顶点的轴
  let closestVertex = polygon[0];
  let minDist = vectorLength({ x: circle.center.x - closestVertex.x, y: circle.center.y - closestVertex.y });
  for (let i = 1; i < polygon.length; i++) {
    const currentDist = vectorLength({ x: circle.center.x - polygon[i].x, y: circle.center.y - polygon[i].y });
    if (currentDist < minDist) {
      minDist = currentDist;
      closestVertex = polygon[i];
    }
  }
  const axisCenterToVertex = normalize({
    x: closestVertex.x - circle.center.x,
    y: closestVertex.y - circle.center.y,
  });
  axes.push(axisCenterToVertex);

  // 检测所有轴上投影的重叠情况
  for (const axis of axes) {
    const projPolygon = projectPolygonOntoAxis(polygon, axis);
    const projCircle = projectCircleOntoAxis(circle, axis);
    if (!isOverlap(projPolygon, projCircle)) {
      return false;
    }
  }
  return true;
}

/*===========================================
 3. 圆与圆的碰撞检测
 ===========================================*/
/**
 * 检测两个圆是否碰撞（通过圆心距离比较）
 */
function areCirclesColliding(circleA: Circle, circleB: Circle): boolean {
  const dx = circleB.center.x - circleA.center.x;
  const dy = circleB.center.y - circleA.center.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = circleA.radius + circleB.radius;
  return distanceSquared <= radiusSum * radiusSum;
}



/**
 * 判断点 (x,y) 是否在多边形内部。
 * 对于 fillRule=="evenodd"，采用奇偶规则；
 * 对于 fillRule=="nonzero"，采用绕数（winding number）判断法。
 */
function pointInPolygon(
  x: number,
  y: number,
  polygon: number[][],
  fillRule: "evenodd" | "nonzero"
): boolean {
  if (fillRule === "evenodd") {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0],
        yi = polygon[i][1];
      const xj = polygon[j][0],
        yj = polygon[j][1];
      // 条件：当前扫描线与边相交
      const intersect =
        (yi > y) !== (yj > y) &&
        x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  } else {
    // nonzero 使用绕数算法
    let windingNumber = 0;
    for (let i = 0; i < polygon.length; i++) {
      const [x0, y0] = polygon[i];
      const [x1, y1] = polygon[(i + 1) % polygon.length];
      if (y0 <= y) {
        if (y1 > y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) > 0) {
          windingNumber++;
        }
      } else {
        if (y1 <= y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) < 0) {
          windingNumber--;
        }
      }
    }
    return windingNumber !== 0;
  }
}