import { SCALAR_NEARLY_ZERO } from "./path/scalar";

export class Num{
    static create(value:number=0):Num{
        return new Num(value)
    }
    static new(value:number=0):Num{
        return new Num(value)
    }

    _value:number;
    constructor(value:number=0) {
        this._value=value
    }
    get value(){
        return this._value
    }
    set value(v){
        this._value=v
    }
    set(value:number):Num{
        this._value=value
        return this
    }
    min(value:number):Num{
        if(value<this._value){
            return this.set(value)
        }
        return this
    }
    max(value:number):Num{
        if(value>this._value){
            return this.set(value)
        }
        return this
    }

    add(value:number):Num{
        // 将传入的value与当前对象的value相加
        // 然后调用set方法设置新的值
        return this.set(this.value+value)
    }
    /**
     * 从当前值中减去给定值并返回结果。
     *
     * @param value 要减去的值
     * @returns 减去给定值后的结果
     */
    sub(value:number):Num{
        return this.set(this.value-value)
    }
    div(value:number):Num{
        return this.set(this.value/value)
    }
    multiply(value:number):Num{
        return this.set(this.value*value)
    }
    abs(){
        return this.set(Math.abs(this.value))
    }
    floor(){
        return this.set(Math.floor(this.value))
    }
    round(){
        return this.set(Math.round(this.value))
    }
    clamp(min:number,max:number):Num{
        return this.set(Math.min(max,Math.max(this._value,min)))
    }
    clamp01(){
        return this.clamp(0,0) 
    }
    trunc(){
        return this.set(Math.trunc(this._value))
    }
    bound(min:number,max:number):Num{
        return this.set(Math.min(max,Math.max(this._value,min)))
    }
    cos(){
        return this.set(Math.cos(this._value))
    }
    acos(){
        return this.set(Math.acos(this._value))
    }
    ave(other:number){
        return this.set((this._value+other)*0.5)
    }
    sqr(){
        return this.set(this._value*this._value)
    }
    half(){
        return this.set(this.value*0.5)
    }
    invert(){
        return this.set(1/this._value)
    }
    checkedSub(value:number):Num{
        if(this._value>=value){
            return this.set(this._value-value)
        }
        return this;
    }
    checkedMultiply(value:number):Num{
        if(this._value>=0){
            return this.set(this._value*value)
        }
        return this;
    }
    sqrt(){
        return this.set(Math.sqrt(this._value))
    }
    square(){
        return this.set(this._value*this._value)
    }
    pow(value:number):Num{
        return this.set(Math.pow(this._value,value))
    }
    log(value:number):Num{
        return this.set(Math.log(this._value)/Math.log(value))
    }
    isZero(){
        return this._value===0
    }
    isFinite(){
        return Number.isFinite(this._value)
    }
    is_nearly_equal(other:number){
      return  (this.value-other)<=SCALAR_NEARLY_ZERO
    }
    is_nearly_zero(){
        return this.is_nearly_zero_within_tolerance(SCALAR_NEARLY_ZERO)
    }
    is_nearly_zero_within_tolerance(tolerance=1e-6){
        return Math.abs(this._value)<tolerance
    }
    almost_dequal_ulps(other:number){
        const ULPS_EPSILON: i32 = 16;
       // let a_bits = f32_as_2s_compliment(self);
       // let b_bits = f32_as_2s_compliment(other);
        // Find the difference in ULPs.
       // a_bits < b_bits + ULPS_EPSILON && b_bits < a_bits + ULPS_EPSILON
    }
    checked_mul(rhs:number){
        
    }
    equals(value:number):boolean{
        return this._value===value
    }
    equalsEpsilon(value:number,epsilon=0.0001):boolean{
        return Math.abs(this._value-value)<epsilon
    }
    toString(){
        return this._value.toString()
    }
}