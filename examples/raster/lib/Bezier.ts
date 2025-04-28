
export function pointOnLineDistance( px: number, py: number,x0: number, y0: number, x1: number, y1: number) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.abs((px - x0) * dy - (py - y0) * dx)/Math.sqrt(dx * dx + dy * dy);
}


export function subdivideQuadratic(
    x0: number, y0: number,
    cx: number, cy: number,
    x1: number, y1: number,
    tolerance: number,
    lines: number[]
) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const d = Math.abs((cx - x0) * dy - (cy - y0) * dx);
    if (d * d <= tolerance * tolerance * (dx * dx + dy * dy)) {
        lines.push(x0, y0, x1, y1);
        return;
    }

    const mx0 = (x0 + cx) / 2;
    const my0 = (y0 + cy) / 2;
    const mx1 = (cx + x1) / 2;
    const my1 = (cy + y1) / 2;
    const mx = (mx0 + mx1) / 2;
    const my = (my0 + my1) / 2;

    subdivideQuadratic(x0, y0, mx0, my0, mx, my, tolerance, lines);
    subdivideQuadratic(mx, my, mx1, my1, x1, y1, tolerance, lines);
}

export function subdivideCubic(
    x0: number, y0: number,
    cx0: number, cy0: number,
    cx1: number, cy1: number,
    x1: number, y1: number,
    tolerance: number,
    lines: number[]
) {
    const dx = x1 - x0;
    const dy = y1 - y0;

    const d1 = Math.abs((cx0 - x0) * dy - (cy0 - y0) * dx);
    const d2 = Math.abs((cx1 - x0) * dy - (cy1 - y0) * dx);
    if ((d1 + d2) * (d1 + d2) <= tolerance * tolerance * (dx * dx + dy * dy)) {
        lines.push(x0, y0, x1, y1);
        return;
    }
 
    const mx0 = (x0 + cx0) / 2;
    const my0 = (y0 + cy0) / 2;
    const mx1 = (cx0 + cx1) / 2;
    const my1 = (cy0 + cy1) / 2;
    const mx2 = (cx1 + x1) / 2;
    const my2 = (cy1 + y1) / 2;

    const mmx0 = (mx0 + mx1) / 2;
    const mmy0 = (my0 + my1) / 2;
    const mmx1 = (mx1 + mx2) / 2;
    const mmy1 = (my1 + my2) / 2;

    const mx = (mmx0 + mmx1) / 2;
    const my = (mmy0 + mmy1) / 2;

    subdivideCubic(x0, y0, mx0, my0, mmx0, mmy0, mx, my, tolerance, lines);
    subdivideCubic(mx, my, mmx1, mmy1, mx2, my2, x1, y1, tolerance, lines);
}
