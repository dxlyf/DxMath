/**
 * 判断点 (x, y) 是否在椭圆内
 * @param {number} x - 点的 X 坐标
 * @param {number} y - 点的 Y 坐标
 * @param {number} h - 椭圆中心的 X 坐标
 * @param {number} k - 椭圆中心的 Y 坐标
 * @param {number} a - 椭圆的长半轴
 * @param {number} b - 椭圆的短半轴
 * @param {number} [rotation=0] - 椭圆的旋转角度（弧度，默认 0）
 * @returns {boolean} 点是否在椭圆内
 */
function isPointInEllipse(x: number, y: number, h: number, k: number, a: number, b: number, rotation: number = 0) {
    // 将点平移到以椭圆中心为原点
    const translatedX = x - h;
    const translatedY = y - k;

    // 处理旋转：将点反向旋转回椭圆的标准坐标系
    const cosTheta = Math.cos(rotation);
    const sinTheta = Math.sin(rotation);
    const rotatedX = translatedX * cosTheta + translatedY * sinTheta;
    const rotatedY = -translatedX * sinTheta + translatedY * cosTheta;

    // 判断点是否在旋转后的标准椭圆内
    return (rotatedX * rotatedX) / (a * a) + (rotatedY * rotatedY) / (b * b) <= 1;
}