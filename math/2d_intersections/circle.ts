function getCircleCircleIntersections(circle1: Circle, circle2: Circle): Point[] {
    const { center: c1, radius: r1 } = circle1;
    const { center: c2, radius: r2 } = circle2;
  
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const d = Math.sqrt(dx * dx + dy * dy);
  
    if (d > r1 + r2 || d < Math.abs(r1 - r2)) {
      return []; // 无交点
    }
  
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(r1 * r1 - a * a);
  
    const px = c1.x + (dx * a) / d;
    const py = c1.y + (dy * a) / d;
  
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
  
    return [
      { x: px + rx, y: py + ry },
      { x: px - rx, y: py - ry }
    ];
  }


  function getCirclePolygonIntersections(circle: Circle, polygon: Polygon): Point[] {
    const intersections: Point[] = [];
    
    for (let i = 0; i < polygon.length; i++) {
      const p1 = polygon[i];
      const p2 = polygon[(i + 1) % polygon.length]; // 连接多边形的边
      const segmentIntersections = getLineCircleIntersections(p1, p2, circle);
      intersections.push(...segmentIntersections);
    }
  
    return intersections;
  }
  
 