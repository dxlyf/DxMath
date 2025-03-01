export type Point = { x: number; y: number };
export type Line = { start: Point; end: Point };
export type Polygon = Point[];
export type Rectangle = { min: Point; max: Point };

// 逐边裁剪法
export function clipLineByEdge(line: Line, rect: Rectangle): Line | null {
  let { start, end } = line;
  if (start.x < rect.min.x) start.x = rect.min.x;
  if (start.x > rect.max.x) start.x = rect.max.x;
  if (start.y < rect.min.y) start.y = rect.min.y;
  if (start.y > rect.max.y) start.y = rect.max.y;
  if (end.x < rect.min.x) end.x = rect.min.x;
  if (end.x > rect.max.x) end.x = rect.max.x;
  if (end.y < rect.min.y) end.y = rect.min.y;
  if (end.y > rect.max.y) end.y = rect.max.y;
  return { start, end };
}

// Cohen-Sutherland编码裁剪法
export function cohenSutherlandClip(line: Line, rect: Rectangle): Line | null {
  const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;
  function computeOutCode(p: Point) {
    let code = INSIDE;
    if (p.x < rect.min.x) code |= LEFT;
    else if (p.x > rect.max.x) code |= RIGHT;
    if (p.y < rect.min.y) code |= BOTTOM;
    else if (p.y > rect.max.y) code |= TOP;
    return code;
  }
  let { start, end } = line;
  let outCode0 = computeOutCode(start);
  let outCode1 = computeOutCode(end);
  let accept = false;
  while (true) {
    if (!(outCode0 | outCode1)) { accept = true; break; }
    else if (outCode0 & outCode1) break;
    else {
      let x = 0, y = 0;
      let outCodeOut = outCode0 ? outCode0 : outCode1;
      if (outCodeOut & TOP) { x = start.x + (end.x - start.x) * (rect.max.y - start.y) / (end.y - start.y); y = rect.max.y; }
      else if (outCodeOut & BOTTOM) { x = start.x + (end.x - start.x) * (rect.min.y - start.y) / (end.y - start.y); y = rect.min.y; }
      else if (outCodeOut & RIGHT) { y = start.y + (end.y - start.y) * (rect.max.x - start.x) / (end.x - start.x); x = rect.max.x; }
      else if (outCodeOut & LEFT) { y = start.y + (end.y - start.y) * (rect.min.x - start.x) / (end.x - start.x); x = rect.min.x; }
      if (outCodeOut === outCode0) { start = { x, y }; outCode0 = computeOutCode(start); }
      else { end = { x, y }; outCode1 = computeOutCode(end); }
    }
  }
  return accept ? { start, end } : null;
}

// Sutherland-Hodgman多边形裁剪
export function sutherlandHodgmanClip(polygon: Polygon, rect: Rectangle): Polygon {
  function clipEdge(polygon: Polygon, edge: { a: Point, b: Point }): Polygon {
    let output: Polygon = [];
    let prev = polygon[polygon.length - 1];
    for (let curr of polygon) {
      let insideCurr = curr.x >= rect.min.x && curr.x <= rect.max.x && curr.y >= rect.min.y && curr.y <= rect.max.y;
      let insidePrev = prev.x >= rect.min.x && prev.x <= rect.max.x && prev.y >= rect.min.y && prev.y <= rect.max.y;
      if (insideCurr) {
        if (!insidePrev) {
          output.push({ x: rect.min.x, y: prev.y + (curr.y - prev.y) * (rect.min.x - prev.x) / (curr.x - prev.x) });
        }
        output.push(curr);
      } else if (insidePrev) {
        output.push({ x: rect.min.x, y: prev.y + (curr.y - prev.y) * (rect.min.x - prev.x) / (curr.x - prev.x) });
      }
      prev = curr;
    }
    return output;
  }
  let clippedPolygon = polygon;
  clippedPolygon = clipEdge(clippedPolygon, { a: rect.min, b: { x: rect.max.x, y: rect.min.y } });
  clippedPolygon = clipEdge(clippedPolygon, { a: { x: rect.max.x, y: rect.min.y }, b: rect.max });
  clippedPolygon = clipEdge(clippedPolygon, { a: rect.max, b: { x: rect.min.x, y: rect.max.y } });
  clippedPolygon = clipEdge(clippedPolygon, { a: { x: rect.min.x, y: rect.max.y }, b: rect.min });
  return clippedPolygon;
}


