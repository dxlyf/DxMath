// core/BezierFlattener.ts
import { Path2DImpl, PathCommand, Vec2 } from './Path2DImpl.ts';

export type LineSegment = { p1: Vec2; p2: Vec2 };

// 简单的距离平方函数
function dist2(p1: Vec2, p2: Vec2): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return dx * dx + dy * dy;
}

// 贝塞尔曲线细分（自适应，递归）
function flattenBezier(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2,
  tolerance: number,
  result: LineSegment[]
) {
  // 判断是否为直线
  const dx = p3.x - p0.x;
  const dy = p3.y - p0.y;
  const d2 = Math.abs((p1.x - p3.x) * dy - (p1.y - p3.y) * dx);
  const d3 = Math.abs((p2.x - p3.x) * dy - (p2.y - p3.y) * dx);

  if ((d2 + d3) * (d2 + d3) < tolerance * dist2(p0, p3)) {
    result.push({ p1: p0, p2: p3 });
    return;
  }

  // 细分
  const p01 = midpoint(p0, p1);
  const p12 = midpoint(p1, p2);
  const p23 = midpoint(p2, p3);

  const p012 = midpoint(p01, p12);
  const p123 = midpoint(p12, p23);

  const p0123 = midpoint(p012, p123);

  flattenBezier(p0, p01, p012, p0123, tolerance, result);
  flattenBezier(p0123, p123, p23, p3, tolerance, result);
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export class BezierFlattener {
  tolerance: number;

  constructor(tolerance = 0.5) {
    this.tolerance = tolerance;
  }

  // 将 Path2DImpl 转换为线段数组
  flatten(path: Path2DImpl): LineSegment[] {
    const segments: LineSegment[] = [];
    let currentPoint: Vec2 | null = null;
    let startPoint: Vec2 | null = null;

    for (const cmd of path.commands) {
      if (cmd.type === 'moveTo') {
        currentPoint = { ...cmd.to };
        startPoint = { ...cmd.to };
      } else if (cmd.type === 'lineTo') {
        if (currentPoint) {
          segments.push({ p1: currentPoint, p2: cmd.to });
          currentPoint = { ...cmd.to };
        }
      } else if (cmd.type === 'bezierTo') {
        if (currentPoint) {
          flattenBezier(currentPoint, cmd.cp1, cmd.cp2, cmd.to, this.tolerance, segments);
          currentPoint = { ...cmd.to };
        }
      } else if (cmd.type === 'closePath') {
        if (currentPoint && startPoint) {
          segments.push({ p1: currentPoint, p2: startPoint });
          currentPoint = startPoint;
        }
      }
    }

    return segments;
  }
}
