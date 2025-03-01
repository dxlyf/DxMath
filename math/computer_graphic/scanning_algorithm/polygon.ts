import { drawBresenhamLine } from './line'


export const drawPolygon = (polygon: number[][], setPixel: (x: number, y: number) => void) => {

  for (let i = 0; i < polygon.length - 1; i++) {
    drawBresenhamLine(polygon[i][0], polygon[i][1], polygon[i + 1][0], polygon[i + 1][1], setPixel)
  }
}


export const polygonScanFill = (polygon: number[][], setPixel: (x: number, y: number) => void) => {
  // 边数据结构
  class Edge {
    yMax: number;
    x: number;
    dx: number;
    dy: number;
    constructor(y1: number, y2: number, x: number, mInv: number) {
      this.yMax = Math.max(y1, y2);
      this.x = y1 < y2 ? x : x + mInv * (y2 - y1); // 确保从下往上
      this.dx = mInv;
      this.dy = Math.abs(y2 - y1);
    }
  }

  // 1. 创建边表(ET)
  const ET: Map<number, Edge[]> = new Map();
  const vertices = polygon.map(([x, y]) => ({ x: Math.round(x), y: Math.round(y) }));

  // 遍历所有边
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];

    // 跳过水平线
    if (v1.y === v2.y) continue;

    const yMin = Math.min(v1.y, v2.y);
    const mInv = (v2.x - v1.x) / (v2.y - v1.y); // 1/m 避免除零

    const edge = new Edge(v1.y, v2.y, v1.x, mInv);

    if (!ET.has(yMin)) ET.set(yMin, []);
    ET.get(yMin)!.push(edge);
  }

  // 2. 初始化活动边表(AET)
  let AET: Edge[] = [];
  const yStart = Math.min(...vertices.map(v => v.y));
  const yEnd = Math.max(...vertices.map(v => v.y));

  // 3. 处理每条扫描线
  for (let y = yStart; y <= yEnd; y++) {
    // 4. 合并新边到AET
    if (ET.has(y)) {
      AET.push(...ET.get(y)!);
    }

    // 5. 删除已完成边
    AET = AET.filter(edge => edge.yMax > y);

    // 6. 按当前x排序
    AET.sort((a, b) => a.x - b.x);

    // 7. 填充交点对
    for (let i = 0; i < AET.length; i += 2) {
      const xStart = Math.ceil(AET[i].x);
      const xEnd = Math.floor(AET[i + 1].x);

      for (let x = xStart; x <= xEnd; x++) {
        setPixel(x, y);
      }
    }

    // 8. 更新边坐标
    AET.forEach(edge => {
      edge.x += edge.dx;
    });
  }
};
export const polygonScanFillAntialias = (
  polygon: number[][],
  setPixel: (x: number, y: number, coverage: number) => void
) => {
  type Edge = {
    yStart: number;
    yEnd: number;
    x: number; // 当前 x 交点（浮点）
    dx: number; // X 递增量
    normal: [number, number]; // 单位法向量
  };

  let edges: Edge[] = [];
  
  // **构建边表**
  for (let i = 0; i < polygon.length; i++) {
    const v1 = polygon[i];
    const v2 = polygon[(i + 1) % polygon.length];

    // **跳过水平边**
    if (v1[1] === v2[1]) continue;

    const dy = v2[1] - v1[1];
    const dx = (v2[0] - v1[0]) / dy;
    const edgeLength = Math.hypot(v2[0] - v1[0], v2[1] - v1[1]);
    const normal: [number, number] = [
      -(v2[1] - v1[1]) / edgeLength, // nx
      (v2[0] - v1[0]) / edgeLength // ny
    ];

    edges.push({
      yStart: Math.min(v1[1], v2[1]),
      yEnd: Math.max(v1[1], v2[1]),
      x: v1[1] < v2[1] ? v1[0] : v2[0],
      dx,
      normal
    });
  }

  // **扫描边界**
  const yMin = Math.floor(Math.min(...polygon.map(v => v[1])));
  const yMax = Math.ceil(Math.max(...polygon.map(v => v[1])));

  // **计算像素覆盖率**
  const geometricCoverage = (x: number, x1: number, x2: number): number => {
    return Math.max(0, Math.min(1, (Math.min(x + 0.5, x2) - Math.max(x - 0.5, x1))));
  };

  // **边缘增强处理**
  const edgeEnhancement = (
    x: number,
    y: number,
    left: { x: number; normal: [number, number] },
    right: { x: number; normal: [number, number] }
  ): number => {
    const centerX = x + 0.5;
    const distLeft = Math.abs((centerX - left.x) * left.normal[0]);
    const distRight = Math.abs((centerX - right.x) * right.normal[0]);
    return Math.min(1, Math.max(0, (Math.min(distLeft, distRight) * 2)));
  };

  let activeEdges: Edge[] = [];

  // **扫描填充**
  for (let y = yMin; y <= yMax; y++) {
    // **更新活动边表**
    activeEdges = activeEdges.filter(e => e.yEnd > y);

    edges.forEach(e => {
      if (e.yStart === y) activeEdges.push(e);
    });

    // **计算精确交点**
    const intersections = activeEdges
      .map(e => ({
        x: e.x,
        normal: e.normal
      }))
      .sort((a, b) => a.x - b.x);

    for (let i = 0; i < intersections.length; i += 2) {
      const left = intersections[i];
      const right = intersections[i + 1];
      if (!right) break;

      const startX = Math.floor(left.x);
      const endX = Math.ceil(right.x);

      for (let x = startX; x <= endX; x++) {
        const coverage = geometricCoverage(x, left.x, right.x);
        const edgeFactor = edgeEnhancement(x, y, left, right);
        setPixel(x, y, Math.min(1, coverage * edgeFactor));
      }
    }

    // **更新边交点**
    activeEdges.forEach(e => e.x += e.dx);
  }
};


