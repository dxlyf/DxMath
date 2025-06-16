// 固定点数运算 (24.8格式)
class FixedPoint {
    static readonly SHIFT = 8;
    static readonly SCALE = 1 << FixedPoint.SHIFT;
    static readonly MASK = FixedPoint.SCALE - 1;
    static readonly HALF = FixedPoint.SCALE / 2;

    static toFixed(n: number): number {
        return Math.round(n * FixedPoint.SCALE);
    }

    static toFloat(f: number): number {
        return f / FixedPoint.SCALE;
    }

    static floor(f: number): number {
        return f & ~FixedPoint.MASK;
    }

    static ceil(f: number): number {
        return (f + FixedPoint.MASK) & ~FixedPoint.MASK;
    }

    static round(f: number): number {
        return FixedPoint.floor(f + FixedPoint.HALF);
    }

    static mul(a: number, b: number): number {
        return (a * b) >> FixedPoint.SHIFT;
    }
}

interface Point {
    x: number;
    y: number;
}

interface Span {
    y: number;
    x1: number;
    x2: number;
    coverage: number; // 0-255
}

interface Edge {
    x: number;       // 当前x值 (24.8)
    yStart: number;  // 起始y (24.8)
    yEnd: number;    // 结束y (24.8)
    dx: number;      // 斜率 (24.8)
    dy: number;      // y方向变化量 (24.8)
    winding: number; // 1 或 -1
}

class AARasterizer {
    private width: number;
    private height: number;
    private spans: Span[] = [];
    private edges: Edge[] = [];
    private scanlineCoverage: Int16Array;
    private minX: number = Infinity;
    private maxX: number = -Infinity;
    private minY: number = Infinity;
    private maxY: number = -Infinity;
    
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.scanlineCoverage = new Int16Array(width);
    }

    reset(): void {
        this.spans = [];
        this.edges = [];
    }

    // 添加路径到光栅化器
    addPath(path: Point[]): void {
        if (path.length < 2) return;

        // 将路径转换为固定点数
        const fixedPath = path.map(p => ({
            x: FixedPoint.toFixed(p.x),
            y: FixedPoint.toFixed(p.y)
        }));
        let minX=Infinity, maxX=-Infinity;
        let minY=Infinity, maxY=-Infinity;
      
        // 创建边
        for (let i = 0; i < fixedPath.length; i++) {
            const p1 = fixedPath[i];
            const p2 = fixedPath[(i + 1) % fixedPath.length];
            if(p1.x < minX) minX = p1.x;
            if(p1.x > maxX) maxX = p1.x;
            if(p1.y < minY) minY = p1.y;
            if(p1.y > maxY) maxY = p1.y;
            // 忽略水平线
            if (p1.y === p2.y) continue;
            
            // 确定边的方向
            const yStart = p1.y < p2.y ? p1.y : p2.y;
            const yEnd = p1.y < p2.y ? p2.y : p1.y;
            const xStart = p1.y < p2.y ? p1.x : p2.x;
            
            // 计算斜率 (dx/dy)
            const dy = Math.abs(p2.y - p1.y);
            const dx = FixedPoint.toFixed(
                (FixedPoint.toFloat(p2.x) - FixedPoint.toFloat(p1.x)) * 
                FixedPoint.SCALE / FixedPoint.toFloat(dy)
            );
            
            this.edges.push({
                x: xStart,
                yStart,
                yEnd,
                dx: p1.y < p2.y ? dx : -dx,
                dy,
                winding: p1.y < p2.y ? 1 : -1
            });
        }
        this.minX= minX;
        this.maxX= maxX;
        this.minY= minY;
        this.maxY= maxY;
    }

    // 执行光栅化
    rasterize(): Span[] {
        this.spans = [];
        
        // 按yStart排序边
        this.edges.sort((a, b) => a.yStart - b.yStart);
        
        // 活动边表
        const activeEdges: Edge[] = [];
        let currentY = this.edges[0].yStart;
        let edgeIndex = 0;
        
       

        // 扫描线循环
        while (edgeIndex < this.edges.length || activeEdges.length > 0) {
            // 添加新边
            while (edgeIndex < this.edges.length && 
                   this.edges[edgeIndex].yStart <= currentY) {
                activeEdges.push(this.edges[edgeIndex++]);
            }
            
            // 移除结束的边
            for (let i = activeEdges.length - 1; i >= 0; i--) {
                if (activeEdges[i].yEnd <= currentY) {
                    activeEdges.splice(i, 1);
                }
            }
            
            if (activeEdges.length === 0) {
                currentY += FixedPoint.SCALE;
                continue;
            }
            
            // 按x坐标排序活动边
            activeEdges.sort((a, b) => a.x - b.x);
            
            // 重置扫描线覆盖值
            this.scanlineCoverage.fill(0);
            
            // 处理活动边
            let winding = 0;
            let prevX = -1;
            
            for (let i = 0; i < activeEdges.length; i++) {
                const edge = activeEdges[i];
                
                // 计算当前x的整数部分
                const xInt = FixedPoint.floor(edge.x);
                
                // 只处理在图像宽度内的点
                if (xInt >= 0 && xInt < this.maxX) {
                    // 计算覆盖贡献
                    const coverage = this.calculateCoverage(edge, currentY);
                    
                    // 更新扫描线覆盖值
                    if (winding !== 0) {
                        // 填充两个边之间的区域
                        const startX = Math.max(prevX, 0);
                        const endX = Math.min(xInt, this.maxX - 1);
                        
                        for (let x = startX; x <= endX; x++) {
                            this.scanlineCoverage[x] += winding * 255;
                        }
                    }
                    
                    // 更新winding值
                    winding += edge.winding;
                    prevX = xInt;
                    
                    // 更新当前像素的覆盖值
                    this.scanlineCoverage[xInt] += coverage * edge.winding;
                }
                
                // 更新边的x值
                edge.x += edge.dx;
            }
            
            // 处理扫描线末尾
            if (winding !== 0) {
                const startX = Math.max(prevX, 0);
                const endX = this.maxX - 1;
                
                for (let x = startX; x <= endX; x++) {
                    this.scanlineCoverage[x] += winding * 255;
                }
            }
            
            // 生成扫描线的span
            this.generateSpans(currentY);
            
            // 移动到下一扫描线
            currentY += FixedPoint.SCALE;
        }
        
        return this.spans;
    }

    // 计算边缘对当前像素的覆盖贡献
    private calculateCoverage(edge: Edge, currentY: number): number {
        // 计算相对于扫描线的位置
        const yPos = currentY - FixedPoint.floor(edge.yStart);
        const yFrac = yPos & FixedPoint.MASK;
        
        // 计算x的小数部分
        const xFrac = edge.x & FixedPoint.MASK;
        
        // 使用边缘函数计算覆盖值
        // 这是一个简化的模型，实际AGG使用更复杂的计算方法
        const coverage = Math.max(0, 255 - Math.abs(xFrac - FixedPoint.HALF));
        
        return coverage;
    }

    // 从扫描线覆盖值生成span
    private generateSpans(yFixed: number): void {
        const y = FixedPoint.toFloat(yFixed) | 0;
        if (y < 0 || y >= this.height) return;
        
        let spanStart = -1;
        let currentCoverage = 0;
        
        for (let x = 0; x < this.width; x++) {
            // 限制覆盖值在0-255范围内
            const coverage = Math.max(0, Math.min(255, this.scanlineCoverage[x]));
            
            if (coverage > 0) {
                if (spanStart < 0) {
                    // 开始新span
                    spanStart = x;
                    currentCoverage = coverage;
                } else if (x === spanStart + 1 && coverage === currentCoverage) {
                    // 扩展当前span
                    // 仅当覆盖值相同时扩展
                } else {
                    // 结束当前span
                    this.spans.push({
                        y,
                        x1: spanStart,
                        x2: x - 1,
                        coverage: currentCoverage
                    });
                    
                    // 开始新span
                    spanStart = x;
                    currentCoverage = coverage;
                }
            } else if (spanStart >= 0) {
                // 结束当前span
                this.spans.push({
                    y,
                    x1: spanStart,
                    x2: x - 1,
                    coverage: currentCoverage
                });
                spanStart = -1;
            }
        }
        
        // 处理行末的span
        if (spanStart >= 0) {
            this.spans.push({
                y,
                x1: spanStart,
                x2: this.width - 1,
                coverage: currentCoverage
            });
        }
    }
}

