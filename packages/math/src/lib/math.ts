export const clamp=(value:number,min:number,max:number)=>{
    return Math.min(Math.max(value, min), max);
}
export const clamp01=(value:number)=>{
    return clamp(value,0,1);
}
// Helper functions to simulate left shifts
export function left_shift(n: number, bits: number): number {
    return n * Math.pow(2, bits);
}

export function left_shift64(n: number, bits: number): number {
    return n * Math.pow(2, bits);
}
export const bound=(value:number,min:number,max:number)=>{
    return Math.min(Math.max(value, min), max);
}

// Skia cites http://www.machinedlearnings.com/2011/06/fast-approximate-logarithm-exponential.html
export function approx_powf(x: f32, y: f32):f32 {
    return Math.pow(x,y)
}

