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