// Canvas测试工具
class RasterizerDemo {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private rasterizer: AARasterizer;
    
    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.rasterizer = new AARasterizer(this.canvas.width, this.canvas.height);
    }
    
    runDemo(): void {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 创建测试路径
        const path = this.createTestPath();
        
        // 绘制原始路径
        this.drawOriginalPath(path);
        
        // 执行光栅化
        const startTime = performance.now();
        this.rasterizer.reset();
        this.rasterizer.addPath(path);
        const spans = this.rasterizer.rasterize();
        const duration = performance.now() - startTime;
        
        // 绘制光栅化结果
        this.drawRasterizedSpans(spans);
        
        // 显示性能信息
        this.drawPerformanceInfo(duration, spans.length);
        
        console.log(`Rendered ${spans.length} spans in ${duration.toFixed(2)}ms`);
    }
    
    private createTestPath(): Point[] {
        const path: Point[] = [];
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 添加矩形
        path.push({x: centerX - 150, y: centerY - 100});
        path.push({x: centerX + 150, y: centerY - 100});
        path.push({x: centerX + 150, y: centerY + 100});
        path.push({x: centerX - 150, y: centerY + 100});
        
        // 添加三角形
        path.push({x: centerX - 120, y: centerY - 70});
        path.push({x: centerX + 120, y: centerY - 70});
        path.push({x: centerX, y: centerY + 70});
        
        // 添加星形
        const starPoints = 5;
        const outerRadius = 80;
        const innerRadius = 35;
        for (let i = 0; i < starPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = Math.PI * i / starPoints;
            path.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }
        
        return path;
    }
    
    private drawOriginalPath(path: Point[]): void {
        this.ctx.beginPath();
        this.ctx.moveTo(path[0].x, path[0].y);
        
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
        
        this.ctx.closePath();
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    private drawRasterizedSpans(spans: Span[]): void {
        for (const span of spans) {
            // 使用灰度值表示覆盖度
            const gray = 255 - span.coverage;
            this.ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
            this.ctx.fillRect(span.x1, span.y, span.x2 - span.x1 + 1, 1);
        }
    }
    
    private drawPerformanceInfo(duration: number, spanCount: number): void {
        this.ctx.fillStyle = 'black';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Render time: ${duration.toFixed(2)}ms`, 10, 20);
        this.ctx.fillText(`Spans generated: ${spanCount}`, 10, 40);
        this.ctx.fillText('Red outline: Original path', 10, 60);
        this.ctx.fillText('Gray areas: Rasterized spans', 10, 80);
    }
}

// 页面加载后运行演示
window.addEventListener('load', () => {
    const demo = new RasterizerDemo('rasterCanvas');
    demo.runDemo();
    
    // 添加重新运行按钮
    const btn = document.createElement('button');
    btn.textContent = 'Run Again';
    btn.style.margin = '10px';
    btn.style.padding = '8px 16px';
    btn.onclick = () => demo.runDemo();
    document.body.appendChild(btn);
});