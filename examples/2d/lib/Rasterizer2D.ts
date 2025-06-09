// 2D Vector Rasterizer with Subpixel Antialiasing in TypeScript

import { PathBuilder,Point ,PixelImage} from "math/2d_raster/soft2d";

// Fixed-point config (8x8 subpixel grid)
const FP_SHIFT = 3;
const FP_SCALE = 1 << FP_SHIFT;
const FP_MASK = FP_SCALE - 1;

function floatToFixed(x: number): number {
  return Math.round(x * FP_SCALE);
}

function fixedToFloat(x: number): number {
  return x / FP_SCALE;
}

interface Edge {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  winding: number;
}

interface Cell {
  x: number;
  y: number;
  area: number;
  cover: number;
}

export function buildEdges(path:PathBuilder): Edge[] {
  const edges: Edge[] = [];
  let lastPoint=Point.default()
  const addEdge=(p0:Point,p1:Point)=>{
  //  if(p0.y===p1.y) return;
    edges.push({
        x0:p0.x,
        y0:p0.y,
        x1:p1.x,
        y1:p1.y,
        winding:1// p0.y<p1.y?1:-1
    })
  }
  path.visit({
     moveTo:(d)=>{
        lastPoint.copy(d.p0)
     },
     lineTo:(d)=>{
        addEdge(lastPoint,d.p0)
        lastPoint.copy(d.p0)
     },
     closePath:(d)=>{
        addEdge(lastPoint,d.lastMovePoint)
     }
  })

  return edges;
}

function rasterizeEdge(edge: Edge, addCell: (x: number, y: number, area: number, cover: number) => void) {
  let { x0, y0, x1, y1, winding } = edge;

  if (y0 === y1) return; // skip horizontal
  if (y0 > y1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
    winding = -winding;
  }

  const fx0 = floatToFixed(x0);
  const fy0 = floatToFixed(y0);
  const fx1 = floatToFixed(x1);
  const fy1 = floatToFixed(y1);
  const dx = fx1 - fx0;
  const dy = fy1 - fy0;
  const slope = dx / dy;

  const yStart = fy0 >> FP_SHIFT;
  const yEnd = fy1 >> FP_SHIFT;

  for (let y = yStart; y <= yEnd; y++) {
    const yTop = Math.max(y << FP_SHIFT, fy0);
    const yBot = Math.min((y + 1) << FP_SHIFT, fy1);
    const h = yBot - yTop;

    const xTop = fx0 + Math.round(slope * (yTop - fy0));
    const xBot = fx0 + Math.round(slope * (yBot - fy0));

    const area = (xTop + xBot) * h >> 1;
    const cover = (xBot - xTop);

    addCell(xTop >> FP_SHIFT, y, area * winding, cover * winding);
  }
}

function toAlpha(area: number): number {
  const a = Math.abs(area);
  return Math.min(255, Math.floor(a * 255 / (FP_SCALE * FP_SCALE)));
}

export function rasterizePath(path:PathBuilder,bitmap:PixelImage, fillRule: 'nonzero' | 'evenodd') {
  const cellMap = new Map<string, Cell>();

  const edges=buildEdges(path)
  function addCell(x: number, y: number, area: number, cover: number) {
    const key = `${x},${y}`;
    const cell = cellMap.get(key) ?? { x, y, area: 0, cover: 0 };
    cell.area += area;
    cell.cover += cover;
    cellMap.set(key, cell);
  }

  for (const edge of edges) {
    rasterizeEdge(edge, addCell);
  }

  for (const cell of cellMap.values()) {
    let alpha = 0;
    if (fillRule === 'nonzero') {
      alpha = toAlpha(cell.area);
    } else {
      const cov = (cell.cover >> (FP_SHIFT * 2 - 1)) & 1; // approximate even/odd using high bits
      alpha = cov ? 255 : 0;
    }
    bitmap.setPixel(cell.y,cell.x,255,0,0,alpha)
 
  }
}

