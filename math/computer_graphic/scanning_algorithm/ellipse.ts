export const drawMidpointEllipse = (
    cx: number, cy: number, 
    a: number, b: number,
    setPixel: (x: number, y: number) => void
) => {
    let x = 0, y = b;
    let a2 = a*a, b2 = b*b;
    let d = b2 - a2*b + 0.25*a2;

    // 区域1
    while (a2*(y-0.5) > b2*(x+1)) {
        setSymPoints(x, y, cx, cy, setPixel);
        if(d < 0) {
            d += b2*(2*x + 3);
        } else {
            d += b2*(2*x + 3) + a2*(-2*y + 2);
            y--;
        }
        x++;
    }

    // 区域2
    d = b2*(x+0.5)*(x+0.5) + a2*(y-1)*(y-1) - a2*b2;
    while(y >= 0) {
        setSymPoints(x, y, cx, cy, setPixel);
        if(d > 0) {
            d += a2*(-2*y + 3);
        } else {
            d += b2*(2*x + 2) + a2*(-2*y + 3);
            x++;
        }
        y--;
    }
};

const setSymPoints = (x: number, y: number, cx: number, cy: number, setPixel: Function) => {
    [[x,y], [-x,y], [x,-y], [-x,-y]].forEach(([dx, dy]) => {
        setPixel(cx + dx, cy + dy);
    });
};

export const drawMidpointEllipseAntialias = (
    cx: number, cy: number,
    a: number, b: number,
    setPixel: (x: number, y: number, alpha: number) => void
  ) => {
    const a2 = a * a;
    const b2 = b * b;
    
    // Region 1: 以 x 为自变量，适用于斜率绝对值 <= 1
    const xLimit = a2 / Math.sqrt(a2 + b2);
    for (let x = 0; x <= xLimit; x++) {
      // 理想的 y 值
      const yIdeal = b * Math.sqrt(1 - (x * x) / a2);
      // 取整数部分
      const yInt = Math.floor(yIdeal);
      // 小数部分作为覆盖率差值
      const frac = yIdeal - yInt;
      
      // 利用四象限对称性绘制抗锯齿效果
      // 上边部分：下方像素覆盖率为 1-frac，紧接上方像素为 frac
      setPixel(cx + x, cy + yInt, 1 - frac);
      setPixel(cx + x, cy + yInt + 1, frac);
      setPixel(cx - x, cy + yInt, 1 - frac);
      setPixel(cx - x, cy + yInt + 1, frac);
      // 下边部分
      setPixel(cx + x, cy - yInt, 1 - frac);
      setPixel(cx + x, cy - yInt - 1, frac);
      setPixel(cx - x, cy - yInt, 1 - frac);
      setPixel(cx - x, cy - yInt - 1, frac);
    }
    
    // Region 2: 以 y 为自变量，适用于斜率绝对值 > 1
    const yLimit = b2 / Math.sqrt(a2 + b2);
    for (let y = 0; y <= yLimit; y++) {
      // 理想的 x 值
      const xIdeal = a * Math.sqrt(1 - (y * y) / b2);
      const xInt = Math.floor(xIdeal);
      const frac = xIdeal - xInt;
      
      // 对称绘制：左边与右边分别绘制两个相邻列
      setPixel(cx + xInt, cy + y, 1 - frac);
      setPixel(cx + xInt + 1, cy + y, frac);
      setPixel(cx - xInt, cy + y, 1 - frac);
      setPixel(cx - xInt - 1, cy + y, frac);
      setPixel(cx + xInt, cy - y, 1 - frac);
      setPixel(cx + xInt + 1, cy - y, frac);
      setPixel(cx - xInt, cy - y, 1 - frac);
      setPixel(cx - xInt - 1, cy - y, frac);
    }
  };
  

const setSymPointsAA = (x: number, y: number, cx: number, cy: number, 
    calc: Function, setPixel: Function) => {
    [[x,y], [-x,y], [x,-y], [-x,-y]].forEach(([dx, dy]) => {
        const alpha = calc(dx, dy);
        setPixel(cx + dx, cy + dy, alpha);
        // 边缘像素混合
        if(alpha < 1) {
            const nAlpha = alpha * 0.6;
            setPixel(cx + dx + (dx>0?1:-1), cy + dy, nAlpha);
            setPixel(cx + dx, cy + dy + (dy>0?1:-1), nAlpha);
        }
    });
};