function inside(p: number[], edgeStart: number[], edgeEnd: number[]): boolean {
  return (edgeEnd[0] - edgeStart[0]) * (p[1] - edgeStart[1]) - (edgeEnd[1] - edgeStart[1]) * (p[0] - edgeStart[0]) >= 0;
}

function intersection(s: number[], e: number[], clipStart: number[], clipEnd: number[]): number[] {
  const dc = [clipStart[0] - clipEnd[0], clipStart[1] - clipEnd[1]];
  const dp = [s[0] - e[0], s[1] - e[1]];
  const n1 = clipStart[0] * clipEnd[1] - clipStart[1] * clipEnd[0];
  const n2 = s[0] * e[1] - s[1] * e[0];
  const n3 = 1.0 / (dc[0] * dp[1] - dc[1] * dp[0]);
  return [(n1 * dp[0] - n2 * dc[0]) * n3, (n1 * dp[1] - n2 * dc[1]) * n3];
}
export function buildClipRect(x: number, y: number, w: number, h: number): number[][] {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]
}
// Sutherland-Hodgman Algorithm for Convex Polygon Clipping
export function sutherlandHodgmanClip2(subjectPolygon: number[][], clipPolygon: number[][]): number[][] {

  let outputList = subjectPolygon;
  for (let i = 0; i < clipPolygon.length; i++) {
    const inputList = outputList;
    outputList = [];
    const clipStart = clipPolygon[i];
    const clipEnd = clipPolygon[(i + 1) % clipPolygon.length];
    let s = inputList[inputList.length - 1];
    for (const e of inputList) {
      if (inside(e, clipStart, clipEnd)) {
        if (!inside(s, clipStart, clipEnd)) {
          outputList.push(intersection(s, e, clipStart, clipEnd));
        }
        outputList.push(e);
      } else if (inside(s, clipStart, clipEnd)) {
        outputList.push(intersection(s, e, clipStart, clipEnd));
      }
      s = e;
    }
  }
  return outputList;
}

// Weiler-Atherton Algorithm for Arbitrary Polygon Clipping
export function weilerAthertonClip(subjectPolygon: number[][], clipPolygon: number[][]): number[][] {
  function isInside(p: number[], edgeStart: number[], edgeEnd: number[]): boolean {
    return (edgeEnd[0] - edgeStart[0]) * (p[1] - edgeStart[1]) - (edgeEnd[1] - edgeStart[1]) * (p[0] - edgeStart[0]) >= 0;
  }

  function findIntersections(subjectPolygon: number[][], clipPolygon: number[][]): number[][] {
    let intersections: number[][] = [];
    for (let i = 0; i < subjectPolygon.length; i++) {
      let s1 = subjectPolygon[i];
      let s2 = subjectPolygon[(i + 1) % subjectPolygon.length];
      for (let j = 0; j < clipPolygon.length; j++) {
        let c1 = clipPolygon[j];
        let c2 = clipPolygon[(j + 1) % clipPolygon.length];
        let intersect = intersection(s1, s2, c1, c2);
        if (intersect) intersections.push(intersect);
      }
    }
    return intersections;
  }

  const intersections = findIntersections(subjectPolygon, clipPolygon);
  if (intersections.length === 0) return subjectPolygon;

  let outputPolygon: number[][] = [];
  let inside = isInside(subjectPolygon[0], clipPolygon[0], clipPolygon[1]);
  for (let i = 0; i < subjectPolygon.length; i++) {
    let current = subjectPolygon[i];
    if (inside) outputPolygon.push(current);
    if (intersections.some(p => p[0] === current[0] && p[1] === current[1])) inside = !inside;
  }
  return outputPolygon;
}




