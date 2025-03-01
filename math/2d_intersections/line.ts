type Point = { x: number; y: number };
type Segment = { start: Point; end: Point };

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

type Circle = { center: Point; radius: number };

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

type Polygon = Point[];

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

