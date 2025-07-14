// Polygon.ts

// Helper type definitions
interface Point {
    x: number;
    y: number;
  }
  
  type Contour = Point[];
  type Polygon = Contour[];
  
  interface BoundingBox {
    min: Point;
    max: Point;
  }
  
  interface RenderEdge {
    p0: Point;
    p1: Point;
    x: number; // intersection x
  }
  
  function DrawPixel(x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
    // stub implementation
  }
  
  const CoverageTable: BigUint64Array[] = Array.from({ length: 64 }, () => new BigUint64Array(64));
    let CoverageTableInitialized = false;
  
    function SetPixelInBitset(bitset: bigint, x: number, y: number): bigint {
      const bit = BigInt(y * 8 + x);
      return bitset | (1n << bit);
    }
  
    function GetPixelInBitset(bitset: bigint, x: number, y: number): boolean {
      const bit = BigInt(y * 8 + x);
      return (bitset & (1n << bit)) !== 0n;
    }
  
    function InitCoverageTable(): void {
      if (CoverageTableInitialized) return;
      CoverageTableInitialized = true;
  
      for (let outer = 0; outer < 64; ++outer) {
        for (let inner = 0; inner < 64; ++inner) {
          const x0 = outer % 8;
          const y0 = Math.floor(outer / 8);
          const x1 = inner % 8;
          const y1 = Math.floor(inner / 8);
  
          const dx = Math.abs(x1 - x0);
          const dy = Math.abs(y1 - y0);
          const xStep = x0 < x1 ? 1 : -1;
          const yStep = y0 < y1 ? 1 : -1;
          let error = 0;
  
          if (dx > dy) {
            const m = 2 * dy;
            const scale = 2 * dx;
            let y = y0;
            for (let x = x0; x !== x1 + xStep; x += xStep) {
             CoverageTable[outer][inner] = SetPixelInBitset(CoverageTable[outer][inner], x, y);
              error += m;
              if (error >= dx) {
                y += yStep;
                error -= scale;
              }
            }
          } else {
            const m = 2 * dx;
            const scale = 2 * dy;
            let x = x0;
            for (let y = y0; y !== y1 + yStep; y += yStep) {
             CoverageTable[outer][inner] = SetPixelInBitset(CoverageTable[outer][inner], x, y);
              error += m;
              if (error >= dy) {
                x += xStep;
                error -= scale;
              }
            }
          }
        }
      }
  
      // Flood fill right
      for (let outer = 0; outer < 64; ++outer) {
        for (let inner = 0; inner < 64; ++inner) {
          for (let y = 0; y < 8; ++y) {
            let fill = false;
            for (let x = 0; x < 8; ++x) {
              if (fill) {
                CoverageTable[outer][inner] = SetPixelInBitset( CoverageTable[outer][inner], x, y);
              }
              if (GetPixelInBitset(CoverageTable[outer][inner], x, y)) {
                fill = true;
              }
            }
          }
        }
      }
    }
  
    function GetBoundingBox(poly: Polygon): BoundingBox {
      let result: BoundingBox = {
        min: { x: 0, y: 0 },
        max: { x: 0, y: 0 }
      };
      if (poly.length > 0 && poly[0].length > 0) {
        result.min = { ...poly[0][0] };
        result.max = { ...poly[0][0] };
      }
  
      for (const contour of poly) {
        for (const point of contour) {
          result.min.x = Math.min(result.min.x, point.x);
          result.min.y = Math.min(result.min.y, point.y);
          result.max.x = Math.max(result.max.x, point.x);
          result.max.y = Math.max(result.max.y, point.y);
        }
      }
  
      return result;
    }
  
    function PointInPolygon(point: Point, poly: Polygon): boolean {
      const bbox = GetBoundingBox(poly);
      if (point.x < bbox.min.x || point.x > bbox.max.x || point.y < bbox.min.y || point.y > bbox.max.y) return false;
  
      let winding = 0;
      for (const contour of poly) {
        for (let i = 0; i < contour.length; ++i) {
          const p = contour[i];
          const n = contour[(i + 1) % contour.length];
  
          const toStart = { x: p.x - point.x, y: p.y - point.y };
          const toEnd = { x: n.x - point.x, y: n.y - point.y };
          const crossZ = toStart.x * toEnd.y - toStart.y * toEnd.x;
  
          if (p.y <= point.y && n.y > point.y && crossZ > 0) {
            winding--;
          } else if (n.y <= point.y && p.y > point.y && crossZ < 0) {
            winding++;
          }
        }
      }
  
      return winding !== 0;
    }
  

  function ClipPolygon(poly: Polygon, box: BoundingBox): Polygon {
    const numContours = poly.length;
    const bufferA: Polygon = Array.from({ length: numContours }, () => []);
    const bufferB: Polygon = Array.from({ length: numContours }, () => []);
  
    function clip(
      input: Polygon,
      output: Polygon,
      axis: 'x' | 'y',
      limit: number,
      keepGreater: boolean
    ) {
      for (let contour = 0; contour < input.length; ++contour) {
        const src = input[contour];
        const dst = output[contour];
        dst.length = 0;
        const n = src.length;
        for (let i = 0; i < n; ++i) {
          const curr = src[i];
          const next = src[(i + 1) % n];
          const currInside = keepGreater ? curr[axis] >= limit : curr[axis] <= limit;
          const nextInside = keepGreater ? next[axis] >= limit : next[axis] <= limit;
  
          if (currInside) dst.push(curr);
  
          if (currInside !== nextInside) {
            const t = (limit - curr[axis]) / (next[axis] - curr[axis]);
            const x = curr.x + (next.x - curr.x) * t;
            const y = curr.y + (next.y - curr.y) * t;
            dst.push({ x, y });
          }
        }
      }
    }
  
    clip(poly, bufferA, 'x', box.min.x, true);     // left
    clip(bufferA, bufferB, 'x', box.max.x, false); // right
    clip(bufferB, bufferA, 'y', box.min.y, true);  // top
    clip(bufferA, bufferB, 'y', box.max.y, false); // bottom
  
    return bufferB.filter(contour => contour.length > 0);
  }
  
  function GetCoverage(poly: Polygon, point: Point): number {
    InitCoverageTable();
  
    const pixel: BoundingBox = {
      min: { x: Math.floor(point.x), y: Math.floor(point.y) },
      max: { x: Math.floor(point.x) + 1, y: Math.floor(point.y) + 1 },
    };
  
    const clipped = ClipPolygon(poly, pixel);
    let coverage = 0n;
  
    for (const contour of clipped) {
      const n = contour.length;
      for (let i = 0; i < n; ++i) {
        const p = contour[i];
        const q = contour[(i + 1) % n];
  
        const onEdgeX = Math.abs(pixel.max.x - p.x) < 1e-4 && Math.abs(pixel.max.x - q.x) < 1e-4;
        const onEdgeYTop = Math.abs(pixel.min.y - p.y) < 1e-4 && Math.abs(pixel.min.y - q.y) < 1e-4;
        const onEdgeYBot = Math.abs(pixel.max.y - p.y) < 1e-4 && Math.abs(pixel.max.y - q.y) < 1e-4;
  
        if (onEdgeX || onEdgeYTop || onEdgeYBot) continue;
  
        const p0x = (p.x - pixel.min.x) * 7;
        const p0y = (p.y - pixel.min.y) * 7;
        const p1x = (q.x - pixel.min.x) * 7;
        const p1y = (q.y - pixel.min.y) * 7;
  
        const i0 = Math.floor(p0y) * 8 + Math.floor(p0x);
        const i1 = Math.floor(p1y) * 8 + Math.floor(p1x);
  
        coverage ^= CoverageTable[i0][i1];
      }
    }
  
    const bits = coverage.toString(2).split('').filter(b => b === '1').length;
    return Math.round((bits / 64) * 255);
  }
  
  function DrawPolygon(_x: number, _y: number, poly: Polygon, r: number, g: number, b: number): void {
    const bbox = GetBoundingBox(poly);
  
    const s_x = Math.floor(bbox.min.x + 0.5);
    const e_x = Math.floor(bbox.max.x + 0.5);
    const s_y = Math.floor(bbox.min.y + 0.5);
    const e_y = Math.floor(bbox.max.y + 0.5);
  
    for (let y = s_y; y <= e_y; ++y) {
      for (let x = s_x; x <= e_x; ++x) {
        const alpha = GetCoverage(poly, { x: x + 0.5, y: y + 0.5 });
        if (alpha > 0) {
          DrawPixel(_x + x, _y + y, r, g, b, alpha);
        }
      }
    }
  }
  