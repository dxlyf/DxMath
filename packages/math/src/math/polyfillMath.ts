// @ts-nocheck
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
        tanTable[i] = Math.pow(2, -i) // 1/2^i=Math.pow(2, -i)=tan
        arctanTable[i] = Math.atan(tanTable[i])
        // 1 / Math.sqrt(1 + Math.pow(2, -2 * i))=1/sqrt(1+tan^2)=cos
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



export const Hath = {
    // 常数
    E: 2.718281828459045,
    PI: 3.141592653589793,
    LN10: 2.302585092994046,
    LN2: 0.6931471805599453,
    LOG10E: 0.4342944819032518,
    LOG2E: 1.4426950408889634,
    SQRT1_2: 0.7071067811865476,
    SQRT2: 1.4142135623730951,
    myAtan2(y:number, x:number) {
        if (x > 0) {
            return Math.atan(y / x);
        } else if (x < 0 && y >= 0) {
            return Math.atan(y / x) + Math.PI;
        } else if (x < 0 && y < 0) {
            return Math.atan(y / x) - Math.PI;
        } else if (x === 0 && y > 0) {
            return Math.PI / 2;
        } else if (x === 0 && y < 0) {
            return -Math.PI / 2;
        } else { // x === 0 && y === 0
            return 0; // 或者 NaN
        }
    },
    atan3(y: number, x: number) {
        const sign = y >= 0 ? 1 : -1
        const len = Math.sqrt(x * x + y * y);
        const cos = Math.max(-1, Math.min(1, x / len))
        const angle = Math.acos(cos)
        return sign * angle

    },
    // 绝对值
    abs(x:number) {
        return x < 0 ? -x : x; // 返回x的绝对值
    },

    // 反余弦
    acos(x:number) {
        if (x < -1 || x > 1) return NaN; // 超出范围返回 NaN
        if (x === 1) return 0; // acos(1) = 0
        if (x === -1) return this.PI; // acos(-1) = π
        return this.PI / 2 - this.asin(x); // acos(x) = π/2 - asin(x)
    },

    // 反双曲余弦
    acosh(x:number) {
        if (x < 1) return NaN; // 反双曲余弦仅在 x >= 1 时定义
        return this.log(x + this.sqrt(x * x - 1)); // 使用 log 和 sqrt 计算
    },

    // 反正弦
    asin(x:number) {
        if (x < -1 || x > 1) return NaN; // 超出范围返回 NaN
        // cos^2+sin^2=1 
        // 1-sin^2=cos^2 
        // sqrt(cos^2)=cos
        // sin/cos=tan   atan(tan)=radian
        return this.atan(x / this.sqrt(1 - x * x)); // asin(x) = atan(x / sqrt(1 - x^2))
    },

    // 反双曲正弦
    asinh(x:number) {
        return this.log(x + this.sqrt(x * x + 1)); // 使用 log 和 sqrt 计算
    },

    // 反正切
    atan(x:number) {
        // 处理特殊情况
        if (x === Infinity) return this.PI / 2; // 正无穷大
        if (x === -Infinity) return -this.PI / 2; // 负无穷大
        if (x === 0) return 0; // 0

        // 使用分段方法
        if (x < 0) {
            return -this.atan(-x); // 利用奇偶性
        }

        if (x > 1) {
            // 使用 atan(x) = PI/2 - atan(1/x)
            // 1/tan=cos/sin=cot
            return this.PI / 2 - this.atan(1 / x);
        }

        // 使用泰勒级数近似
        let sum = 0;
        let term = x; // 第一个项是 x
        const nTerms = 20; // 增加近似的项数
        for (let n = 0; n < nTerms; n++) {
            sum += term / (2 * n + 1); // 计算每一项
            term *= -x * x; // 生成下一个项
        }

        return sum; // 返回反正切的近似值
    },

    // 反双曲正切
    atanh(x:number) {
        if (x <= -1 || x >= 1) return NaN; // 反双曲正切仅在 -1 < x < 1 时定义
        return 0.5 * this.log((1 + x) / (1 - x)); // 使用 log 计算
    },

    // 反正切，接受两个参数
    atan2(y:number, x:number) {
        if (x > 0) return this.atan(y / x); // 第一象限 和 第四象限
        if (x < 0 && y >= 0) return this.atan(y / x) + this.PI; // 第二象限
        if (x < 0 && y < 0) return this.atan(y / x) - this.PI; // 第三象限
        if (x === 0 && y > 0) return this.PI / 2; // y 轴正方向
        if (x === 0 && y < 0) return -this.PI / 2; // y 轴负方向
        return 0; // 当 x 和 y 都为 0
    },

    // 向上取整
    ceil(x:number) {
        return x % 1 === 0 ? x : (x < 0 ? this.floor(x) : this.floor(x) + 1); // 向上取整
    },

    // 立方根
    cbrt(x:number) {
        return x < 0 ? -this.pow(-x, 1 / 3) : this.pow(x, 1 / 3); // 处理负数
    },

    // e^x - 1
    expm1(x:number) {
        return this.exp(x) - 1; // 使用指数函数计算
    },

    // 计数前导零
    clz32(x:number) {
        return (x >>> 0).toString(2).length > 0 ? 32 - (x >>> 0).toString(2).length : 32; // 计算前导零
    },

    // 余弦
    cos(x:number) {
        return this.sin(x + this.PI / 2); // cos(x) = sin(x + π/2)
    },

    // 双曲余弦
    cosh(x:number) {
        return (this.exp(x) + this.exp(-x)) / 2; // 使用指数计算
    },

    // 指数
    exp(x) {
        let sum = 1; // e^0 = 1
        let term = 1; // 0! = 1
        for (let n = 1; n <= 10; n++) {
            term *= x / n; // term = x^n / n!
            sum += term; // 累加每一项
        }
        return sum; // 返回指数的近似值
    },

    // 向下取整
    floor(x) {
        return x % 1 === 0 ? x : (x < 0 ? (x | 0) : this.ceil(x) - 1); // 向下取整
    },

    // 浮点数近似
    fround(x) {
        return x; // 简单实现，实际应用中可以更复杂
    },

    // 欧几里得距离
    hypot(...args) {
        return this.sqrt(args.reduce((sum, val) => sum + this.pow(val, 2), 0)); // 计算距离
    },

    // 整数相乘
    imul(a, b) {
        return (a * b) | 0; // 使用位运算确保返回32位整数
    },

    // 对数
    log(x) {
        if (x <= 0) return NaN; // 不处理非正数
        let result = 0;
        let term = (x - 1) / (x + 1); // 使用（x-1）/(x+1)转换
        let termSquared = term * term; // 计算平方项
        for (let n = 0; n < 10; n++) {
            result += (1 / (2 * n + 1)) * this.pow(term, 2 * n + 1); // 计算对数的每一项
        }
        return 2 * result; // log(x) = 2 * Σ
    },

    // 自然对数 (1 + x)
    log1p(x) {
        return this.log(1 + x); // 使用 log 计算
    },

    // 以2为底的对数
    log2(x) {
        return this.log(x) / this.LN2; // 使用自然对数计算
    },

    // 以10为底的对数
    log10(x) {
        return this.log(x) / this.LN10; // 使用自然对数计算
    },

    // 最大值
    max(...args) {
        let maxValue = -Infinity;
        for (const value of args) {
            if (value > maxValue) {
                maxValue = value; // 查找最大值
            }
        }
        return maxValue; // 返回最大值
    },

    // 最小值
    min(...args) {
        let minValue = Infinity;
        for (const value of args) {
            if (value < minValue) {
                minValue = value; // 查找最小值
            }
        }
        return minValue; // 返回最小值
    },

    // 幂运算
    pow(base, exponent) {
        let result = 1;
        const positiveExponent = this.abs(exponent);
        for (let i = 0; i < positiveExponent; i++) {
            result *= base; // 计算幂
        }
        return exponent < 0 ? 1 / result : result; // 处理负指数
    },

    // 随机数
    random() {
        return Math.random(); // 可以改为自定义实现
    },

    // 四舍五入
    round(x) {
        return this.floor(x + 0.5); // 四舍五入
    },

    // 符号
    sign(x) {
        return x > 0 ? 1 : (x < 0 ? -1 : 0); // 返回符号
    },

    // 正弦
    sin(x) {
        let term = x;
        let sum = term;
        for (let i = 1; i <= 10; i++) {
            term *= -x * x / ((2 * i) * (2 * i + 1)); // 使用泰勒级数计算
            sum += term; // 累加每一项
        }
        return sum; // 返回正弦的近似值
    },

    // 双曲正弦
    sinh(x) {
        return (this.exp(x) - this.exp(-x)) / 2; // 使用指数计算
    },

    // 开平方
    sqrt(x) {
        if (x < 0) return NaN; // 不处理负数
        let result = x;
        let lastResult;
        do {
            lastResult = result;
            result = (result + x / result) / 2; // 巴比伦法
        } while (this.abs(result - lastResult) > 1e-10); // 迭代直到收敛
        return result; // 返回平方根
    },

    // 正切
    tan(x) {
        return this.sin(x) / this.cos(x); // 使用正弦和余弦计算
    },

    // 双曲正切
    tanh(x) {
        return (this.exp(x) - this.exp(-x)) / (this.exp(x) + this.exp(-x)); // 使用指数计算
    },

    // 截断
    trunc(x) {
        return x < 0 ? this.ceil(x) : this.floor(x); // 根据符号返回截断值
    },
};
export const MyMath = (function () {
    // 常量
    const PI = 3.141592653589793;
    const HALF_PI = PI / 2;
    const TWO_PI = PI * 2;
    const E = 2.718281828459045;


    // 绝对值
    function abs(x) {
        const num = Number(x);
        return num < 0 ? -num : num;
    }

    // 最大值
    function max(...args) {
        if (!args.length) return -Infinity;
        let maxVal = -Infinity;
        for (const arg of args) {
            const num = Number(arg);
            if (num !== num) return NaN; // NaN 判断
            if (num > maxVal || maxVal === -Infinity) maxVal = num;
        }
        return maxVal;
    }

    // 最小值
    function min(...args) {
        if (!args.length) return Infinity;
        let minVal = Infinity;
        for (const arg of args) {
            const num = Number(arg);
            if (num !== num) return NaN;
            if (num < minVal || minVal === Infinity) minVal = num;
        }
        return minVal;
    }

    // 向下取整
    function floor(x) {
        const num = Number(x);
        if (num !== num) return NaN;
        if (num === Infinity || num === -Infinity) return num;
        const remainder = num % 1;
        return remainder === 0 ? num : num > 0 ? num - remainder : num - (1 + remainder);
    }

    // 向上取整
    function ceil(x) {
        const num = Number(x);
        if (num !== num) return NaN;
        if (num === Infinity || num === -Infinity) return num;
        const remainder = num % 1;
        return remainder === 0 ? num : num > 0 ? num + (1 - remainder) : num - remainder;
    }

    // 四舍五入
    function round(x) {
        const num = Number(x);
        if (num !== num) return NaN;
        return num >= 0 ? floor(num + 0.5) : ceil(num - 0.5);
    }

    // 平方根（牛顿迭代法）
    function sqrt(x) {
        let guess = x / 2;
        let lastGuess;
        do {
            lastGuess = guess;
            guess = (guess + x / guess) / 2;
        } while (abs(lastGuess - guess) > 1e-15);
        return guess;
    }

    // 幂运算（仅处理整数指数）
    function pow(base, exponent) {
        let result = 1;
        for (let i = 0; i < abs(exponent); i++) result *= base;
        return exponent >= 0 ? result : 1 / result;
    }


    // --- 基础函数复用之前实现 ---
    // [abs(), max(), min(), floor(), ceil(), round(), sqrt(), pow() 等已存在]
    // ...（之前的基础函数实现）...

    // --------------------------
    //       三角函数
    // --------------------------

    // 正弦函数（泰勒展开）
    function sin(x) {
        let num = Number(x);
        if (isNaN(num)) return NaN;
        if (!isFinite(num)) return NaN;

        // 将角度归一化到 [-PI, PI]
        num = num % TWO_PI;
        if (num > PI) num -= TWO_PI;
        else if (num < -PI) num += TWO_PI;

        let term = num;
        let sum = term;
        const xSquared = num * num;
        let n = 1;

        do {
            term *= -xSquared / ((2 * n) * (2 * n + 1));
            sum += term;
            n++;
        } while (abs(term) > 1e-15);

        return sum;
    }

    // 余弦函数（泰勒展开）
    function cos(x) {
        let num = Number(x);
        if (isNaN(num)) return NaN;
        if (!isFinite(num)) return NaN;

        // 将角度归一化到 [-PI, PI]
        num = num % TWO_PI;
        if (num > PI) num -= TWO_PI;
        else if (num < -PI) num += TWO_PI;

        let term = 1;
        let sum = term;
        const xSquared = num * num;
        let n = 1;

        do {
            term *= -xSquared / ((2 * n - 1) * (2 * n));
            sum += term;
            n++;
        } while (abs(term) > 1e-15);

        return sum;
    }

    // 正切函数
    function tan(x) {
        const c = cos(x);
        if (c === 0) return x > 0 ? Infinity : -Infinity;
        return sin(x) / c;
    }

    // --------------------------
    //       反三角函数
    // --------------------------

    // 反正弦（基于反正切实现）
    function asin(x) {
        const num = Number(x);
        if (num < -1 || num > 1) return NaN;
        if (num === -1) return -HALF_PI;
        if (num === 1) return HALF_PI;
        return atan(num / sqrt(1 - num * num));
    }

    // 反余弦（基于反正弦实现）
    function acos(x) {
        const num = Number(x);
        if (num < -1 || num > 1) return NaN;
        return HALF_PI - asin(num);
    }

    // 反正切（泰勒展开 + 范围扩展）
    function atan(x) {
        const num = Number(x);
        if (isNaN(num)) return NaN;
        if (num === 0) return 0;
        if (num === Infinity) return HALF_PI;
        if (num === -Infinity) return -HALF_PI;

        let inverted = false;
        let value = num;
        if (abs(value) > 1) {
            inverted = true;
            value = 1 / value;
        }

        let term = value;
        let sum = term;
        const xSquared = value * value;
        let n = 1;

        do {
            term *= -xSquared;
            sum += term / (2 * n + 1);
            n++;
        } while (abs(term / (2 * n + 1)) > 1e-15);

        return inverted ?
            (value > 0 ? HALF_PI - sum : -HALF_PI - sum) :
            sum;
    }

    // 象限敏感的反正切
    function atan2(y, x) {
        const numY = Number(y);
        const numX = Number(x);
        if (isNaN(numY) || isNaN(numX)) return NaN;

        if (numX > 0) return atan(numY / numX);
        if (numX < 0) {
            return numY >= 0 ?
                atan(numY / numX) + PI :
                atan(numY / numX) - PI;
        }
        // x === 0 的情况
        return numY > 0 ? HALF_PI : numY < 0 ? -HALF_PI : 0;
    }


    return {
        PI,
        E,
        abs,
        max,
        min,
        floor,
        ceil,
        round,
        sqrt,
        pow,
        // ...（之前的常量和函数）...
        sin,
        cos,
        tan,
        asin,
        acos,
        atan,
        atan2
    };
})();
