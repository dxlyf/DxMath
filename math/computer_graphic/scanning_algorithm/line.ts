function drawLine2(x0: number, y0: number, x1: number, y1: number,setPixel:(x:number,y:number)=>void){
    const dx=x1-x0
    const dy=y1-y0
    const asbDx=Math.abs(dx)
    const asbDy=Math.abs(dy)

    const steps=Math.max(asbDx, asbDy)

    for(let i=0;i<=steps;i++){
        const t=i/steps
        setPixel(Math.round(x0+dx*t),Math.round(y0+dy*t))
    }

}
function drawBresenhamLine2(x0: number, y0: number, x1: number, y1: number,setPixel:(x:number,y:number)=>void){

    let dx=x1>x0?x1-x0:x0-x1;
    let dy=y1>y0?y1-y0:y0-y1;

    let sx=x0<x1?1:-1;
    let sy=y0<y1?1:-1;
    let x=x0,y=y0;
    let dx2=dx+dx;
    let dy2=dy+dy;
    let m=dx>dy?dy2:dx2,error=0;
    setPixel(x,y)
    while(x!=x1||y!=y1){
        error+=m
        if(dx>dy){
            if(error>=dx){
                error-=dx2;
                y+=sy;
            }
            x+=sx;
        }else{
            if(error>=dy){
                error-=dy2;
                x+=sx;
            }
            y+=sy;
        }
        setPixel(x,y)
    }
}

export const drawDDALine = (x1: number, y1: number, x2: number, y2: number, setPixel: (x: number, y: number) => void) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    const xInc = dx / steps;
    const yInc = dy / steps;
    
    let x = x1, y = y1;
    for (let i = 0; i <= steps; i++) {
        setPixel(Math.round(x), Math.round(y));
        x += xInc;
        y += yInc;
    }
};
/**
 * Xiaolin Wu抗锯齿直线算法
 * @param {number} x0 - 起点x坐标
 * @param {number} y0 - 起点y坐标
 * @param {number} x1 - 终点x坐标
 * @param {number} y1 - 终点y坐标
 * @param {function} setPixel - 绘制像素的回调函数 (x, y, alpha) => void
 */
