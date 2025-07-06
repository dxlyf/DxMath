export const FIXED_SCALE=1<<16
export const DBL_EPSILON=1e-6
export const min=(a:number, b:number) => Math.min(a, b)
export const max=(a:number, b:number) => Math.max(a, b)
export const clamp=(a:number, min:number, max:number) => Math.min(Math.max(a, min), max)

export const toBigInt=(x:number|bigint)=>{
    if(typeof x==='number'){
        return BigInt(x>>>0)
    }
    return x;
}

export const getAlpha=(c:any)=>{
    c=toBigInt(c)
    return Number(c>>24n)
};
export const div255=(x:any)=>{
    x=toBigInt(x)
    return Number(((x) + ((x) >> 8n) + 0x80n) >> 8n)
}   
export const byteMul=(x:any,a:any)=>{
    x=toBigInt(x)
    a=toBigInt(a)
    return Number((((((x >> 8n) & 0x00ff00ffn) * a) & 0xff00ff00n) + ((((x & 0x00ff00ffn) * (a)) >> 8n) & 0x00ff00ffn)))
}

export const sqrt=(x:number)=>Math.sqrt(x)

export const alignSize=(size:number)=>((size + 7) & ~7)
export const FT_COORD=(x:number)=>(x*64)>>>0