/**
 * 判断点 (x, y) 是否在圆内（包括圆周）
 * @param x - 点的 X 坐标
 * @param y - 点的 Y 坐标
 * @param h - 圆心的 X 坐标
 * @param k - 圆心的 Y 坐标
 * @param r - 圆的半径
 * @returns 点是否在圆内或圆周上
 */
export function isPointInCircle(
    x: number,
    y: number,
    h: number = 0,
    k: number = 0,
    r: number
  ): boolean {
    // 计算点与圆心的平方距离
    const dx = x - h;
    const dy = y - k;
    const squaredDistance = dx * dx + dy * dy;
    
    // 比较平方距离与半径平方（避免开平方运算）
    return squaredDistance <= r * r;
  }
  type EdgeMode = 'inner' | 'outer' | 'middle';

/**
 * 判断点是否在圆的边线范围内（支持线宽）
 * @param x 点的 X 坐标
 * @param y 点的 Y 坐标
 * @param h 圆心的 X 坐标（默认 0）
 * @param k 圆心的 Y 坐标（默认 0）
 * @param r 圆的半径
 * @param mode 边模式：'inner'（内边）、'outer'（外边）、'middle'（中线边，默认）
 * @param lineWidth 线宽（默认 0，表示无线宽）
 * @param epsilon 允许的误差范围（默认 0）
 * @returns 是否在指定边线范围内
 */
function isPointOnCircleEdge(
  x: number,
  y: number,
  h: number = 0,
  k: number = 0,
  r: number,
  mode: EdgeMode = 'middle',
  lineWidth: number = 0,
  epsilon: number = 0
): boolean {
  if (r < 0) throw new Error('Radius must be non-negative');
  if (lineWidth < 0) throw new Error('Line width must be non-negative');
  if (epsilon < 0) throw new Error('Epsilon must be non-negative');

  // 计算点与圆心的距离
  const dx = x - h;
  const dy = y - k;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // 根据线宽和模式计算有效半径范围
  const halfLineWidth = lineWidth / 2;
  let minRadius: number, maxRadius: number;

  switch (mode) {
    case 'inner':
      minRadius = r - halfLineWidth - epsilon;
      maxRadius = r - halfLineWidth + epsilon;
      break;
    case 'outer':
      minRadius = r + halfLineWidth - epsilon;
      maxRadius = r + halfLineWidth + epsilon;
      break;
    case 'middle':
      minRadius = r - epsilon;
      maxRadius = r + epsilon;
      break;
    default:
      throw new Error('Invalid edge mode');
  }

  // 确保范围有效性（避免负半径）
  minRadius = Math.max(minRadius, 0);
  return distance >= minRadius && distance <= maxRadius;
}