export function xiaolinWuLine(x0: number, y0: number,x1: number, y1: number, setPixel: (x: number, y: number,alpha:number) => void) {
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    
    // 交换x/y处理陡峭直线
    if (steep) {
        [x0, y0] = [y0, x0];
        [x1, y1] = [y1, x1];
    }
    
    if (x0 > x1) {
        [x0, x1] = [x1, x0];
        [y0, y1] = [y1, y0];
    }
    
    const dx = x1 - x0;
    const dy = y1 - y0;
    const gradient = dx === 0 ? 1 : dy / dx;
    
    let xend = Math.round(x0);
    let yend = y0 + gradient * (xend - x0);
    let xgap = 1 - ((x0 + 0.5) % 1);
    let xpxl1 = xend;
    let ypxl1 = Math.floor(yend);
    
    // 第一个端点
    if (steep) {
        setPixel(ypxl1, xpxl1, (1 - (yend % 1)) * xgap);
        setPixel(ypxl1 + 1, xpxl1, (yend % 1) * xgap);
    } else {
        setPixel(xpxl1, ypxl1, (1 - (yend % 1)) * xgap);
        setPixel(xpxl1, ypxl1 + 1, (yend % 1) * xgap);
    }
    
    let intery = yend + gradient;
    
    xend = Math.round(x1);
    yend = y1 + gradient * (xend - x1);
    xgap = (x1 + 0.5) % 1;
    let xpxl2 = xend;
    let ypxl2 = Math.floor(yend);
    
    // 第二个端点
    if (steep) {
        setPixel(ypxl2, xpxl2, (1 - (yend % 1)) * xgap);
        setPixel(ypxl2 + 1, xpxl2, (yend % 1) * xgap);
    } else {
        setPixel(xpxl2, ypxl2, (1 - (yend % 1)) * xgap);
        setPixel(xpxl2, ypxl2 + 1, (yend % 1) * xgap);
    }
    
    // 中间点
    for (let x = xpxl1 + 1; x <= xpxl2 - 1; x++) {
        if (steep) {
            setPixel(Math.floor(intery), x, 1 - (intery % 1));
            setPixel(Math.floor(intery) + 1, x, intery % 1);
        } else {
            setPixel(x, Math.floor(intery), 1 - (intery % 1));
            setPixel(x, Math.floor(intery) + 1, intery % 1);
        }
        intery += gradient;
    }
}
export const drawBresenhamLine = (x1: number, y1: number, x2: number, y2: number, setPixel: (x: number, y: number) => void) => {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    let [x, y] = [x1, y1];
    while (true) {
        setPixel(x, y);
        if (x === x2 && y === y2) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) { 
            err -= dy; 
            x += sx; 
        }
        if (e2 < dx) { 
            err += dx; 
            y += sy; 
        }
    }
};
export const drawDDALineAntialias = (x1: number, y1: number, x2: number, y2: number, 
    setPixel: (x: number, y: number, coverageRate: number) => void) => {
    
    const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    let [X1, Y1, X2, Y2] = steep ? [y1, x1, y2, x2] : [x1, y1, x2, y2];
    if (X1 > X2) [X1, X2, Y1, Y2] = [X2, X1, Y2, Y1];

    const dx = X2 - X1;
    const dy = Y2 - Y1;
    const gradient = dx === 0 ? 1 : dy / dx;
    
    let x = X1;
    let y = Y1;
    for (; x <= X2; x++) {
        const yFloor = Math.floor(y);
        const alpha = y - yFloor;
        if (steep) {
            setPixel(yFloor, x, 1 - alpha);
            setPixel(yFloor + 1, x, alpha);
        } else {
            setPixel(x, yFloor, 1 - alpha);
            setPixel(x, yFloor + 1, alpha);
        }
        y += gradient;
    }
};
export const drawBresenhamLineAntialias = (x1: number, y1: number, x2: number, y2: number,
    setPixel: (x: number, y: number, coverageRate: number) => void) => {
    
    const steep = Math.abs(y2 - y1) > Math.abs(x2 - x1);
    let [X1, Y1, X2, Y2] = steep ? [y1, x1, y2, x2] : [x1, y1, x2, y2];
    if (X1 > X2) [X1, X2, Y1, Y2] = [X2, X1, Y2, Y1];

    const dx = X2 - X1;
    const dy = Y2 - Y1;
    const gradient = dx === 0 ? 1 : dy / dx;

    // 端点处理
    let xend = Math.round(X1);
    let yend = Y1 + gradient * (xend - X1);
    let xgap = 1 - (X1 + 0.5) % 1;
    let [xpxl1, ypxl1] = [xend, Math.floor(yend)];
    steep ? (
        setPixel(ypxl1, xpxl1, (1 - (yend % 1)) * xgap),
        setPixel(ypxl1 + 1, xpxl1, (yend % 1) * xgap)
    ) : (
        setPixel(xpxl1, ypxl1, (1 - (yend % 1)) * xgap),
        setPixel(xpxl1, ypxl1 + 1, (yend % 1) * xgap)
    );

    // 主循环
    let intery = yend + gradient;
    for (let x = xpxl1 + 1; x <= Math.round(X2) - 1; x++) {
        steep ? (
            setPixel(Math.floor(intery), x, 1 - (intery % 1)),
            setPixel(Math.floor(intery) + 1, x, intery % 1)
        ) : (
            setPixel(x, Math.floor(intery), 1 - (intery % 1)),
            setPixel(x, Math.floor(intery) + 1, intery % 1)
        );
        intery += gradient;
    }

    // 终点处理
    xend = Math.round(X2);
    yend = Y2 + gradient * (xend - X2);
    xgap = (X2 + 0.5) % 1;
    let [xpxl2, ypxl2] = [xend, Math.floor(yend)];
    steep ? (
        setPixel(ypxl2, xpxl2, (1 - (yend % 1)) * xgap),
        setPixel(ypxl2 + 1, xpxl2, (yend % 1) * xgap)
    ) : (
        setPixel(xpxl2, ypxl2, (1 - (yend % 1)) * xgap),
        setPixel(xpxl2, ypxl2 + 1, (yend % 1) * xgap)
    );
};


export function drawThickLine(x1: number, y1: number, x2: number, y2: number, width: number,
    setPixel: (x: number, y: number) => void) {
    
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const offset = width / 2;
    
    // 生成平行路径
    for (let i = -offset; i <= offset; i++) {
        const dx = i * Math.cos(angle + Math.PI/2);
        const dy = i * Math.sin(angle + Math.PI/2);
    
        drawDDALine(Math.round(x1 + dx),Math.round( y1 + dy), Math.round(x2 + dx), Math.round(y2 + dy), setPixel);
    }
}