export const drawBresenhamEllipse = (
    cx: number, cy: number,
    a: number, b: number,
    setPixel: (x: number, y: number) => void
  ) => {
    // a, b 分别为 x 轴和 y 轴的半轴长度
    // a2, b2 为它们的平方
    const a2 = a * a;
    const b2 = b * b;
    
    let x = 0;
    let y = b;
    
    // 初始决策参数 d1 用于 Region 1（斜率绝对值 > 1 的部分）
    // d1 = b2 - a2*b + 0.25*a2
    let d1 = b2 - a2 * b + 0.25 * a2;
    // dx, dy 用于累积更新：dx = 2*b2*x, dy = 2*a2*y
    let dx = 2 * b2 * x;
    let dy = 2 * a2 * y;
    
    // Region 1: 逐点增加 x，直到 b2*(x+1) >= a2*(y - 0.5)
    while (dx < dy) {
      // 绘制四个对称点
      setPixel(cx + x, cy + y);
      setPixel(cx - x, cy + y);
      setPixel(cx + x, cy - y);
      setPixel(cx - x, cy - y);
      
      if (d1 < 0) {
        // 选择水平移动
        x++;
        dx += 2 * b2;
        d1 += dx + b2;
      } else {
        // 同时移动 x 和 y
        x++;
        y--;
        dx += 2 * b2;
        dy -= 2 * a2;
        d1 += dx - dy + b2;
      }
    }
    
    // 初始决策参数 d2 用于 Region 2（斜率绝对值 < 1 的部分）
    // d2 = b2*(x+0.5)^2 + a2*(y-1)^2 - a2*b2
    let d2 = b2 * Math.pow(x + 0.5, 2) + a2 * Math.pow(y - 1, 2) - a2 * b2;
    
    // Region 2: 逐步减少 y，直到 y < 0
    while (y >= 0) {
      // 绘制四个对称点
      setPixel(cx + x, cy + y);
      setPixel(cx - x, cy + y);
      setPixel(cx + x, cy - y);
      setPixel(cx - x, cy - y);
      
      if (d2 > 0) {
        y--;
        dy -= 2 * a2;
        d2 += a2 - dy;
      } else {
        x++;
        y--;
        dx += 2 * b2;
        dy -= 2 * a2;
        d2 += dx - dy + a2;
      }
    }
  };
  
/**
 * 绘制抗锯齿椭圆
 * 采用类似 Wu 抗锯齿直线的思想：对于第一象限，
 * 以 x（区域1）或 y（区域2）为自变量，计算理想边界位置，
 * 然后利用相邻像素的覆盖率 (coverageRate, 取值范围 [0,1]) 进行绘制，
 * 最后利用椭圆的对称性绘制四个象限。
 * 
 * cx, cy: 椭圆中心
 * a, b: 分别为椭圆在 x、y 方向的半轴长度
 * setPixel(x, y, coverageRate): 绘制像素的回调函数
 */
export const drawBresenhamEllipseAntialias = (
    cx: number, cy: number,
    a: number, b: number,
    setPixel: (x: number, y: number, coverageRate: number) => void
  ) => {
    // 为避免重复计算，先计算 a² 和 b²
    const a2 = a * a;
    const b2 = b * b;
    
    // ---------------------------
    // Region 1: 主变量为 x，
    // 适用于斜率 |dy/dx| <= 1，即从 x=0 到区域分界点
    //
    // 区域分界点可近似取： x_max = a^2 / √(a² + b²)
    const xMax = a * a / Math.sqrt(a2 + b2);
    for (let x = 0; x <= xMax; x++) {
      // 对于给定 x，理想的 y 满足椭圆方程：
      //   (x²)/(a²) + (y²)/(b²) = 1  =>  y = b * √(1 - x²/a²)
      const yIdeal = b * Math.sqrt(1 - (x * x) / a2);
      // 取下界像素
      const yInt = Math.floor(yIdeal);
      // 小数部分决定边缘像素的覆盖率
      const frac = yIdeal - yInt;
      // 在理想边界处，上方像素距离理想边界为 frac，下方为 (1-frac)
      // 绘制四个对称象限（注意：这里 x 与 y 坐标均为正，后面再取镜像）
      // 注意：如果 frac 为 0，则两个像素中其中一个完全覆盖（可直接认为全覆盖）
      setPixel(cx + x, cy + yInt, 1 - frac);
      setPixel(cx + x, cy + yInt + 1, frac);
      setPixel(cx - x, cy + yInt, 1 - frac);
      setPixel(cx - x, cy + yInt + 1, frac);
      setPixel(cx + x, cy - yInt, 1 - frac);
      setPixel(cx + x, cy - yInt - 1, frac);
      setPixel(cx - x, cy - yInt, 1 - frac);
      setPixel(cx - x, cy - yInt - 1, frac);
    }
    
    // ---------------------------
    // Region 2: 主变量为 y，
    // 适用于 |dy/dx| > 1，即当 x 超过上一区域分界点，
    // 或直接以 y 作为自变量，从 y=0 到 y_max，其中
    // y_max 可近似取为： y_max = b^2 / √(a² + b²)
    const yMax = b * b / Math.sqrt(a2 + b2);
    for (let y = 0; y <= yMax; y++) {
      // 理想的 x 满足：
      //   (x²)/(a²) = 1 - (y²)/(b²)  =>  x = a * √(1 - y²/b²)
      const xIdeal = a * Math.sqrt(1 - (y * y) / b2);
      const xInt = Math.floor(xIdeal);
      const frac = xIdeal - xInt;
      // 绘制对称点：在当前 y 下，xInt 和 xInt+1 两列像素分别以覆盖率 (1-frac) 和 frac 绘制
      setPixel(cx + xInt, cy + y, 1 - frac);
      setPixel(cx + xInt + 1, cy + y, frac);
      setPixel(cx - xInt, cy + y, 1 - frac);
      setPixel(cx - xInt - 1, cy + y, frac);
      setPixel(cx + xInt, cy - y, 1 - frac);
      setPixel(cx + xInt + 1, cy - y, frac);
      setPixel(cx - xInt, cy - y, 1 - frac);
      setPixel(cx - xInt - 1, cy - y, frac);
    }
  };
  