/**
 * Sutherland-Hodgman 多边形裁剪算法
 * @param subjectPolygon 待裁剪的多边形
 * @param clipWindow 裁剪窗口（凸多边形）
 */
export function sutherlandHodgmanClip3(
  subjectPolygon: Polygon,
  clipWindow: Polygon
): Polygon {
  // 逐边处理裁剪窗口的每条边
  return clipWindow.reduce((outputList, clipEdgeEnd, index) => {
    const clipEdgeStart = clipWindow[(index + clipWindow.length - 1) % clipWindow.length];
    return clipWithEdge(outputList, clipEdgeStart, clipEdgeEnd);
  }, subjectPolygon);

  // 单边裁剪逻辑
  function clipWithEdge(inputList: Polygon, edgeStart: Point, edgeEnd: Point): Polygon {
    const output: Polygon = [];
    const edgeNormal = computeEdgeNormal(edgeStart, edgeEnd);

    for (let i = 0; i < inputList.length; i++) {
      const currentPoint = inputList[i];
      const prevPoint = inputList[(i + inputList.length - 1) % inputList.length];

      // 判断点是否在可见侧
      const currentInside = isInside(currentPoint, edgeStart, edgeNormal);
      const prevInside = isInside(prevPoint, edgeStart, edgeNormal);

      // 计算交点
      if (currentInside !== prevInside) {
        const intersect = computeIntersection(prevPoint, currentPoint, edgeStart, edgeEnd);
        output.push(intersect);
      }

      if (currentInside) {
        output.push(currentPoint);
      }
    }
    return output;
  }

  // 计算边的法向量
  function computeEdgeNormal(start: Point, end: Point): Point {
    return {
      x: start.y - end.y,
      y: end.x - start.x
    };
  }

  // 点是否在边的可见侧
  function isInside(point: Point, edgeStart: Point, normal: Point): boolean {
    const dx = point.x - edgeStart.x;
    const dy = point.y - edgeStart.y;
    return (dx * normal.x + dy * normal.y) <= 0;
  }

  // 计算线段交点
  function computeIntersection(
    a: Point, b: Point,
    edgeStart: Point, edgeEnd: Point
  ): Point {
    const d1 = a.x * (edgeEnd.y - edgeStart.y) - a.y * (edgeEnd.x - edgeStart.x);
    const d2 = b.x * (edgeEnd.y - edgeStart.y) - b.y * (edgeEnd.x - edgeStart.x);
    const t = d1 / (d1 - d2);
    return {
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y)
    };
  }
}



// 判断点是否在裁剪边的内侧
const inside2 = (p: PointArray, edge: [PointArray, PointArray]): boolean => {
  const [a, b] = edge;
  // 计算边向量和点到边的向量叉积
  const cross = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
  return cross <= 0; // 假设裁剪窗口是顺时针方向
};

// 计算线段与裁剪边的交点
const intersection2 = (p1: PointArray, p2: PointArray, edge: [PointArray, PointArray]): PointArray => {
  const [a, b] = edge;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = a;
  const [x4, y4] = b;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denominator === 0) return p1; // 平行情况处理

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  return [
    x1 + t * (x2 - x1),
    y1 + t * (y2 - y1)
  ];
};

export const sutherlandHodgman = (
  subjectPolygon: PointArray[],
  clipPolygon: PointArray[]
): PointArray[] => {
  let outputList = subjectPolygon;

  // 遍历裁剪多边形的每条边
  for (let i = 0; i < clipPolygon.length; i++) {
    const edge: [PointArray, PointArray] = [
      clipPolygon[i],
      clipPolygon[(i + 1) % clipPolygon.length]
    ];

    const inputList = outputList;
    outputList = [];

    for (let j = 0; j < inputList.length; j++) {
      const current = inputList[j];
      const next = inputList[(j + 1) % inputList.length];

      // 处理当前顶点和下一个顶点
      const currentInside = inside2(current, edge);
      const nextInside = inside2(next, edge);

      if (currentInside) {
        outputList.push(current);
      }

      if (currentInside !== nextInside) {
        const intersect = intersection2(current, next, edge);
        outputList.push(intersect);
      }
    }

    if (outputList.length === 0) break;
  }

  return outputList;
};

