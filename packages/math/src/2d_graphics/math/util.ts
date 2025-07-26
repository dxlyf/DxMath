import {Vector2} from './Vector2'
// Math functions

export function sqrt(n:number):number{
    return Math.sqrt(n);
}
export function pow(base:number,exponent:number):number{
    return Math.pow(base,exponent);
}

export function abs(n:number):number{
    return Math.abs(n);
}
export function min(n1:number,n2:number):number{
    return Math.min(n1,n2);
}
export function max(n1:number,n2:number):number{
    return Math.max(n1,n2);
}
export function random(min:number,max:number):number{
    return Math.random() * (max - min) + min;
}
export function derivative(fn:(x:number)=>number,x:number,dx:number=1e-4):number{
    return (fn(x + dx) - fn(x-dx)) / (2 * dx);
}

export function factorial(n:number):number{
    if(n < 0) return -1;
    let result = 1;
    for(let i = 2;i <= n;i++){
        result *= i;
    }
    return result;
}
// 组合 C(n,r) = n! / (r!(n-r)!)

export function nCr(n:number,r:number):number{
    if(r > n) return 0;
    let result = 1;
    for(let i = 1;i <= r;i++){
        result *= (n - i + 1)/i;
    }
    return result;
}
// 排列 P(n,r) = n! / (n-r)!
export function nPr(n:number,r:number):number{
    if(r > n) return 0;
    let result = 1;
    for(let i = 1;i <= r;i++){
        result *= (n - i + 1);
    }
    return result;
}
/**
 * 
 * @param value 映射值
 * @param inMin 定义域domain 输入
 * @param inMax 
 * @param outMin 值域range 输出
 * @param outMax 
 * @returns 
 */
export function map(value:number,inMin:number,inMax:number,outMin:number,outMax:number){
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

export function clamp(value:number,min:number,max:number){
    return Math.min(Math.max(value,min),max);
}
export function lerp(start:number,end:number,t:number){
    return start*(1-t) + end*t;
}
export function inverseLerp(start:number,end:number,value:number){
    return (value - start) / (end - start);
}
// 平滑插值
export function smoothstep(start:number,end:number,amount:number){
    const t = clamp((amount - start) / (end - start),0,1);
    return t * t * (3 - 2 * t);
}
export function easeInOut(start:number,end:number,amount:number){
    const t = clamp((amount - start) / (end - start),0,1);
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}
export function easeIn(start:number,end:number,amount:number){
    const t = clamp((amount - start) / (end - start),0,1);
    return t * t * t;
}
export function easeOut(start:number,end:number,amount:number){
    const t = clamp((amount - start) / (end - start),0,1); 
    return (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

