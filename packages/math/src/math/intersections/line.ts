import { Vector2 } from "../vec2";

/**
 * 与线段相交
 * @param a 
 * @param b 
 * @param c 
 * @param d 
 * @returns 
 */
export function intersectionFromLineSegment(a: Vector2, b: Vector2, c: Vector2, d: Vector2) {
  const ab = b.clone().sub(a)
  const cd = d.clone().sub(c)
  const det = ab.cross(cd)
  if (det == 0) return null

  const ac = a.clone().sub(c)
  const u = cd.cross(ac) / det
  const v = ab.cross(ac) / det
  if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    return a.clone().add(ab.clone().multiplyScalar(u))
  }
  return null
}
/**
 * 直线相交
 * @param a 
 * @param b 
 * @param c 
 * @param d 
 */
export function intersectionFromLine(a: Vector2, b: Vector2, c: Vector2, d: Vector2) {
  const ab = b.clone().sub(a)
  const cd = d.clone().sub(c)
  const det = ab.cross(cd)
  if (det == 0) return null

  const ac = a.clone().sub(c)
  const u = cd.cross(ac) / det
  const v = ab.cross(ac) / det
  return a.clone().add(ab.clone().multiplyScalar(u))
}

export function intersectionFromRect(a: Vector2, b: Vector2, rect: { x: number, y: number, width: number, height: number }) {
  const ab = b.clone().sub(a)
  const direction = ab.clone().normalize()
  const leftTop = Vector2.create(rect.x, rect.y)
  const rightBottom = Vector2.create(rect.x + rect.width, rect.y + rect.height)
  // 计算 t 值 leftTop相对start的长度
  const t1 = leftTop.sub(a).divide(direction) // 4/5=0.8  4=5*0.8  5=4/0.8   
  const t2 = rightBottom.sub(a).divide(direction)


  const tMin = Math.max(Math.min(t1.x, t2.x), Math.min(t1.y, t2.y)); // 找到最小长度中最大值
  const tMax = Math.min(Math.max(t1.x, t2.x), Math.max(t1.y, t2.y));

  // 判断是否相交
  if (tMin <= tMax && tMax >= 0) {
    // 计算相交点坐标
    return [a.add(direction.multiplyScalar(tMin))]
  } else {
    return []
  }
}
/**
 * 
 * @param a 在rect内
 * @param b 方向
 * @param rect 
 * @returns 
 */
export function intersectionFromAABB(a: Vector2, b: Vector2, rect: { x: number, y: number, width: number, height: number }) {
  const ab = b.clone().sub(a)
  const direction = ab.clone().normalize()
  const leftTop = Vector2.create(rect.x, rect.y)
  const rightBottom = Vector2.create(rect.x + rect.width, rect.y + rect.height)
  // 计算 t 值 leftTop相对start的长度
  const t1 = leftTop.sub(a).divide(direction) // 4/5=0.8  4=5*0.8  5=4/0.8   
  const t2 = rightBottom.sub(a).divide(direction)


  // const tMin = Math.max(Math.min(t1.x, t2.x), Math.min(t1.y, t2.y)); // 找到最小长度中最大值
  const tMax = Math.min(Math.max(t1.x, t2.x), Math.max(t1.y, t2.y));

  return a.add(direction.multiplyScalar(tMax))
}

/**
 * 线段与圆的交点
 * (x-k)^2+(y-h)^2=r^2 = x^2-2kx+k^2+y^2-2hy+h^2=r^2
   line(x,y)=x0+ad
    x^2-2kx+k^2+y^2-2hy+h^2=r^2
    sqrt(a+bd-c)=r
  

 * @param a 
 * @param b 
 * @param center 
 * @param radius 
 * @returns 
 */
export function intersectionFromCircle(a: Vector2, b: Vector2, center: Vector2, radius: number) {

  const intersections: Vector2[] = []
  const ab = b.clone().sub(a).normalize()
  const ap = center.clone().sub(a)
  const t = ap.dot(ab) / ab.length()
  if (t >= 0 && t <= 1) {
    const proj = a.clone().add(ab.clone().multiplyScalar(t))
    const dist = center.sub(proj).lengthSq()
    const radiusSq = radius * radius
    if (dist <= radiusSq) {
      const d = Math.sqrt(radiusSq - dist)
      const edge = ab.clone().multiplyScalar(d)
      if (a.lengthSq() > radiusSq) {
        intersections.push(proj.clone().sub(edge))
      }
      if (b.lengthSq() > radiusSq) {
        intersections.push(proj.clone().add(edge))
      }

    }
  }
  return intersections
}