// 多边形闭合处理
const closePolygon = (polygon: number[][]): number[][] => {
  if (polygon[0][0] === polygon[polygon.length - 1][0] &&
    polygon[0][1] === polygon[polygon.length - 1][1]) {
    return polygon;
  }
  return [...polygon, [polygon[0][0], polygon[0][1]]];
};

// 有效性验证
const isValidPolygon = (polygon: number[][]): boolean => {
  const closed = closePolygon(polygon);
  if (closed.length < 4) return false; // 3个顶点+闭合点

  // 检查面积是否非零
  let area = 0;
  for (let i = 0; i < closed.length - 1; i++) {
    const [x1, y1] = closed[i];
    const [x2, y2] = closed[i + 1];
    area += (x1 * y2) - (x2 * y1);
  }
  return Math.abs(area) > 1e-6;
};

// 顶点清洗
const cleanVertices = (polygon: number[][]): number[][] => {
  const cleaned: number[][] = [];
  const seen = new Set<string>();

  polygon.forEach(([x, y]) => {
    const key = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (!seen.has(key)) {
      cleaned.push([x, y]);
      seen.add(key);
    }
  });

  // 确保闭合
  if (cleaned.length > 0 &&
    (cleaned[0][0] !== cleaned[cleaned.length - 1][0] ||
      cleaned[0][1] !== cleaned[cleaned.length - 1][1])) {
    cleaned.push([cleaned[0][0], cleaned[0][1]]);
  }

  return cleaned;
};
export const polygonScanFillDeepseek = (polygon: number[][], setPixel: (x: number, y: number) => void) => {
  const n = polygon.length;
  if (n < 3) return; // 无法构成多边形

  let yMin = Infinity;
  let yMax = -Infinity;
  const ET: { yMax: number; x: number; slope: number }[][] = [];

  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];
    const x1 = p1[0], y1 = p1[1];
    const x2 = p2[0], y2 = p2[1];

    if (y1 === y2) continue; // 跳过水平边

    // 确定边的方向，使得较低的y作为起点
    let yStart: number, yEndOriginal: number, xStart: number, xEnd: number;
    let higherPointIndex: number;
    if (y1 < y2) {
      yStart = y1;
      yEndOriginal = y2;
      xStart = x1;
      xEnd = x2;
      higherPointIndex = (i + 1) % n; // p2的索引
    } else {
      yStart = y2;
      yEndOriginal = y1;
      xStart = x2;
      xEnd = x1;
      higherPointIndex = i; // p1的索引
    }

    // 判断较高点是否是局部极大值
    const prevIndex = higherPointIndex === 0 ? n - 1 : higherPointIndex - 1;
    const nextIndex = (higherPointIndex + 1) % n;
    const prevY = polygon[prevIndex][1];
    const currentY = polygon[higherPointIndex][1];
    const nextY = polygon[nextIndex][1];

    const isLocalMax = prevY < currentY && nextY < currentY;
    const yEnd = isLocalMax ? yEndOriginal - 1 : yEndOriginal;

    const dyOriginal = yEndOriginal - yStart;
    const dx = xEnd - xStart;
    const slope = dyOriginal === 0 ? 0 : dx / dyOriginal;

    if (!ET[yStart]) {
      ET[yStart] = [];
    }
    ET[yStart].push({
      yMax: yEnd,
      x: xStart,
      slope: slope,
    });

    yMin = Math.min(yMin, yStart);
    yMax = Math.max(yMax, yEnd);
  }

  if (yMin > yMax) return;

  let AET: { yMax: number; x: number; slope: number }[] = [];

  for (let y = yMin; y <= yMax; y++) {
    // 添加新的边到AET
    if (ET[y]) {
      AET.push(...ET[y]);
    }

    // 过滤掉y超过yMax的边
    AET = AET.filter(edge => edge.yMax >= y);

    // 按x和slope排序
    AET.sort((a, b) => a.x - b.x || a.slope - b.slope);

    // 填充交点之间的像素
    for (let i = 0; i < AET.length; i += 2) {
      const edge1 = AET[i];
      const edge2 = AET[i + 1];
      if (!edge2) break;

      const xStart = Math.ceil(edge1.x);
      const xEnd = Math.floor(edge2.x);
      for (let x = xStart; x <= xEnd; x++) {
        setPixel(x, y);
      }
    }

    // 更新边的x值
    AET.forEach(edge => {
      edge.x += edge.slope;
    });
  }
};


