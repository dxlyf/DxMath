
// @ts-nocheck
/**
 * 扫描线算法：

优点：效率最高，适合复杂多边形

优化：使用增量计算代替浮点运算，添加活性边表缓存

非零环绕数：

优点：数学严谨，支持任意复杂路径

优化：使用射线法的Bresenham算法加速交叉检测

边界标志：

优点：实现简单，适合交互式填充

注意：需要预先绘制边界，递归实现可能导致栈溢出
 * 
*/
class Edge {
    constructor(yMin, yMax, x, slopeInv) {
        this.yMin = yMin;  // 边的最小Y坐标
        this.yMax = yMax;  // 边的最大Y坐标
        this.x = x;        // 当前X坐标（初始为边在yMin处的X）
        this.slopeInv = slopeInv; // 1/斜率（用于增量更新）
    }
}
//扫描线填充算法（Scanline Fill）
function scanlineFill(ctx, polygon, color) {
    // 1. 构建全局边表 (GET)
    const edges = [];
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        if (p1.y === p2.y) continue; // 跳过水平边
        
        const yMin = Math.min(p1.y, p2.y);
        const yMax = Math.max(p1.y, p2.y);
        const x = (p1.y === yMin) ? p1.x : p2.x;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        edges.push(new Edge(yMin, yMax, x, dx / dy));
    }
    
    // 2. 按yMin排序边表
    edges.sort((a, b) => a.yMin - b.yMin || a.x - b.x);
    
    // 3. 初始化活动边表 (AET)
    const aet = [];
    let y = edges[0]?.yMin ?? 0;
    const yEnd = Math.max(...edges.map(e => e.yMax));
    
    while (y <= yEnd) {
        // 4. 将yMin=y的边加入AET
        while (edges.length && edges[0].yMin === y) {
            aet.push(edges.shift());
        }
        
        // 5. 按当前X坐标排序AET
        aet.sort((a, b) => a.x - b.x);
        
        // 6. 奇偶规则填充
        for (let i = 0; i < aet.length; i += 2) {
            const xStart = Math.ceil(aet[i].x);
            const xEnd = Math.floor(aet[i + 1]?.x ?? aet[i].x);
            if (xStart <= xEnd) {
                ctx.fillStyle = color;
                ctx.fillRect(xStart, y, xEnd - xStart + 1, 1);
            }
        }
        
        // 7. 更新AET中的X值并移除完成边
        let i = 0;
        while (i < aet.length) {
            aet[i].x += aet[i].slopeInv;
            if (y >= aet[i].yMax) {
                aet.splice(i, 1);
            } else {
                i++;
            }
        }
        
        y++;
    }
}

function isInside(point, polygon) {
    let windingNumber = 0;
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        
        if (p1.y <= point.y) {
            if (p2.y > point.y && isLeft(p1, p2, point) > 0) {
                windingNumber++;
            }
        } else {
            if (p2.y <= point.y && isLeft(p1, p2, point) < 0) {
                windingNumber--;
            }
        }
    }
    return windingNumber !== 0;
}

function isLeft(p0, p1, p) {
    return (p1.x - p0.x) * (p.y - p0.y) - (p.x - p0.x) * (p1.y - p0.y);
}
// 非零环绕数填充（Non-Zero Winding）
function windingFill(ctx, polygon, color) {
    // 获取多边形边界
    const minX = Math.min(...polygon.map(p => p.x));
    const maxX = Math.max(...polygon.map(p => p.x));
    const minY = Math.min(...polygon.map(p => p.y));
    const maxY = Math.max(...polygon.map(p => p.y));
    
    // 逐像素检测
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (isInside({x, y}, polygon)) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}
// 边界标志算法（Boundary Flag）
function boundaryFill(ctx, x, y, fillColor, boundaryColor) {
    const stack = [[x, y]];
    const visited = new Set();
    
    while (stack.length) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const currentColor = `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]/255})`;
        
        if (currentColor !== boundaryColor && currentColor !== fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, 1, 1);
            
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
}


// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');

// // 定义多边形（带孔洞）
// const polygon = [
//     {x: 50, y: 50}, {x: 200, y: 50}, 
//     {x: 200, y: 200}, {x: 50, y: 200},
//     // 孔洞
//     {x: 100, y: 100}, {x: 150, y: 100},
//     {x: 150, y: 150}, {x: 100, y: 150}
// ];

// // 使用扫描线算法填充
// ctx.beginPath();
// scanlineFill(ctx, polygon, '#FF0000');

// // 或用非零环绕数填充
// // windingFill(ctx, polygon, '#00FF00');

// // 边界填充需要先绘制边界
// ctx.strokeStyle = '#000000';
// ctx.strokeRect(50, 50, 150, 150);
// boundaryFill(ctx, 100, 100, '#0000FF', '#000000');
