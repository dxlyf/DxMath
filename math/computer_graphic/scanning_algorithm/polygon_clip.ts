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


export const weilerAthertonClipper = (
  polygon: number[][],
  clipPolygon: number[][]
): number[][][] => {
  // 辅助接口和函数定义
  interface VertexNode {
      point: number[];
      isIntersection: boolean;
      entryExit: 'entry' | 'exit' | null;
      partner: VertexNode | null;
      next: VertexNode | null;
      prev: VertexNode | null;
      visited: boolean;
      isSubject: boolean;
  }

  // 确保多边形顺时针顺序
  const isClockwise = (poly: number[][]) => {
      let sum = 0;
      for (let i = 0; i < poly.length; i++) {
          const j = (i + 1) % poly.length;
          sum += (poly[j][0] - poly[i][0]) * (poly[j][1] + poly[i][1]);
      }
      return sum > 0;
  };

  const makeClockwise = (poly: number[][]) => {
      return isClockwise(poly) ? poly : [...poly].reverse();
  };

  const subject = makeClockwise(polygon);
  const clip = makeClockwise(clipPolygon);

  // 创建双向链表
  const createLinkedList = (poly: number[][], isSubject: boolean) => {
      const nodes: VertexNode[] = poly.map(point => ({
          point,
          isIntersection: false,
          entryExit: null,
          partner: null,
          next: null,
          prev: null,
          visited: false,
          isSubject,
      }));
      for (let i = 0; i < nodes.length; i++) {
          nodes[i].next = nodes[(i + 1) % nodes.length];
          nodes[i].prev = nodes[i === 0 ? nodes.length - 1 : i - 1];
      }
      return nodes;
  };

  // 计算线段交点
  const getIntersection = (
      a1: number[],
      a2: number[],
      b1: number[],
      b2: number[]
  ) => {
      const [x1, y1] = a1;
      const [x2, y2] = a2;
      const [x3, y3] = b1;
      const [x4, y4] = b2;

      const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
      if (denominator === 0) return null; // 平行或重合

      const tNumerator = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
      const sNumerator = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
      const t = tNumerator / denominator;
      const s = sNumerator / denominator;

      if (t < 0 || t > 1 || s < 0 || s > 1) return null;

      return {
          point: [x1 + t * (x2 - x1), y1 + t * (y2 - y1)],
          t,
          s,
      };
  };

  // 插入交点节点到链表
  const insertNode = (
      start: VertexNode,
      end: VertexNode,
      node: VertexNode,
      isSubject: boolean
  ) => {
      node.prev = start;
      node.next = end;
      start.next = node;
      end.prev = node;
      node.isSubject = isSubject;
  };

  // 判断点是否在多边形内
  const isInside = (point: number[], poly: number[][]) => {
      let inside = false;
      const [x, y] = point;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i];
          const [xj, yj] = poly[j];
          const intersect =
              yi > y !== yj > y &&
              x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi;
          if (intersect) inside = !inside;
      }
      return inside;
  };

  // 主算法实现
  const subjectNodes = createLinkedList(subject, true);
  const clipNodes = createLinkedList(clip, false);
  const intersections: VertexNode[] = [];

  // 第一步：查找所有交点并插入链表
  for (let sNode of subjectNodes) {
      const sNext = sNode.next!;
      for (let cNode of clipNodes) {
          const cNext = cNode.next!;
          const intersect = getIntersection(
              sNode.point,
              sNext.point,
              cNode.point,
              cNext.point
          );
          if (intersect) {
              // 创建交点节点
              const sIntersection: VertexNode = {
                  point: intersect.point,
                  isIntersection: true,
                  entryExit: null,
                  partner: null,
                  next: null,
                  prev: null,
                  visited: false,
                  isSubject: true,
              };
              const cIntersection: VertexNode = {
                  point: intersect.point,
                  isIntersection: true,
                  entryExit: null,
                  partner: sIntersection,
                  next: null,
                  prev: null,
                  visited: false,
                  isSubject: false,
              };
              sIntersection.partner = cIntersection;

              // 插入到链表
              insertNode(sNode, sNext, sIntersection, true);
              insertNode(cNode, cNext, cIntersection, false);

              // 标记进出类型
              const startInside = isInside(sNode.point, clip);
              const endInside = isInside(sNext.point, clip);
              sIntersection.entryExit = startInside ? 'exit' : 'entry';
              cIntersection.entryExit = startInside ? 'entry' : 'exit';

              intersections.push(sIntersection);
          }
      }
  }
  
  // 第二步：遍历收集结果多边形
  const result: number[][][] = [];
  for (const intersect of intersections) {
      if (intersect.entryExit === 'entry' && !intersect.visited) {
          const path: number[] = [];
          let current: VertexNode | null = intersect;
          let isSubject = true;

          while (current && !current.visited) {
              current.visited = true;
              path.push(...current.point);

              // 沿当前多边形遍历
              let next = current.next!;
              while (!next.isIntersection && next !== current) {
                  next.visited = true;
                  path.push(...next.point);
                  next = next.next!;
              }

              if (next.isIntersection) {
                  current = isSubject ? next.partner : next;
                  isSubject = !isSubject;
              } else {
                  break;
              }
          }

          if (path.length > 0) {
              result.push(
                  Array.from({ length: path.length / 2 }, (_, i) => [
                      path[2 * i],
                      path[2 * i + 1],
                  ])
              );
          }
      }
  }

  return result;
};
