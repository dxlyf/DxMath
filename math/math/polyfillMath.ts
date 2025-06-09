import BigNumber from './bignumber'
// cordic Volder算法
// https://zh.wikipedia.org/wiki/CORDIC


/**
 * 圆周系统(Circular System)旋转模式
 * 使用CORDIC算法计算向量旋转后的坐标
 * @param {number} x - 初始x坐标
 * @param {number} y - 初始y坐标
 * @param {number} angle - 旋转角度(弧度)
 * @param {number} [iterations=20] - 迭代次数
 * @returns {number[]} 旋转后的坐标[x, y]
 */
export function circularRotation(x:number, y:number, angle:number, iterations = 20) {
    let currentAngle = 0;
    let factor = 1;
    const angles = [];
    let pow = 1;

    // 预计算旋转角度和增益因子
    for (let i = 0; i < iterations; i++) {
        angles.push(Math.atan(pow));
        pow /= 2;
        factor *= Math.sqrt(1 + 2 ** (-2 * i));
    }
    factor = 1 / factor;

    // CORDIC核心迭代
    pow = 1;
    for (let i = 0; i < iterations; i++) {
        const direction = currentAngle < angle ? 1 : -1;
        [x, y] = [
            x - y * direction * pow,
            y + x * direction * pow
        ];
        currentAngle += direction * angles[i];
        pow /= 2;
    }
    return [x * factor, y * factor];
}

/**
 * 圆周系统向量模式
 * 计算向量的极坐标参数
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} [iterations=20] - 迭代次数
 * @returns {{magnitude: number, angle: number}} 幅度和角度
 */
export function circularVector(x:number, y:number, iterations = 20) {
    let angle = 0;
    let pow = 1;

    // CORDIC核心迭代
    for (let i = 0; i < iterations; i++) {
        const direction = y > 0 ? -1 : 1;
        [x, y] = [
            x - y * direction * pow,
            y + x * direction * pow
        ];
        angle -= direction * Math.atan(pow);
        pow /= 2;
    }
    return {
        magnitude: x * (1 / Math.sqrt(1 + 2 ** (-2 * iterations))),
        angle
    };
}

/**
 * 线性系统(Linear System)旋转模式
 * 使用CORDIC实现乘法运算
 * @param {number} x - 被乘数
 * @param {number} z - 乘数
 * @param {number} [iterations=20] - 迭代次数
 * @returns {number} 乘积结果
 */
export function linearRotation(x:number, z:number, iterations = 20) {
    let y = 0;
    let pow = 1;

    for (let i = 0; i < iterations; i++) {
        const direction = z >= 0 ? 1 : -1;
        y += direction * x * pow;
        z -= direction * pow;
        pow /= 2;
    }
    return y;
}

/**
 * 线性系统向量模式
 * 使用CORDIC实现除法运算
 * @param {number} x - 被除数
 * @param {number} y - 除数
 * @param {number} [iterations=20] - 迭代次数
 * @returns {number} 商值
 */
export function linearVector(x:number, y:number, iterations = 20) {
    let z = 0;
    let pow = 1;

    for (let i = 0; i < iterations; i++) {
        const direction = y <= x ? 1 : -1;
        y += direction * x * pow;
        z += direction * pow;
        pow /= 2;
    }
    return z;
}

/**
 * 双曲系统(Hyperbolic System)旋转模式
 * 使用CORDIC计算双曲函数
 * @param {number} x - 初始x坐标
 * @param {number} y - 初始y坐标
 * @param {number} angle - 双曲旋转角度
 * @param {number} [iterations=20] - 迭代次数
 * @returns {number[]} 旋转后的坐标[x, y]
 */
