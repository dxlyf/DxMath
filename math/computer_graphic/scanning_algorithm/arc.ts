export const drawEllipseArc = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
    setPixel: (x: number, y: number) => void
) => {
    // 规范化角度到0~2π范围
    const normalizeAngle = (angle: number): number => {
        let normalized = angle % (2 * Math.PI);
        return normalized < 0 ? normalized + 2 * Math.PI : normalized;
    };

    let sa = normalizeAngle(startAngle);
    let ea = normalizeAngle(endAngle);

    // 计算角度变化方向和总弧度
    let delta: number;
    if (counterclockwise) {
        delta = ea >= sa ? ea - sa : ea + 2 * Math.PI - sa;
    } else {
        delta = ea <= sa ? sa - ea : sa + 2 * Math.PI - ea;
    }

    // 动态计算步长（至少1度，最多0.05弧度）
    const maxStep = Math.PI / 180; // 1度
    const minStep = 0.05;
    const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const step = Math.min(maxStep, Math.max(minStep, (2 * Math.PI) / (perimeter * 2)));

    // 计算总步数
    const numSteps = Math.ceil(delta / step);
    const angleIncrement = delta / numSteps * (counterclockwise ? 1 : -1);

    // 生成弧上的点
    for (let i = 0; i <= numSteps; i++) {
        const theta = sa + i * angleIncrement;
        const currentAngle = normalizeAngle(theta);
        
        const x = cx + rx * Math.cos(currentAngle);
        const y = cy + ry * Math.sin(currentAngle);
        
        // 四舍五入到最近的整数坐标
        setPixel(Math.round(x), Math.round(y));
    }
};