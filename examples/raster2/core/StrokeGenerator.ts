// core/StrokeGenerator.ts
import { LineSegment } from './BezierFlattener.ts';
import { Vec2 } from './Path2DImpl.ts';

export type StrokeStyle = {
  lineWidth: number;
  lineJoin: 'miter' | 'bevel' | 'round';
  lineCap: 'butt' | 'round' | 'square';
  miterLimit: number;
};

export type Polygon = Vec2[];

function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
}

function perp(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function miterJoin(p: Vec2, n1: Vec2, n2: Vec2, halfWidth: number, miterLimit: number): Vec2 | null {
  const tangent = normalize(add(n1, n2));
  const length = halfWidth / Math.max(0.0001, tangent.x * perp(n1).x + tangent.y * perp(n1).y);

  if (Math.abs(length) > miterLimit) return null;
  return add(p, scale(tangent, length));
}

export class StrokeGenerator {
  style: StrokeStyle;

  constructor(style: StrokeStyle) {
    this.style = style;
  }

  generate(segments: LineSegment[], isClosed = false): Polygon[] {
    const polygons: Polygon[] = [];
    const halfW = this.style.lineWidth / 2;

    let currentPath: Polygon = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const prev = segments[i - 1];
      const next = segments[i + 1];

      const dir = normalize(sub(seg.p2, seg.p1));
      const normal = scale(perp(dir), halfW);

      // Start cap or join
      if (!prev) {
        if (this.style.lineCap === 'butt') {
          currentPath.push(add(seg.p1, normal), sub(seg.p1, normal));
        } else if (this.style.lineCap === 'square') {
          const capDir = scale(dir, -halfW);
          currentPath.push(add(add(seg.p1, capDir), normal), add(add(seg.p1, capDir), scale(normal, -1)));
        } else if (this.style.lineCap === 'round') {
          const arc = this.roundCap(seg.p1, normal, true);
          currentPath.push(...arc);
        }
      } else {
        // Join
        const v1 = normalize(sub(seg.p1, prev.p1));
        const v2 = dir;
        const n1 = scale(perp(v1), halfW);
        const n2 = scale(perp(v2), halfW);

        const joinPoint = miterJoin(seg.p1, n1, n2, halfW, this.style.miterLimit);
        if (this.style.lineJoin === 'miter' && joinPoint) {
          currentPath.push(joinPoint);
        } else if (this.style.lineJoin === 'bevel' || !joinPoint) {
          currentPath.push(add(seg.p1, n1), add(seg.p1, n2));
        } else if (this.style.lineJoin === 'round') {
          const arc = this.roundJoin(seg.p1, n1, n2);
          currentPath.push(...arc);
        }
      }

      // End cap or join
      if (!next) {
        if (this.style.lineCap === 'butt') {
          currentPath.push(sub(seg.p2, normal), add(seg.p2, normal));
        } else if (this.style.lineCap === 'square') {
          const capDir = scale(dir, halfW);
          currentPath.push(add(add(seg.p2, capDir), scale(normal, -1)), add(add(seg.p2, capDir), normal));
        } else if (this.style.lineCap === 'round') {
          const arc = this.roundCap(seg.p2, normal, false);
          currentPath.push(...arc);
        }

        // 封闭一个完整路径
        polygons.push(currentPath);
        currentPath = [];
      }
    }

    return polygons;
  }

  roundCap(center: Vec2, normal: Vec2, start: boolean): Vec2[] {
    const steps = 8;
    const angleStart = start ? Math.PI : 0;
    const angleEnd = start ? 2 * Math.PI : Math.PI;
    const radius = Math.hypot(normal.x, normal.y);
    const pts: Vec2[] = [];

    for (let i = 0; i <= steps; i++) {
      const a = angleStart + (i / steps) * (angleEnd - angleStart);
      pts.push({
        x: center.x + Math.cos(a) * radius,
        y: center.y + Math.sin(a) * radius,
      });
    }

    return pts;
  }

  roundJoin(center: Vec2, from: Vec2, to: Vec2): Vec2[] {
    const angleFrom = Math.atan2(from.y, from.x);
    const angleTo = Math.atan2(to.y, to.x);
    const delta = angleTo - angleFrom;

    const steps = Math.ceil(Math.abs(delta) / (Math.PI / 8));
    const pts: Vec2[] = [];

    for (let i = 0; i <= steps; i++) {
      const a = angleFrom + (delta * (i / steps));
      pts.push({
        x: center.x + Math.cos(a) * Math.hypot(from.x, from.y),
        y: center.y + Math.sin(a) * Math.hypot(from.x, from.y),
      });
    }

    return pts;
  }
}
