
// 椭圆弧转贝塞尔曲线
//https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
// https://pomax.github.io/bezierinfo/index.html#splitting
interface Point {
    x: number;
    y: number;
}
//椭圆弧上的任意一点 ( x ,  y ) 都可以用二维矩阵方程描述：
function pointOnEllipse(cx:number,cy:number,rx:number,ry:number,theta:number,alpha:number){
    const thetaCos=Math.cos(theta);
    const thetaSin=Math.sin(theta);
    const alphaCos=Math.cos(alpha);
    const alphaSin=Math.sin(alpha);

    return {
        x:cx+rx*thetaCos*alphaCos-ry*thetaSin*alphaSin,
        y:cy+rx*thetaSin*alphaCos+ry*thetaCos*alphaSin,
    }
}
function rotatePoint(x:number,y:number,radian:number,cx:number=0,cy:number=0){
    const cos=Math.cos(radian);
    const sin=Math.sin(radian);


    return {
        x:cx+x*cos-y*sin,
        y:cy+x*sin+y*cos,
    }
}
function cross(u:number[],v:number[]){
    return u[0]*v[1]-u[1]*v[0];
}
function dot(u:number[],v:number[]){
    return u[0]*v[0]+u[1]*v[1];
}
// 一般来说，两个向量 ( u x ,  u y ) 和 ( v x ,  v y ) 之间的角度可以计算为
function vectorAngle(u:number[],v:number[]){
    // 这里出现的 ± 符号是u x  v y  −  u y  v x的符号 。
    const sign=cross(u,v)<0?-1:1
    let cos=dot(u,v)/(Math.sqrt(dot(u,u))*Math.sqrt(dot(v,v)))
    if(cos>1){
        cos=1
    }
    if(cos<-1){
        cos=-1
    }
    return sign*Math.acos(cos)
}

function vectorAngle2(u:number[],v:number[]){
    return Math.atan2(cross(u,v),dot(u,v))
}

function mapToEllipse (curve:number[], rx:number, ry:number, cosphi:number, sinphi:number, centrex:number, centrey:number) {
    var x = curve[0] * rx
    var y = curve[1] * ry
  
    var xp = cosphi * x - sinphi * y
    var yp = sinphi * x + cosphi * y
  
    return [xp + centrex, yp + centrey]
  }
  function approxUnitArc (ang1:number, ang2:number) {
    var a = 4 / 3 * Math.tan(ang2 / 4)  // 4/3*(Math.sqrt(2)-1)

    var x1 = Math.cos(ang1)
    var y1 = Math.sin(ang1)
    var x2 = Math.cos(ang1 + ang2)
    var y2 = Math.sin(ang1 + ang2)
  
    return [
      [x1 - y1 * a, y1 + x1 * a ],
      [x2 + y2 * a, y2 - x2 * a],
      [x2, y2]
    ]
  }

// https://www.w3.org/TR/SVG/implnote.html#ArcConversionCenterToEndpoint
export function centerToEndPoint(cx: number, cy: number,rx: number, ry: number, xAxisRotateAngle: number, startAngle: number,sweepAngle: number){
    xAxisRotateAngle=xAxisRotateAngle*Math.PI/180
 
    const {x:x1,y:y1}=pointOnEllipse(cx,cy,rx,ry,(startAngle*Math.PI/180),xAxisRotateAngle)
    const {x:x2,y:y2}=pointOnEllipse(cx,cy,rx,ry,(startAngle+sweepAngle)*Math.PI/180,xAxisRotateAngle)

    const fa=Math.abs(sweepAngle)>180?1:0
    const fs=sweepAngle>0?1:0
    return {
        x1,
        y1,
        x2,
        y2,
        fa,
        fs,
    }

}
// /https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
export function endPointToCenter(x1: number, y1: number, x2: number, y2: number,rx: number, ry: number, xAxisRotateAngle: number, fa: boolean | number, fs: boolean | number){
    
    const phi=xAxisRotateAngle*Math.PI/180

    // 计算( x 1 ′,  y 1 ′)
    let {x:x1p,y:y1p}=rotatePoint((x1-x2)/2,(y1-y2)/2,-phi);

    //修正超出范围的半径
    // 本节描述了超出范围的r x和r y所需的数学调整，如Path 实现说明中所述。从算法上讲，这些调整包括以下步骤：
    // 步骤 1：确保半径不为零
    if(rx==0||ry==0){
        throw '半径不能为0'
    }
    rx=Math.abs(rx);
    ry=Math.abs(ry);
    
    let x1pSq=x1p*x1p;
    let y1pSq=y1p*y1p;

    let rxSq=rx*rx;
    let rySq=ry*ry;

    let lambda=x1pSq/rxSq+y1pSq/rySq;
    if(lambda>1){
        lambda=Math.sqrt(lambda);
        rx*=lambda
        ry*=lambda
        rxSq=rx*rx;
        rySq=ry*ry;
    }
    //第 2 步：计算( cx ′ ,  cy ′ )
    // 如果f A  ≠  f S则选择 + 号，如果f A  =  f S则选择 − 号。
    const sign=fa==fs?-1:1;
    const denominator=rxSq*y1pSq+rySq*x1pSq;
    const numerator=Math.max(rxSq*rySq-denominator,0)
 
    const sqrtTerm=Math.sqrt(numerator/denominator);
    const cx1p=sign*sqrtTerm*(rx*y1p/ry)
    const cy1p=sign*sqrtTerm*-(ry*x1p/rx)
    //步骤 3：根据( c x ′,  c  y ′ ) 计算( c x , c y )
    const {x:cx,y:cy}=rotatePoint(cx1p,cy1p,phi,(x1+x2)/2,(y1+y2)/2);
    // 步骤 4：计算θ 1 和Δ θ

    const ux = (x1p - cx1p) / rx;
    const uy = (y1p - cy1p) / ry;
    const vx = (-x1p - cx1p) / rx;
    const vy = (-y1p - cy1p) / ry;

    let theta1=vectorAngle2([1,0],[ux,uy]);
    let deltaTheta=vectorAngle2([ux,uy],[vx,vy]);
    deltaTheta%=Math.PI*2;
    //其中 Δ θ固定在 −360° < Δ θ  < 360° 范围内，因此：
    // 换句话说，如果f S  = 0 且 (等式 5.6) 的右侧大于 0，则减去 360°，而如果f S  = 1 且 (等式 5.6) 的右侧小于 0，则加上 360°。所有其他情况下，保持原样。
    //如果fS  = 0，则 Δθ <  0 ，
    if(!fs){
        while(deltaTheta>0){
            deltaTheta-=Math.PI*2;
        }
    }
    //否则，如果f S  = 1，则 Δ θ  > 0。
    if(fs){
        while(deltaTheta<0){
            deltaTheta+=Math.PI*2;
        }
    }
    return {
        cx,
        cy,
        rx,
        ry,
        theta1,
        deltaTheta,
    }

}

