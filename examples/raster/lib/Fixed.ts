
export type Int_26_6 = number;
export function int26_6_from_float(value:number):Int_26_6{
    return Math.round(value*64)
}
export function int26_6_to_float(value:Int_26_6):number{
    return value/64
}
export function in26_6_mul(a:Int_26_6,b:Int_26_6):Int_26_6{
    return Math.round((a*b)/64)
}