type PointArray = number[];
interface Vertex {
  point: PointArray;
  isIntersection: boolean;
  intersectPartner?: Vertex;
  next?: Vertex;
  prev?: Vertex;
  processed: boolean;
  entryExit?: 'entry' | 'exit';
  id: string;
}
let vertexCounter = 0;

const createVertex = (point: PointArray): Vertex => ({
  point,
  isIntersection: false,
  processed: false,
  id: `v${vertexCounter++}`,
});

const insertVertexSorted = (start: Vertex, newVertex: Vertex, isSubject: boolean) => {
  let current: Vertex = start;
  const newT = isSubject ?
    calculateT(newVertex.point, start.point, start.next!.point) :
    calculateT(newVertex.point, current.point, current.next!.point);

  while (current.next !== start && current.next!.isIntersection) {
    const nextT = calculateT(current.next!.point, start.point, start.next!.point);
    if (newT <= nextT) break;
    current = current.next!;
  }

  const next = current.next!;
  current.next = newVertex;
  newVertex.prev = current;
  newVertex.next = next;
  next.prev = newVertex;
};

const calculateT = (point: PointArray, a1: PointArray, a2: PointArray): number => {
  const dx = a2[0] - a1[0];
  const dy = a2[1] - a1[1];
  if (dx === 0 && dy === 0) return 0;
  return ((point[0] - a1[0]) * dx + (point[1] - a1[1]) * dy) / (dx * dx + dy * dy);
};


const getIntersection = (a1: PointArray, a2: PointArray, b1: PointArray, b2: PointArray): PointArray | null => {
  const denom = (a2[0] - a1[0]) * (b2[1] - b1[1]) - (a2[1] - a1[1]) * (b2[0] - b1[0]);
  if (denom === 0) return null;

  const t = ((b1[0] - a1[0]) * (b2[1] - b1[1]) - (b1[1] - a1[1]) * (b2[0] - b1[0])) / denom;
  const u = ((b1[0] - a1[0]) * (a2[1] - a1[1]) - (b1[1] - a1[1]) * (a2[0] - a1[0])) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [(a1[0] + t * (a2[0] - a1[0])), a1[1] + t * (a2[1] - a1[1])];
  }
  return null;
};
// 优化后的射线法（包含边界点）
const isPointOnSegment = (p: PointArray, a: PointArray, b: PointArray, epsilon = 1e-6): boolean => {
  const cross = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]);
  if (Math.abs(cross) > epsilon) return false;

  const minX = Math.min(a[0], b[0]) - epsilon;
  const maxX = Math.max(a[0], b[0]) + epsilon;
  const minY = Math.min(a[1], b[1]) - epsilon;
  const maxY = Math.max(a[1], b[1]) + epsilon;

  return p[0] >= minX && p[0] <= maxX && p[1] >= minY && p[1] <= maxY;
};

const isPointInsidePolygon = (point: PointArray, polygon: PointArray[]): boolean => {
  // 先检查是否在边界上
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    if (isPointOnSegment(point, a, b)) return true;
  }
  // 增强射线法
  let inside = false;
  const x = point[0], y = point[1];
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-6) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