// https://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter

export function ellipseArcToCubicBezier(x1: number, y1: number, x2: number, y2: number,_rx: number, _ry: number, xAxisRotateAngle: number, fa: boolean | number, fs: boolean | number){
    const phi=xAxisRotateAngle*Math.PI/180;
    const {cx,cy,rx,ry,theta1,deltaTheta}=endPointToCenter(x1,y1,x2,y2,_rx,_ry,xAxisRotateAngle,fa,fs);

    const segments=Math.ceil(Math.abs(deltaTheta)/(Math.PI/2));
    const delta=deltaTheta/segments;
    let currentTheta=theta1;

    const cubicBezierPoints:number[][]=[]
    
    const cosphi=Math.cos(phi)
    const sinphi=Math.sin(phi)
    // 计算
    for(let i=0;i<segments;i++){
        const endTheta=currentTheta+delta;
        const curves=approxUnitArc(currentTheta,delta).map(d=>{
            return mapToEllipse(d,rx,ry,cosphi,sinphi,cx,cy)
        }).flat()
        
        cubicBezierPoints.push([x1,y1].concat(curves))
        currentTheta=endTheta
        x1=curves[curves.length-2]
        y1=curves[curves.length-1]
    }
    
    return cubicBezierPoints
}
export function convertToCenterParameterization(
    x1: number, y1: number,
    x2: number, y2: number,
    rx: number, ry: number,
    phi: number,
    largeArcFlag: boolean|number,
    sweepFlag: boolean|number
): { cx: number, cy: number,rx:number,ry:number, theta1: number, deltaTheta: number } {
    const radPhi = phi * Math.PI / 180;
    const cosPhi = Math.cos(radPhi);
    const sinPhi = Math.sin(radPhi);

    const x1p = cosPhi * (x1 - x2) / 2 + sinPhi * (y1 - y2) / 2;
    const y1p = -sinPhi * (x1 - x2) / 2 + cosPhi * (y1 - y2) / 2;

    let rxSq = rx * rx;
    let rySq = ry * ry;
    const x1pSq = x1p * x1p;
    const y1pSq = y1p * y1p;

    let lambda = x1pSq / rxSq + y1pSq / rySq;
    if (lambda > 1) {
        const sqrtLambda = Math.sqrt(lambda);
        rx *= sqrtLambda;
        ry *= sqrtLambda;
        rxSq = rx * rx;
        rySq = ry * ry;
    }

    const numerator = rxSq * rySq - rxSq * y1pSq - rySq * x1pSq;
    const denominator = rxSq * y1pSq + rySq * x1pSq;

    if (denominator === 0) {
        throw new Error("Cannot process points with denominator zero.");
    }

    const sqrtTerm = Math.sqrt(numerator / denominator);
    const sign = largeArcFlag === sweepFlag ? -1 : 1;

    const cxp = sign * (rx * y1p / ry) * sqrtTerm;
    const cyp = sign * (-ry * x1p / rx) * sqrtTerm;

    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx;
    const vy = (-y1p - cyp) / ry;

    const theta1 = Math.atan2(uy, ux);
    const dot = ux * vx + uy * vy;
    const cross = ux * vy - uy * vx;
    let deltaTheta = Math.atan2(cross, dot);

    if (sweepFlag) {
        if (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    } else {
        if (deltaTheta > 0) deltaTheta -= 2 * Math.PI;
    }

    return { cx, cy,rx,ry, theta1, deltaTheta };
}

export function ellipseArcToCubic(
    x1: number, y1: number,
    x2: number, y2: number,
    radiusX: number, radiusY: number,
    axisAngle: number,
    largeArc: number | boolean,
    sweepClockwise: number | boolean
): Point[][] {
    const largeArcFlag = typeof largeArc === 'number' ? largeArc !== 0 : largeArc;
    const sweepFlag = typeof sweepClockwise === 'number' ? sweepClockwise !== 0 : sweepClockwise;
    
    // 处理轴旋转
    const phi = axisAngle * Math.PI / 180;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    
    // 将端点转换到未旋转坐标系
    const dx = (x1 - x2) / 2;
    const dy = (y1 - y2) / 2;
    const x1_ = cosPhi * dx + sinPhi * dy;
    const y1_ = -sinPhi * dx + cosPhi * dy;
    
    // 修正半径（确保满足数学约束）
    const lambda = (x1_ ** 2) / (radiusX ** 2) + (y1_ ** 2) / (radiusY ** 2);
    if (lambda > 1) {
        const sqrtLambda = Math.sqrt(lambda);
        radiusX *= sqrtLambda;
        radiusY *= sqrtLambda;
    }
    
    // 计算中心参数化
    const sign = (largeArcFlag === sweepFlag) ? -1 : 1;

    const denominator = (radiusX ** 2 * y1_ ** 2) + (radiusY ** 2 * x1_ ** 2);
    const numerator = (radiusX ** 2 * radiusY ** 2) 
    - (radiusX ** 2 * y1_ ** 2) 
    - (radiusY ** 2 * x1_ ** 2);
    const sqrtTerm = Math.sqrt(Math.max(0,numerator) / denominator);
    
    const cx_ = sign * (radiusX * y1_ / radiusY) * sqrtTerm;
    const cy_ = sign * (-radiusY * x1_ / radiusX) * sqrtTerm;
    
    // 转换回旋转坐标系
    const cx = cosPhi * cx_ - sinPhi * cy_ + (x1 + x2) / 2;
    const cy = sinPhi * cx_ + cosPhi * cy_ + (y1 + y2) / 2;
    
    // 计算角度参数
    const vectorAngle = (ux: number, uy: number) => {
        const angle = Math.atan2(uy, ux);
        return angle < 0 ? angle + 2 * Math.PI : angle;
    };
    
    const ux = (x1_ - cx_) / radiusX;
    const uy = (y1_ - cy_) / radiusY;
    const vx = (-x1_ - cx_) / radiusX;
    const vy = (-y1_ - cy_) / radiusY;
    
    const theta1 = vectorAngle(ux, uy);
    let deltaTheta = vectorAngle(vx, vy) - theta1;
    
    if (sweepFlag) {
        while (deltaTheta < 0) deltaTheta += 2 * Math.PI;
    } else {
        while (deltaTheta > 0) deltaTheta -= 2 * Math.PI;
    }
    
    // 分割圆弧为贝塞尔曲线段
    const segments: Point[][] = [];
    const numSegments = Math.ceil(Math.abs(deltaTheta) / (Math.PI / 2));
    const delta = deltaTheta / numSegments;
    
    for (let i = 0; i < numSegments; i++) {
        const start = theta1 + i * delta;
        const end = start + delta;
        
        // 计算贝塞尔控制点
        const alpha = 4/3 * Math.tan(delta / 4);
        
        const cosStart = Math.cos(start);
        const sinStart = Math.sin(start);
        const cosEnd = Math.cos(end);
        const sinEnd = Math.sin(end);
        
        // 局部控制点（未旋转）
        const p0 = { x: radiusX * cosStart, y: radiusY * sinStart };
        const p1 = { 
            x: radiusX * (cosStart - alpha * sinStart),
            y: radiusY * (sinStart + alpha * cosStart)
        };
        const p2 = { 
            x: radiusX * (cosEnd + alpha * sinEnd),
            y: radiusY * (sinEnd - alpha * cosEnd)
        };
        const p3 = { x: radiusX * cosEnd, y: radiusY * sinEnd };
        
        // 应用旋转和平移
        const transform = (p: Point): Point => ({
            x: cosPhi * p.x - sinPhi * p.y + cx,
            y: sinPhi * p.x + cosPhi * p.y + cy
        });
        
        segments.push([
            transform(p0),
            transform(p1),
            transform(p2),
            transform(p3)
        ]);
    }
    
    return segments;
}