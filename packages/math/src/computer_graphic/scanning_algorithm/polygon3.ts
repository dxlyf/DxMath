
function fillPolygonAntialiased(ctx, polygon, color = [255, 0, 0, 255]) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const coverage = new Float32Array(width * height); // 存储覆盖值

    class Edge {
        constructor(x1, y1, x2, y2) {
            if (y1 > y2) { // 确保yMin在下
                [x1, x2] = [x2, x1];
                [y1, y2] = [y2, y1];
            }
            this.yMin = y1;
            this.yMax = y2;
            this.x = x1;
            this.dx = (x2 - x1) / (y2 - y1);
        }
    }

    // 构建边表，过滤水平线
    const edges = [];
    for (let i = 0; i < polygon.length; i++) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % polygon.length];
        if (p1.y !== p2.y) { // 忽略水平边
            edges.push(new Edge(p1.x, p1.y, p2.x, p2.y));
        }
    }

    // 按yMin排序边表
    edges.sort((a, b) => a.yMin - b.yMin || a.x - b.x);

    // 抗锯齿参数：每个像素4个子扫描线
    const subSamples = 4;
    const dyStep = 1 / subSamples;

    // 处理每个像素行
    for (let yPixel = 0; yPixel < height; yPixel++) {
        // 处理每个子扫描线
        for (let s = 0; s < subSamples; s++) {
            const ySub = yPixel + s * dyStep + dyStep / 2; // 子扫描线Y坐标

            // 收集当前扫描线的活动边
            const activeEdges = [];
            for (const edge of edges) {
                if (edge.yMin <= ySub && edge.yMax > ySub) {
                    activeEdges.push(edge);
                }
            }

            // 计算交点
            const intersections = [];
            for (const edge of activeEdges) {
                const dy = ySub - edge.yMin;
                const x = edge.x + dy * edge.dx;
                intersections.push(x);
            }

            // 排序交点并配对
            intersections.sort((a, b) => a - b);
            for (let i = 0; i < intersections.length; i += 2) {
                const xStart = intersections[i];
                const xEnd = intersections[i + 1];
                if (xEnd <= xStart) continue;

                // 计算影响的像素列
                const xMin = Math.floor(xStart);
                const xMax = Math.ceil(xEnd);
                for (let x = xMin; x < xMax; x++) {
                    if (x < 0 || x >= width) continue;

                    // 计算当前像素列的覆盖长度
                    const coverStart = Math.max(x, xStart);
                    const coverEnd = Math.min(x + 1, xEnd);
                    const cover = Math.max(0, coverEnd - coverStart);

                    // 累加覆盖值（子扫描线贡献）
                    coverage[yPixel * width + x] += cover * (1 / subSamples);
                }
            }
        }
    }

    // 转换覆盖值到像素数据
    for (let i = 0; i < width * height; i++) {
        const alpha = Math.round(Math.min(1, coverage[i]) * color[3]);
        const idx = i * 4;
        data[idx] = color[0];        // R
        data[idx + 1] = color[1];    // G
        data[idx + 2] = color[2];    // B
        data[idx + 3] = alpha;       // A
    }

    ctx.putImageData(imageData, 0, 0);
}