// export const polygonScanFill = (polygon: number[][],fillRule:"evenodd" | "nonzero", setPixel: (x: number, y: number) => void) => {


// }

// export const polygonScanFillAntialias = (polygon: number[][],fillRule:"evenodd" | "nonzero", setPixel: (x: number, y: number, coverageRate: number) => void) => {


// }


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

/**
 * 不抗锯齿的多边形扫描填充：
 * 遍历多边形外包矩形，对每个像素取中心点检测是否在多边形内，
 * 如果在内部则调用 setPixel。
 */
export const polygonScanFill2 = (
  polygon: number[][],
  fillRule: "evenodd" | "nonzero",
  setPixel: (x: number, y: number) => void
) => {
  // 计算多边形的外包矩形
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  minX = Math.floor(minX);
  minY = Math.floor(minY);
  maxX = Math.ceil(maxX);
  maxY = Math.ceil(maxY);

  // 对每个像素中心点检测
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      if (pointInPolygon(x + 0.5, y + 0.5, polygon, fillRule)) {
        setPixel(x, y);
      }
    }
  }
};

/**
 * 抗锯齿版本的多边形扫描填充：
 * 对每个像素采用多重采样（例如 4x4），计算子像素中落入多边形内部的比例，
 * 并调用 setPixel 返回覆盖率（0到1之间）。
 */
