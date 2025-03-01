/*** 
 * 1. 参数方程法（笛卡尔坐标系）
实现原理：
根据圆的参数方程 x = r·cosθ, y = r·sinθ 生成离散点。通过均匀采样角度θ（0到2π）计算坐标点，适用于任意精度需求。
TypeScript实现：
*/
export const drawParametricCircle = (cx: number, cy: number, r: number, setPixel: (x: number, y: number) => void) => {
    const step = 1 / r; // 自适应步长
    for (let theta = 0; theta < 2 * Math.PI; theta += step) {
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        setPixel(Math.round(x), Math.round(y));
    }
};

/**
 * 2. 中点画圆算法
核心机制：
基于八分对称性，每次计算一个八分圆弧并通过对称绘制全圆。利用决策参数判断下一个像素的位置。

误差决策公式：

d = 1 - r
ΔE = 3  
ΔSE = 5 - 2r
TypeScript实现：
 */
export const drawMidpointCircle = (cx: number, cy: number, r: number, setPixel: (x: number, y: number) => void) => {
    let x = 0;
    let y = r;
    let d = 1 - r;
    
    while (x <= y) {
        // 直接绘制八个对称点，避免数组创建和迭代
        [[x,y],[y,x],[-x,y],[-y,x],[-x,-y],[-y,-x],[x,-y],[y,-x]].forEach(([dx, dy])=>{
            setPixel(cx + dx, cy + dy);
        });
        
        // setPixel(cx + x, cy + y);
        // setPixel(cx + y, cy + x);
        // setPixel(cx - x, cy + y);
        // setPixel(cx - y, cy + x);
        // setPixel(cx - x, cy - y);
        // setPixel(cx - y, cy - x);
        // setPixel(cx + x, cy - y);
        // setPixel(cx + y, cy - x);
        
        if (d < 0) {
            d += 2 * x + 3;
        } else {
            d += 2 * (x - y) + 5;
            y--;
        }
        x++;
    }
};

/**
 * 
3. Bresenham画圆算法
优化特性：
仅使用整数运算，通过递推公式消除乘除法，相比中点算法减少50%计算量。

递推公式：

Δ = 3 - 2r  
当Δ <0时选择E点，Δ +=4x+6  
否则选择SE点，Δ +=4(x-y)+10
 */
export const drawBresenhamCircle = (cx: number, cy: number, r: number, setPixel: (x: number, y: number) => void) => {
    let x = 0, y = r, delta = 3 - 2 * r;
    while (x <= y) {
        // 绘制八分对称点
        [[x,y], [y,x], [-x,y], [y,-x], [-x,-y], [-y,-x], [x,-y], [-y,x]].forEach(([dx, dy]) => {
            setPixel(cx + dx, cy + dy);
        });
        if (delta < 0) {
            delta += 4 * x + 6;
        } else {
            delta += 4 * (x - y) + 10;
            y--;
        }
        x++;
    }
};

export const drawMidpointCircleAntialias = (
    cx: number, cy: number, r: number, 
    setPixel: (x: number, y: number, coverageRate: number) => void
) => {
    const plot = (x: number, y: number, d: number) => {
        const intensity = 1 - Math.abs(d / r);
        [[x,y], [y,x], [-x,y], [y,-x], [-x,-y], [-y,-x], [x,-y], [-y,x]].forEach(([dx, dy]) => {
            setPixel(cx + dx, cy + dy, intensity);
            if(dx !== 0) setPixel(cx - dx, cy + dy, intensity * 0.8);
            if(dy !== 0) setPixel(cx + dx, cy - dy, intensity * 0.8);
        });
    };

    let x = 0, y = r;
    let d = 1 - r;
    while(x <= y) {
        plot(x, y, d);
        if(d < 0) {
            d += 2 * x + 3;
        } else {
            d += 2 * (x - y) + 5;
            y--;
        }
        x++;
    }
};
export const drawBresenhamCircleAntialias = (
    cx: number, cy: number, r: number,
    setPixel: (x: number, y: number, coverageRate: number) => void
) => {
    const calcIntensity = (dist: number) => 
        Math.max(0, 1 - Math.abs(dist - r)/Math.sqrt(2));

    let x = 0, y = r;
    let delta = 3 - 2 * r;
    while(x <= y) {
        const dist = Math.sqrt(x*x + y*y);
        const intensity = calcIntensity(dist);
        
        [[x,y], [y,x], [-x,y], [y,-x], [-x,-y], [-y,-x], [x,-y], [-y,x]].forEach(([dx, dy]) => {
            setPixel(cx + dx, cy + dy, intensity);
            if(dx !== dy) setPixel(cx + dx, cy + dy + (dx>dy?1:-1), intensity*0.6);
        });

        if(delta < 0) {
            delta += 4 * x + 6;
        } else {
            delta += 4 * (x - y) + 10;
            y--;
        }
        x++;
    }
};
export const drawAntialiasedCircle = (cx: number, cy: number, r: number, 
    setPixel: (x: number, y: number, alpha: number) => void) => {
    
    const ir = Math.floor(r);
    for (let y = -ir; y <= ir; y++) {
        for (let x = -ir; x <= ir; x++) {
            const dist = Math.sqrt(x*x + y*y);
            const alpha = Math.max(0, 1 - Math.abs(dist - r));
            if (alpha > 0) setPixel(cx+x, cy+y, alpha);
        }
    }
};