export function hyperbolicRotation(x:number, y:number, angle:number, iterations = 20) {
    let currentAngle = 0;
    let factor = 1;
    const angles = [];
    let pow = 0.5;

    // 预计算角度和增益因子(需要重复特定迭代)
    for (let i = 1, k = 3; i <= iterations; i++) {
        angles.push(Math.atanh(pow));
        factor *= Math.sqrt(1 - 2 ** (-2 * i));
        if (i === k) {  // 重复迭代保证收敛
            angles.push(Math.atanh(pow));
            factor *= Math.sqrt(1 - 2 ** (-2 * i));
            k = 2 * k + 1;
        }
        pow /= 2;
    }
    factor = 1 / factor;

    // CORDIC核心迭代
    pow = 0.5;
    for (let i = 0; i < iterations; i++) {
        const direction = currentAngle < angle ? 1 : -1;
        [x, y] = [
            x + y * direction * pow,
            y + x * direction * pow
        ];
        currentAngle += direction * angles[i];
        pow /= 2;
    }
    return [x * factor, y * factor];
}

/**
 * 双曲系统向量模式
 * 计算双曲极坐标参数
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {number} [iterations=20] - 迭代次数
 * @returns {{magnitude: number, angle: number}} 幅度和双曲角度
 */
export function hyperbolicVector(x:number, y:number, iterations = 20) {
    let angle = 0;
    let pow = 0.5;

    for (let i = 1, k = 3; i <= iterations; i++) {
        const direction = y > 0 ? -1 : 1;
        [x, y] = [
            x + y * direction * pow,
            y + x * direction * pow
        ];
        angle -= direction * Math.atanh(pow);
        if (i === k) {  // 重复迭代
            [x, y] = [
                x + y * direction * pow,
                y + x * direction * pow
            ];
            angle -= direction * Math.atanh(pow);
            k = 2 * k + 1;
        }
        pow /= 2;
    }
    return {
        magnitude: x * (1 / Math.sqrt(1 - 2 ** (-2 * iterations))),
        angle
    };
}

function createMathTrigonometric() {

    const PI = Math.PI
    const PI2 = PI * 2
    const PI_2 = PI / 2
    const PI_4 = PI / 4

    const iters = 23;
    const arctanTable = []
    const tanTable = []
    let k = 1
    // 预计算 arctan 表和缩放因子 k
    for (let i = 0; i < iters; i++) {
        tanTable[i] = Math.pow(2, -i)
        arctanTable[i] = Math.atan(tanTable[i])

        k *= 1 / Math.sqrt(1 + Math.pow(2, -2 * i))
    }
    function perp(x: number, y: number) {
        return [y, -x]
    }

    /**
     * 对点 (x, y) 绕原点旋转 theta 弧度，并返回旋转后的点的余弦值和正弦值。
     *
     * @param x 点的 x 坐标
     * @param y 点的 y 坐标
     * @param theta 旋转的角度（弧度）
     * @returns 旋转后的点的余弦值和正弦值组成的数组 [cos, sin]
     */
    function rotate(x: number, y: number, theta: number) {

        while (theta > PI_4) {
            theta -= PI_2;
            [x, y] = perp(-x, -y)
        }
        while (theta < -PI_4) {
            theta += PI_2;
            [x, y] = perp(x, y)
        }

        for (let i = 0; i < iters; i++) {
            const tan = tanTable[i]
            const sigma = theta >= 0 ? 1 : -1
            let x0 = x - sigma * y * tan
            let y0 = sigma * x * tan + y
            x = x0
            y = y0
            theta -= sigma * arctanTable[i]
        }
        let cos = Number(x * k) //.toPrecision(10))
        let sin = Number(y * k) //.toPrecision(10))

        return [cos, sin]
    }

    // 向量模式：将 (x, y) 转换为 (r, theta)
    function vector(x: number, y: number) {
        if(x===0 && y===0) return [0, 0]
        let theta = 0,xtemp;
        /* Get the vector into [-PI/4,PI/4] sector */

        // 当y>x 时,angle中 45<ange<=180 
        // 当y>x 时,angle中 -180<=ange<-135
        if (y > x) {
             // angle在 45<ange<=136 
            if (y > -x) {
                theta = PI_2;
                xtemp = y;
                y = -x;
                x = xtemp;
            }
             // angle在 -180<=ange<=-136
              // angle在 136<=ange<=180
            else {

                theta = y > 0 ? PI : -PI;
                x = -x;
                y = -y;
            }
        }

        else {
              // 当y<=x 时,angle中 -135<=ange<=45

            // angle -135<=angle<=-46
            if (y < -x) {
                theta = -PI_2;
                xtemp = -y;
                y = x;
                x = xtemp;
            }
            else {
                // -45 <= angle <= 45

                theta = 0;
            }
        }
        for (let i = 0; i < iters; i++) {
            const sigma = y >= 0 ? 1 : -1;
            const x_new = x + sigma * y * tanTable[i];
            const y_new = y - sigma * x * tanTable[i];
            x = x_new;
            y = y_new;
            theta += sigma * arctanTable[i];
        }
        const r = x * k;
        return [r, theta];
    }
    function cos(theta:number){
        return rotate(1, 0, theta)[0]
    }
    function sin(theta:number){
        return cos( PI_2-theta)
    }
    function tan(theta:number){
        const [cos,sin]=rotate(1, 0, theta)
        return sin/cos
    }
    function atan2(y:number, x:number){ // 反正切函数
        return vector(x, y)[1]
    }

    return { rotate, vector,cos,sin,tan,atan2 }

}
// const myMath= createMathTrigonometric()
// const  { rotate, vector,cos,sin,tan } =myMath
// window.myMath=myMath
//console.log('vector', vector(-1, -1))
// for(let i=-180;i<=180;i+=1){
//     let angle = i / 180 * Math.PI
//     const cos=Math.cos(angle)
//     const sin=Math.sin(angle)
//     if(sin>cos){
//         if(sin>-cos){
//            console.log('angle',i,'cos',cos,'sin',sin,'equest',sin>cos)
//         }else{
//             console.log('angle',i,'cos',cos,'sin',sin,'equest',sin>cos)
//         }
//     }else{
//         if(sin<-cos){
           
