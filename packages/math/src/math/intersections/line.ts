type Point = { x: number; y: number };
type Segment = { start: Point; end: Point };
type Circle = { center: Point; radius: number };
type Polygon = Point[];

function getLineIntersection(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point | null {
  const s1_x = p1.x - p0.x;
  const s1_y = p1.y - p0.y;
  const s2_x = p3.x - p2.x;
  const s2_y = p3.y - p2.y;

  const s = (-s1_y * (p0.x - p2.x) + s1_x * (p0.y - p2.y)) / (-s2_x * s1_y + s1_x * s2_y);
  const t = ( s2_x * (p0.y - p2.y) - s2_y * (p0.x - p2.x)) / (-s2_x * s1_y + s1_x * s2_y);

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // 交点在两条线段上
    return {
      x: p0.x + (t * s1_x),
      y: p0.y + (t * s1_y)
    };
  }

  // 没有交点
  return null;
}

function getLineCircleIntersections(
  p1: Point,
  p2: Point,
  circle: Circle
): Point[] {
  const { center, radius } = circle;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = (fx * fx + fy * fy) - radius * radius;

  const discriminant = b * b - 4 * a * c;
  const intersections: Point[] = [];

  if (discriminant >= 0) {
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
      intersections.push({
        x: p1.x + t1 * dx,
        y: p1.y + t1 * dy
      });
    }

    if (t2 >= 0 && t2 <= 1) {
      intersections.push({
        x: p1.x + t2 * dx,
        y: p1.y + t2 * dy
      });
    }
  }

  return intersections;
}

function getLinePolygonIntersections(
  line: Segment,
  polygon: Polygon
): Point[] {
  const intersections: Point[] = [];
  const numVertices = polygon.length;

  for (let i = 0; i < numVertices; i++) {
    const vertex1 = polygon[i];
    const vertex2 = polygon[(i + 1) % numVertices];
    const edge: Segment = { start: vertex1, end: vertex2 };
    const intersection = getLineIntersection(line.start, line.end, edge.start, edge.end);
    if (intersection) {
      intersections.push(intersection);
    }
  }

  return intersections;
}


// 定义椭圆类型
type Ellipse = { center: Point; radiusX: number; radiusY: number; rotation?: number };

/**
 * 获取线段与椭圆的交点
 * @param p1 线段起点
 * @param p2 线段终点
 * @param ellipse 椭圆
 * @returns 交点数组
 */
function getLineEllipseIntersections(
  p1: Point,
  p2: Point,
  ellipse: Ellipse
): Point[] {
  const { center, radiusX, radiusY, rotation = 0 } = ellipse;
  const cosRotation = Math.cos(rotation);
  const sinRotation = Math.sin(rotation);

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = (
    (dx * cosRotation + dy * sinRotation) ** 2 / radiusX ** 2 +
    (dx * sinRotation - dy * cosRotation) ** 2 / radiusY ** 2
  );
  const b = 2 * (
    (fx * cosRotation + fy * sinRotation) * (dx * cosRotation + dy * sinRotation) / radiusX ** 2 +
    (fx * sinRotation - fy * cosRotation) * (dx * sinRotation - dy * cosRotation) / radiusY ** 2
  );
  const c = (
    (fx * cosRotation + fy * sinRotation) ** 2 / radiusX ** 2 +
    (fx * sinRotation - fy * cosRotation) ** 2 / radiusY ** 2 - 1
  );

  const discriminant = b * b - 4 * a * c;
  const intersections: Point[] = [];

  if (discriminant >= 0) {
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
      intersections.push({
        x: p1.x + t1 * dx,
        y: p1.y + t1 * dy
      });
    }

    if (t2 >= 0 && t2 <= 1) {
      intersections.push({
        x: p1.x + t2 * dx,
        y: p1.y + t2 * dy
      });
    }
  }

  return intersections;
}

/**
 * 获取线段与二次贝塞尔曲线的交点
 * @param p1 线段起点
 * @param p2 线段终点
 * @param start 贝塞尔曲线起点
 * @param control 贝塞尔曲线控制点
 * @param end 贝塞尔曲线终点
 * @returns 交点数组
 */
function getLineQuadraticBezierIntersections(
  p1: Point,
  p2: Point,
  start: Point,
  control: Point,
  end: Point
): Point[] {
  const intersections: Point[] = [];
  const epsilon = 1e-6;
  const maxIterations = 100;

  // 线段参数方程
  const lineX = (t: number) => p1.x + t * (p2.x - p1.x);
  const lineY = (t: number) => p1.y + t * (p2.y - p1.y);

  // 二次贝塞尔曲线参数方程
  const bezierX = (u: number) => (1 - u) ** 2 * start.x + 2 * (1 - u) * u * control.x + u ** 2 * end.x;
  const bezierY = (u: number) => (1 - u) ** 2 * start.y + 2 * (1 - u) * u * control.y + u ** 2 * end.y;

  // 牛顿迭代法求解交点
  const newtonRaphson = (u: number) => {
    for (let i = 0; i < maxIterations; i++) {
      const x = bezierX(u);
      const y = bezierY(u);
      const dxdu = 2 * (1 - u) * (control.x - start.x) + 2 * u * (end.x - control.x);
      const dydu = 2 * (1 - u) * (control.y - start.y) + 2 * u * (end.y - control.y);

      const f = x - lineX((x - p1.x) / (p2.x - p1.x + epsilon));
      const g = y - lineY((y - p1.y) / (p2.y - p1.y + epsilon));

      const denominator = dxdu * (p2.y - p1.y) - dydu * (p2.x - p1.x);
      if (Math.abs(denominator) < epsilon) break;

      const du = (f * (p2.y - p1.y) - g * (p2.x - p1.x)) / denominator;
      u -= du;

      if (Math.abs(du) < epsilon) {
        if (u >= 0 && u <= 1) {
          const t = (bezierX(u) - p1.x) / (p2.x - p1.x + epsilon);
          if (t >= 0 && t <= 1) {
            intersections.push({
              x: bezierX(u),
              y: bezierY(u)
            });
          }
        }
        break;
      }
    }
  };

  // 初始猜测值
  for (let u = 0; u <= 1; u += 0.1) {
    newtonRaphson(u);
  }

  return intersections;
}