export const weilerAtherton = (subjectPolygon: PointArray[], clipPolygon: PointArray[]): PointArray[][] => {
  vertexCounter = 0;

  // 创建有序链表（按顺时针方向）
  const createList = (poly: PointArray[]) => {
    const vertices = poly.map(createVertex);
    vertices.forEach((v, i) => {
      v.next = vertices[(i + 1) % vertices.length];
      v.prev = vertices[(i - 1 + vertices.length) % vertices.length];
    });
    return vertices;
  };

  const subject = createList(subjectPolygon);
  const clip = createList(clipPolygon);

  // 阶段1：计算并排序插入交点
  for (let s of subject) {
    const sNext = s.next!;
    const intersections: Vertex[] = [];

    for (let c of clip) {
      const cNext = c.next!;
      const intPoint = getIntersection(s.point, sNext.point, c.point, cNext.point);
      if (!intPoint) continue;

      // 创建配对顶点时增加精度处理
      const precisePoint = [
        Number(intPoint[0].toFixed(2)),
        Number(intPoint[1].toFixed(2))
      ];
      // 创建配对顶点
      const sInt = { ...createVertex(precisePoint.slice()), isIntersection: true };
      const cInt = { ...createVertex(precisePoint.slice()), isIntersection: true, intersectPartner: sInt };
      sInt.intersectPartner = cInt;
      // 精确方向判断
      // const edgeVec = [cNext.point[0] - c.point[0], cNext.point[1] - c.point[1]];
      // const testVec = [precisePoint[0] - c.point[0], precisePoint[1] - c.point[1]];
      // const cross = edgeVec[0] * testVec[1] - edgeVec[1] * testVec[0];
      // const isInside = isPointInsidePolygon(precisePoint, clipPolygon);

      // // 修正逻辑：当叉积接近0时，依赖精确内部判断
      // sInt.entryExit = (cross > 0 || (Math.abs(cross) < 1e-6 && isInside)) ? 'entry' : 'exit';
      // cInt.entryExit = sInt.entryExit === 'entry' ? 'exit' : 'entry';

      // intersections.push(sInt);
      // insertVertexSorted(c, cInt, false); // 在裁剪多边形中按顺序插入
      // 精确方向判断（改用向量投影）
      const edgeVec = [cNext.point[0] - c.point[0], cNext.point[1] - c.point[1]];
      const subjectDir = [sNext.point[0] - s.point[0], sNext.point[1] - s.point[1]];
      const dot = edgeVec[0] * subjectDir[0] + edgeVec[1] * subjectDir[1];
      sInt.entryExit = dot > 0 ? 'entry' : 'exit';
      cInt.entryExit = sInt.entryExit === 'entry' ? 'exit' : 'entry';

      intersections.push(sInt);
      insertVertexSorted(c, cInt, false);
    }

   // 按自然顺序插入交点（删除.reverse()）
   intersections.sort((a, b) => 
    calculateT(a.point, s.point, sNext.point) - 
    calculateT(b.point, s.point, sNext.point)
  ).forEach(intersection => {
    insertVertexSorted(s, intersection, true);
  });
  }

  // 阶段2：追踪多边形
  const result: PointArray[][] = [];
  const processed = new Set<string>();
  // 阶段2：追踪逻辑修正
 // 阶段2：追踪逻辑修正
 const tracePolygon = (start: Vertex): PointArray[] => {
  const poly: PointArray[] = [];
  let current: Vertex | undefined = start;
  const initialId = start.id;
  
  do {
    if (!current || processed.has(current.id)) break;
    
    processed.add(current.id);
    poly.push([current.point[0], current.point[1]]);

    if (current.isIntersection && current.intersectPartner) {
      processed.add(current.intersectPartner.id);
      current = current.intersectPartner;
    }
    
    current = current.next;
  } while (current?.id !== initialId); // 严格环形终止条件

  return poly;
};

// 结果收集（优化闭合判断）
return subject
  .filter(s => s.isIntersection && s.entryExit === 'entry' && !processed.has(s.id))
  .map(s => {
    const poly = tracePolygon(s);
    return poly.length > 0 && poly[0].every((v,i) => 
      Math.abs(v - poly[poly.length-1][i]) < 1e-6
    ) ? poly : [...poly, poly[0]];
  })
  .filter(p => p.length >= 4);
};