export const polygonScanFillAntialias2 = (
  polygon: number[][],
  fillRule: "evenodd" | "nonzero",
  setPixel: (x: number, y: number, coverageRate: number) => void
) => {
  // 计算外包矩形
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of polygon) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  minX = Math.floor(minX);
  minY = Math.floor(minY);
  maxX = Math.ceil(maxX);
  maxY = Math.ceil(maxY);

  const samples = 4; // 4x4 采样
  const totalSamples = samples * samples;

  // 对每个像素进行子像素采样
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      let count = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          // 子像素中心位置
          const sampleX = x + (sx + 0.5) / samples;
          const sampleY = y + (sy + 0.5) / samples;
          if (pointInPolygon(sampleX, sampleY, polygon, fillRule)) {
            count++;
          }
        }
      }
      const coverage = count / totalSamples;
      if (coverage > 0) {
        setPixel(x, y, coverage);
      }
    }
  }
};


export const polygonScanFill3 = (
  polygon: number[][],
  fillRule: "evenodd" | "nonzero",
  setPixel: (x: number, y: number) => void
) => {
  interface Edge {
    yMax: number;      // 边的最大 y 值（不含）
    x: number;         // 当前扫描线与边的交点 x 值（初始值为 yMin 时对应的 x）
    invSlope: number;  // 倒数斜率
    winding: number;   // 对于 nonzero 填充，记录边的方向（上升边为 +1，下降边为 -1）
    yMin: number;      // 边的最小 y 值
  }

  // 构造边表（跳过水平边）
  const edges: Edge[] = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % n];
    if (y0 === y1) continue; // 忽略水平边
    const yMin = Math.min(y0, y1);
    const yMax = Math.max(y0, y1);
    // 以较低的 y 值作为起点
    const xAtYMin = y0 < y1 ? x0 : x1;
    const invSlope = (x1 - x0) / (y1 - y0);
    const winding = y0 < y1 ? 1 : -1;
    edges.push({ yMax, x: xAtYMin, invSlope, winding, yMin });
  }
  // 按边起始 y 值排序
  edges.sort((a, b) => a.yMin - b.yMin);

  // 计算扫描范围（按像素行处理，使用像素中心 y+0.5）
  const minY = Math.floor(Math.min(...polygon.map(p => p[1])));
  const maxY = Math.ceil(Math.max(...polygon.map(p => p[1])));

  let activeEdges: Edge[] = [];
  let edgeIndex = 0;

  // 按扫描行处理
  for (let y = minY; y < maxY; y++) {
    const scanY = y + 0.5;

    // 将起始 y 小于等于 scanY 的边加入 AET
    while (edgeIndex < edges.length && edges[edgeIndex].yMin <= scanY) {
      activeEdges.push(edges[edgeIndex]);
      edgeIndex++;
    }
    // 删除已越过扫描线的边（scanY >= yMax）
    activeEdges = activeEdges.filter(edge => scanY < edge.yMax);

    // 对当前扫描线上的每条边计算交点，并按 x 排序
    activeEdges.sort((a, b) => a.x - b.x);

    if (fillRule === "evenodd") {
      // 奇偶规则：两两配对填充
      for (let i = 0; i < activeEdges.length; i += 2) {
        const xStart = activeEdges[i].x;
        const xEnd = activeEdges[i + 1].x;
        // 根据像素中心判断：像素中心在 [xStart, xEnd] 内则填充
        const startX = Math.ceil(xStart - 0.5);
        const endX = Math.floor(xEnd - 0.5);
        for (let x = startX; x <= endX; x++) {
          setPixel(x, y);
        }
      }
    } else {
      // nonzero 规则：根据边的绕数变化来确定内部区域
      // 取所有交点及其 winding 信息
      const intersections = activeEdges.map(edge => ({ x: edge.x, winding: edge.winding }));
      intersections.sort((a, b) => a.x - b.x);
      let winding = 0;
      let segStart: number | null = null;
      for (let i = 0; i < intersections.length; i++) {
        const inter = intersections[i];
        const xPos = inter.x;
        if (winding !== 0 && segStart !== null) {
          // 当前段 [segStart, xPos] 属于填充区域
          const startX = Math.ceil(segStart - 0.5);
          const endX = Math.floor(xPos - 0.5);
          for (let x = startX; x <= endX; x++) {
            setPixel(x, y);
          }
        }
        winding += inter.winding;
        segStart = xPos;
      }
    }
    // 对每条边更新交点：下一扫描线时 x 增加 invSlope（扫描线间隔为 1）
    for (const edge of activeEdges) {
      edge.x += edge.invSlope;
    }
  }
};
export const polygonScanFillAntialias3 = (
  polygon: number[][],
  fillRule: "evenodd" | "nonzero",
  setPixel: (x: number, y: number, coverageRate: number) => void
) => {
  interface Edge {
    yMax: number;
    x: number;
    invSlope: number;
    winding: number;
    yMin: number;
  }

  const edges: Edge[] = [];
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % n];
    if (y0 === y1) continue;
    const yMin = Math.min(y0, y1);
    const yMax = Math.max(y0, y1);
    const xAtYMin = y0 < y1 ? x0 : x1;
    const invSlope = (x1 - x0) / (y1 - y0);
    const winding = y0 < y1 ? 1 : -1;
    edges.push({ yMax, x: xAtYMin, invSlope, winding, yMin });
  }
  edges.sort((a, b) => a.yMin - b.yMin);

  const minY = Math.floor(Math.min(...polygon.map(p => p[1])));
  const maxY = Math.ceil(Math.max(...polygon.map(p => p[1])));

  let activeEdges: Edge[] = [];
  let edgeIndex = 0;

  // 遍历每条扫描线（像素行）
  for (let y = minY; y < maxY; y++) {
    const scanY = y + 0.5;
    while (edgeIndex < edges.length && edges[edgeIndex].yMin <= scanY) {
      activeEdges.push(edges[edgeIndex]);
      edgeIndex++;
    }
    activeEdges = activeEdges.filter(edge => scanY < edge.yMax);
    activeEdges.sort((a, b) => a.x - b.x);

    if (fillRule === "evenodd") {

      // 对于偶奇规则，每两个交点构成一个填充段
      for (let i = 0; i < activeEdges.length; i += 2) {
        const segStart = activeEdges[i].x;
        const segEnd = activeEdges[i + 1].x;
        // 对于当前扫描线，遍历可能受影响的像素（像素区域为 [x-0.5, x+0.5]）
        const startPixel = Math.floor(segStart + 0.5);
        const endPixel = Math.floor(segEnd + 0.5);
        for (let x = startPixel; x <= endPixel; x++) {
          const pixelLeft = x - 0.5;
          const pixelRight = x + 0.5;
          // 计算该像素区域与填充段 [segStart, segEnd] 的交集长度
          const intersect = Math.max(0, Math.min(pixelRight, segEnd) - Math.max(pixelLeft, segStart));
          if (intersect > 0) {
            // intersect 的值即为覆盖率（0～1）
            setPixel(x, y, intersect);
          }
        }
      }
    } else {
      // nonzero 规则：先计算所有交点及其 winding 信息，然后扫描获得填充段
      const intersections = activeEdges.map(edge => ({ x: edge.x, winding: edge.winding }));
      intersections.sort((a, b) => a.x - b.x);
      let winding = 0;
      let segStart: number | null = null;
      const segments: { start: number; end: number }[] = [];
      for (const inter of intersections) {
        if (winding !== 0 && segStart !== null) {
          segments.push({ start: segStart, end: inter.x });
        }
        winding += inter.winding;
        segStart = inter.x;
      }
      for (const seg of segments) {
        const startPixel = Math.floor(seg.start + 0.5);
        const endPixel = Math.floor(seg.end + 0.5);
        for (let x = startPixel; x <= endPixel; x++) {
          const pixelLeft = x - 0.5;
          const pixelRight = x + 0.5;
          const intersect = Math.max(0, Math.min(pixelRight, seg.end) - Math.max(pixelLeft, seg.start));
          if (intersect > 0) {
            setPixel(x, y, intersect);
          }
        }
      }
    }
    // 更新每条边的交点 x 值（扫描线间隔为 1）
    for (const edge of activeEdges) {
      edge.x += edge.invSlope;
    }
  }
};
export const polygonScanFill4 = (
  polygon: number[][],
  fillRule: "evenodd" | "nonzero",
  setPixel: (x: number, y: number) => void
) => {
  const ET: { [key: number]: any[] } = {};
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % n];

    if (y0 === y1) continue; // 跳过水平边

    const [yStart, yEnd, xStart] = y0 < y1 ? [y0, y1, x0] : [y1, y0, x1];
    const dxPerDy = (x1 - x0) / (y1 - y0); // 斜率倒数

    const edge = { yEnd, x: xStart, dxPerDy };
    if (!ET[yStart]) ET[yStart] = [];
    ET[yStart].push(edge);
  }

  let aet: any[] = [];
  const yMin = Math.min(...polygon.map(d=>d[1]));
  const yMax = Math.max(...polygon.map(d=>d[1]));


  for (let y = yMin; y <= yMax; y++) {
    // 添加新边
    if (ET[y]) aet.push(...ET[y]);

    // 移除无效边
    aet = aet.filter(edge => edge.yEnd > y);

    // 交点排序
    aet.sort((a, b) => a.x - b.x);

    const spans: { start: number; end: number }[] = [];
    if (fillRule === "evenodd") {
      for (let i = 0; i < aet.length; i += 2) {
        if (i + 1 < aet.length) {
          spans.push({ start: aet[i].x, end: aet[i + 1].x });
        }
      }
    } else {
      let winding = 0, startX: number | null = null;
      for (const { x } of aet) {
        winding += 1;
        if (winding % 2 === 1) startX = x;
        else if (startX !== null) {
          spans.push({ start: startX, end: x });
          startX = null;
        }
      }
    }

    // 填充像素
    for (const { start, end } of spans) {
      for (let x = Math.ceil(start); x < end; x++) {
        setPixel(x, y);
      }
    }

    // 更新 AET
    for (const edge of aet) {
      edge.x += edge.dxPerDy;
    }
  }
};
export const polygonScanFillAntialias4 = (
  polygon: number[][],
  fillRule: "evenodd" | "nonzero",
  setPixel: (x: number, y: number, coverageRate: number) => void
) => {
  const ET: { [key: number]: any[] } = {};
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const [x0, y0] = polygon[i];
    const [x1, y1] = polygon[(i + 1) % n];

    if (y0 === y1) continue;

    const [yStart, yEnd, xStart] = y0 < y1 ? [y0, y1, x0] : [y1, y0, x1];
    const dxPerDy = (x1 - x0) / (y1 - y0);

    const edge = { yEnd, x: xStart, dxPerDy };
    if (!ET[yStart]) ET[yStart] = [];
    ET[yStart].push(edge);
  }

  let aet: any[] = [];
  const yMin = Math.min(...polygon.map(d=>d[1]));
  const yMax = Math.max(...polygon.map(d=>d[1]));

  for (let y = yMin; y <= yMax; y++) {
    if (ET[y]) aet.push(...ET[y]);

    aet = aet.filter(edge => edge.yEnd > y);
    aet.sort((a, b) => a.x - b.x);

    const spans: { start: number; end: number }[] = [];
    if (fillRule === "evenodd") {
      for (let i = 0; i < aet.length; i += 2) {
        if (i + 1 < aet.length) {
          spans.push({ start: aet[i].x, end: aet[i + 1].x });
        }
      }
    } else {
      let winding = 0, startX: number | null = null;
      for (const { x } of aet) {
        winding += 1;
        if (winding % 2 === 1) startX = x;
        else if (startX !== null) {
          spans.push({ start: startX, end: x });
          startX = null;
        }
      }
    }

    for (const { start, end } of spans) {
      const firstX = Math.floor(start);
      const lastX = Math.floor(end - 1e-6);

      for (let x = firstX; x <= lastX; x++) {
        const pixelLeft = x;
        const pixelRight = x + 1;
        const coverStart = Math.max(start, pixelLeft);
        const coverEnd = Math.min(end, pixelRight);
        const coverage = coverEnd - coverStart;

        if (coverage > 0) {
          setPixel(x, y, coverage);
        }
      }
    }

    for (const edge of aet) {
      edge.x += edge.dxPerDy;
    }
  }
};
