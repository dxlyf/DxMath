export class DashPathProcessor {
    private dashArray: number[];
    private dashOffset: number;
    private dashIndex: number;
    private dashRemain: number;
    private drawing: boolean;

    constructor(dashArray: number[], dashOffset: number) {
        this.dashArray = dashArray.length > 0 ? dashArray : [1e6]; // 防止空数组
        this.dashOffset = dashOffset;
        this.dashIndex = 0;
        this.dashRemain = 0;
        this.drawing = true;

        // 处理初始offset
        let totalLength = 0;
        for (const len of this.dashArray) totalLength += len;
        let offset = ((dashOffset % totalLength) + totalLength) % totalLength;

        while (offset > this.dashArray[this.dashIndex]) {
            offset -= this.dashArray[this.dashIndex];
            this.dashIndex = (this.dashIndex + 1) % this.dashArray.length;
            this.drawing = !this.drawing;
        }
        this.dashRemain = this.dashArray[this.dashIndex] - offset;
    }

    /**
     * 切分一条线段
     */
    processLine(
        x0: number, y0: number,
        x1: number, y1: number,
        emit: (draw: boolean, x0: number, y0: number, x1: number, y1: number) => void
    ) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        let len = Math.hypot(dx, dy);

        if (len < 1e-6) return; // 忽略极短段

        let ux = dx / len;
        let uy = dy / len;

        let sx = x0;
        let sy = y0;

        while (len > 0) {
            const step = Math.min(this.dashRemain, len);
            const ex = sx + ux * step;
            const ey = sy + uy * step;

            emit(this.drawing, sx, sy, ex, ey);

            sx = ex;
            sy = ey;
            len -= step;

            this.dashRemain -= step;
            if (this.dashRemain <= 1e-6) {
                this.dashIndex = (this.dashIndex + 1) % this.dashArray.length;
                this.dashRemain = this.dashArray[this.dashIndex];
                this.drawing = !this.drawing;
            }
        }
    }
}
