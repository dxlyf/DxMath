// 假设 Point 类型已定义
interface Point {
  x: number;
  y: number;
}

interface Circle {
  center: Point;
  radius: number;
}

// 圆与圆的碰撞检测，并返回碰撞点和深度
function circleCircleCollision(circle1: Circle, circle2: Circle): {
  isColliding: boolean;
  collisionPoint?: Point;
  depth?: number;
} {
  const dx = circle2.center.x - circle1.center.x;
  const dy = circle2.center.y - circle1.center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const sumRadius = circle1.radius + circle2.radius;

  if (distance >= sumRadius) {
    return {
      isColliding: false
    };
  }

  const collisionPoint: Point = {
    x: circle1.center.x + (dx * circle1.radius) / distance,
    y: circle1.center.y + (dy * circle1.radius) / distance
  };
  const depth = sumRadius - distance;

  return {
    isColliding: true,
    collisionPoint,
    depth
  };
}

// 导出碰撞检测函数
 export { circleCircleCollision };