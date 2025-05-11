// Cell：记录某个像素（x,y）位置上的局部覆盖信息
export type Cell = {
    x: number;
    y: number;
    area: number;     // 覆盖面积（整数）
    cover: number;    // 覆盖次数（用于 winding rule）
  };
  
  // Span：一行上的连续灰度像素数据
  export type Span = {
    x: number;
    y: number;
    len: number;
    alpha: number[];  // 灰度值数组
  };
  