//         }else{
//            // console.log('angle',i,'cos',cos,'sin',sin,'equest',sin>cos)
//         }
//     }
// }
// for (let i = -180; i < 180; i += 15) {
//     let angle = i / 180 * Math.PI
//     const [cos, sin] = rotate(1, 0, angle)
//     console.log('cosfd', cos, 'Math.cos', Math.cos(angle))
// }


function test() {

    const SCALE = 1 << 16 // 16.16定点数
    const PI = 180 * SCALE
    const PI2 = PI * 2
    const PI_2 = PI / 2
    const PI_4 = PI / 4
    const TABLE_LENGTH = 23
    const RADIANS_TO_DEGREES = 180 / Math.PI
    const DEGREES_TO_RADIANS = Math.PI / 180
    const arctanTable = []
    const tanTable = []

    /** 
     *  tan=sin/cos
     *  sin=tan*cos
        cos=1/sqrt(1+tan^2)
        sin=tan*sqrt(1+tan^2)
    
    
     *  旋转公式：
     *  x'=x*cos(theta)-y*sin(theta) = cos(theta)(x-y*tan(theta))=1/sqrt(1+tan^2)(x-y*tan(theta))
    
        y'=x*sin(theta)+y*cos(theta)= cos(theta)(x*tan(theta)+y)=1/sqrt(1+tan^2)(x*tan(theta)+y)
    
                                    [( [1,tan(theta)
        1/sqrt(1+tan^2(theta))  *
    
                                     [tan(theta),1] )
    
        // 求点是不是旋转点
        x'/(x-y*tan(theta))=y'/(y+x*tan(theta)) 
        x'(y+x*tan(theta))=y'(x-y*tan(theta))
        x'(y+x*tan(theta))-y'(x-y*tan(theta))=0
    
    
    
     *  cordic算法：
     *  1. 将角度转换为二进制表示，然后逐位处理。
     *  2. 对于每一位，如果该位为1，则将向量旋转arctan(2^-i)弧度；如果该位为0，则不进行旋转。
     *  3. 最后得到的结果即为旋转后的坐标。
     * 
    */

    function isBigInt(v: any): boolean {
        return typeof v === 'bigint' || v instanceof BigInt
    }

    function round(v: number) {
        return SCALE === 1 ? v : Math.round(v)
    }

    function buildArctanTable(num: number) {
        const arctanTable = []
        for (let i = 0; i < num; i++) {
            arctanTable[i] = round(SCALE * RADIANS_TO_DEGREES * Math.atan(Math.pow(2, -i)))
        }
        return arctanTable
    }
    function computeK(num: number) {
        let k = 1;
        for (let i = 0; i < num; i++) {
            k *= Math.sqrt(1 + Math.pow(2, -i * 2));
        }
        return 1 / k;
    }
    function tanToCos(tan: number): number {
        return 1 / Math.sqrt(1 + Math.pow(tan, 2))
    }
    let k = 1
    let k2 = 1
    let k3 = 1
    // tan=Math.pow(2,-i)
    // Math.pow(2,-i)=1/Math.pow(2,i)
    // Math.pow(Math.pow(2,-i),2)==Math.pow(2,-i*2)
    // y*tan(theta)=y/Math.pow(2,i)=y>>i

    let k4 = BigNumber(1)

    for (let i = 0; i < TABLE_LENGTH; i++) {
        tanTable[i] = Math.pow(2, -i) // 2^-i
        //Math.atan2(1,Math.pow(2,i))=Math.atan(1/Math.pow(2,i))=Math.atan(Math.pow(2,-i))
        arctanTable[i] = round(SCALE * RADIANS_TO_DEGREES * Math.atan(tanTable[i]))
        //   k2*=Math.cos(Math.atan(tanTable[i]))
        k *= tanToCos(tanTable[i])
        k2 *= 1 / Math.sqrt(1 + Math.pow(2, -2 * i))
        k3 *= Math.sqrt(1 + Math.pow(2, -2 * i))

        k4 = k4.multipliedBy(Math.sqrt(1 + Math.pow(2, -2 * i)))
    }
    // k3=1/k=1/k2
    // console.log('k2',k2,'k3',k3,k4.multipliedBy(2**31).toNumber())

    function cordic_rotate(x: number, y: number, angle: number) {
        let x0 = Math.round(x * SCALE)
        let y0 = Math.round(y * SCALE)

        // 规范角度范围[-180,180]
        while (angle > 180) {
            angle -= 360
        }
        while (angle < -180) {
            angle += 360
        }
        angle = Math.round(angle * SCALE)
        let temp
        // 如果大于90度，让向量从+90度位置开始旋转
        if (angle > PI_2) {
            // rotate 逆时针
            temp = x0
            x0 = -y0
            y0 = temp
            angle = angle - PI_2
        }
        // 从-90度开始旋转
        if (angle < -PI_2) {
            // rotate 顺时针
            temp = x0
            x0 = y0
            y0 = -temp
            angle = angle + PI_2
        }
        let theta = 0

        for (let i = 0; i < arctanTable.length; i++) {

            let direction = theta > angle ? -1 : 1
            if (direction > 0) {
                let x1 = (x0 - y0 * tanTable[i])
                let y1 = (x0 * tanTable[i] + y0)
                x0 = x1;
                y0 = y1;
            } else {
                let x1 = (x0 + y0 * tanTable[i])
                let y1 = (-x0 * tanTable[i] + y0)
                x0 = x1;
                y0 = y1;
            }
            theta += direction * arctanTable[i]
        }

        return {
            cos: x0 / SCALE * k,
            sin: y0 / SCALE * k,
            theta: angle / SCALE
        }
    }

    function cordic_rotate2(x: number, y: number, angle: number) {
        angle = Math.round(angle * SCALE)
        //如果大于45度，让向量旋转90度
        // 如果当angle为50时，应该从圆的90度位置逆时针旋转
        let x0 = BigInt(Math.round(x * SCALE))
        let y0 = BigInt(Math.round(y * SCALE))
        while (angle > PI_4) {
            angle -= PI_2 // 如果大于45度，让向量从+90度位置开始旋转向逆时针旋转

            let temp = x0
            x0 = -y0
            y0 = temp
        }
        while (angle < -PI_4) {
            angle += PI_2
            let temp = x0
            x0 = y0
            y0 = -temp
        }
        for (let i = 0, b = 1n; i < TABLE_LENGTH; b <<= 1n, i++) {
            let direction = angle >= 0 ? 1 : -1
            let tan = BigInt(i)

            let v1 = (x0) >> tan
            let v2 = (y0) >> tan

            if (direction > 0) {
                x0 = x0 - v2
                y0 = v1 + y0
            } else {
                x0 = x0 + v2
                y0 = -v1 + y0
            }
            angle -= arctanTable[i] * direction
        }
        x = Number((x0 + 256n)) / SCALE * k
        y = Number((y0 + 256n)) / SCALE * k
        return {
            cos: x,
            sin: y
        }
    }


    function cordic_rotate3(x: number, y: number, angle: number) {
        //如果大于45度，让向量旋转90度
        // 如果当angle为50时，应该从圆的90度位置逆时针旋转
        let x0 = x
        let y0 = y
        angle = Math.round(angle * SCALE)
        while (angle > PI_4) {
            angle -= PI_2 // 如果大于45度，让向量从+90度位置开始旋转向逆时针旋转

            let temp = x0
            x0 = -y0
            y0 = temp
        }
        while (angle < -PI_4) {
            angle += PI_2
            let temp = x0
            x0 = y0
            y0 = -temp
        }
        for (let i = 0; i < TABLE_LENGTH; i++) {
            let direction = angle >= 0 ? 1 : -1
            let tan = tanTable[i]

            let v1 = x0 * tan
            let v2 = y0 * tan

            if (direction > 0) {
                x0 = x0 - v2
                y0 = v1 + y0
            } else {
                x0 = x0 + v2
                y0 = -v1 + y0
            }
            angle -= arctanTable[i] * direction
        }
        x = x0 * k
        y = y0 * k
        return {
            cos: x,
            sin: y
        }
    }
    function cos(angle: number) {
        return cordic_rotate(1, 0, angle).cos
    }
    function sin(angle: number) {
        return cordic_rotate(0, 1, angle).sin
    }
    function tan(angle: number) {
        const { cos, sin } = cordic_rotate(1, 0, angle)
        return sin / cos
    }
    window.math = {
        cos,
        sin,
        tan,
        cordic_rotate
    }
    /* the Cordic shrink factor 0.858785336480436 * 2^32 */
    const XCG_FT_TRIG_SCALE = 0xDBD95B16
    //console.log('arctanTable',arctanTable.reduce((a,b)=>a+b,0)/SCALE)
    //console.log('TABLE_LENGTH',arctanTable,Math.acos(k)*RADIANS_TO_DEGREES*SCALE*1024)
    //console.log('k',k,'k2',1/k2*SCALE,'XCG_FT_TRIG_SCALE',XCG_FT_TRIG_SCALE)
    console.log('k', k * Math.pow(2, 32), 'RADIANS_TO_DEGREES', RADIANS_TO_DEGREES)
    for (let i = 0; i < 360; i += 30) {
        const { cos } = cordic_rotate2(1, 0, i)
        // console.log('angle',i,Math.abs(cos-Math.cos(i*DEGREES_TO_RADIANS)))
        console.log(i, '-cos1', cos, 'cos2', Math.cos(i * DEGREES_TO_RADIANS))

    }
}