export function fillPolygon(points, fillRule, antiAliasing, setPixel) {
    // 将点转换为FixedInt26.6格式（整数）
    const fixedPoints = points.map(p => ({
        x: Math.round(p.x * 64),
        y: Math.round(p.y * 64)
    }));

    // 构建边表（Edge Table, ET）
    const ET = [];
    const n = fixedPoints.length;
    for (let i = 0; i < n; i++) {
        const p1 = fixedPoints[i];
        const p2 = fixedPoints[(i + 1) % n];
        if (p1.y === p2.y) continue; // 忽略水平边

        // 确定边的方向，确保yStart < yEnd
        let yStart, yEnd, xStart, winding;
        if (p2.y > p1.y) {
            yStart = p1.y;
            yEnd = p2.y;
            xStart = p1.x;
            winding = 1;
        } else {
            yStart = p2.y;
            yEnd = p1.y;
            xStart = p2.x;
            winding = -1;
        }

        const dy = yEnd - yStart;
        const dx = p2.x - p1.x;
        const slope = (dx * 64) / dy; // 每扫描线（64 y单位）的x增量

        ET.push({ yStart, yEnd, x: xStart, slope, winding });
    }

    // 按yStart排序边表
    ET.sort((a, b) => a.yStart - b.yStart);

    let yCurrent = 0; // 当前扫描线（整数像素行）
    const AET = []; // 活动边表

    while (yCurrent <= (Math.max(...fixedPoints.map(p => p.y)) >> 6)) {
        const yScanFixed = yCurrent << 6; // 转换为FixedInt26.6

        // 将符合条件的边从ET移到AET
        while (ET.length > 0 && ET[0].yStart <= yScanFixed) {
            const edge = ET.shift();
            if (edge.yEnd > yScanFixed) {
                // 计算当前扫描线对应的x值
                const dyDelta = yScanFixed - edge.yStart;
                edge.currentX = edge.x + (edge.slope * dyDelta) / 64;
                AET.push(edge);
            }
        }

        // 移除yEnd <=当前扫描线的边
        for (let i = AET.length - 1; i >= 0; i--) {
            if (AET[i].yEnd <= yScanFixed) {
                AET.splice(i, 1);
            }
        }

        // 按x排序活动边
        AET.sort((a, b) => a.currentX - b.currentX);

        // 生成交点列表
        const intersections = [];
        let winding = 0;
        for (const edge of AET) {
            intersections.push({ x: edge.currentX, winding: edge.winding });
        }

        // 根据填充规则生成填充区间
        const fillRanges = [];
        if (fillRule === 'EvenOdd') {
            // 奇偶规则：两两配对
            for (let i = 0; i < intersections.length; i += 2) {
                if (i + 1 >= intersections.length) break;
                fillRanges.push({
                    start: intersections[i].x,
                    end: intersections[i + 1].x
                });
            }
        } else {
            // 非零绕数规则：跟踪绕数值
            let currentWinding = 0;
            let startX = null;
            for (const { x, winding } of intersections) {
                const prev = currentWinding;
                currentWinding += winding;
                if (prev === 0 && currentWinding !== 0) startX = x;
                else if (prev !== 0 && currentWinding === 0 && startX !== null) {
                    fillRanges.push({ start: startX, end: x });
                    startX = null;
                }
            }
        }

        // 处理每个填充区间
        for (const { start, end } of fillRanges) {
            if (antiAliasing) {
                // 抗锯齿处理：计算亚像素覆盖
                const xStart = start / 64;
                const xEnd = end / 64;
                const startPixel = Math.floor(xStart);
                const endPixel = Math.floor(xEnd);
                const startFrac = xStart - startPixel;
                const endFrac = xEnd - endPixel;

                if (startPixel === endPixel) {
                    setPixel(startPixel, yCurrent, endFrac - startFrac);
                } else {
                    if (startFrac < 1) {
                        setPixel(startPixel, yCurrent, 1 - startFrac);
                    }
                    for (let x = startPixel + 1; x < endPixel; x++) {
                        setPixel(x, yCurrent, 1);
                    }
                    if (endFrac > 0) {
                        setPixel(endPixel, yCurrent, endFrac);
                    }
                }
            } else {
                // 无抗锯齿：填充整像素
                const startPixel = Math.floor(start / 64);
                const endPixel = Math.ceil(end / 64);
                for (let x = startPixel; x < endPixel; x++) {
                    setPixel(x, yCurrent, 1);
                }
            }
        }

        // 更新活动边的x值
        for (const edge of AET) {
            edge.currentX += edge.slope;
        }

        yCurrent++;
    }
}