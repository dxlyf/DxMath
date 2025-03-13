import { F32x4 } from "./f32x4";

export class F32x8 {
    static default(){
        return this.splat(0)
    }
    x:F32x4
    y:F32x4
    constructor(x:F32x4, y:F32x4) {
        if (!(x instanceof F32x4) || !(y instanceof F32x4)) {
            throw new Error("Both arguments must be instances of F32x4");
        }
        this.x = x; // First 4 f32 values
        this.y = y; // Next 4 f32 values
    }

    // Create an F32x8 with all elements set to the same value
    static splat(n:number) {
        return new F32x8(F32x4.splat(n), F32x4.splat(n));
    }

    // Create an F32x8 from an array of 8 f32 values
    static from(array:number[]) {
        if (array.length !== 8) {
            throw new Error("F32x8 must have exactly 8 values");
        }
        return new F32x8(
            F32x4.from(array.slice(0, 4)),
            F32x4.from(array.slice(4, 8))
        );
    }

    // Convert F32x8 to an array of 8 f32 values
    toArray() {
        return [...this.x.values, ...this.y.values];
    }

    // Element-wise addition
    add(rhs:F32x8) {
        return new F32x8(this.x.add(rhs.x), this.y.add(rhs.y));
    }

    // Element-wise subtraction
    sub(rhs:F32x8) {
        return new F32x8(this.x.sub(rhs.x), this.y.sub(rhs.y));
    }

    // Element-wise multiplication
    mul(rhs:F32x8) {
        return new F32x8(this.x.mul(rhs.x), this.y.mul(rhs.y));
    }

    // Element-wise division
    div(rhs:F32x8) {
        return new F32x8(this.x.div(rhs.x), this.y.div(rhs.y));
    }

    // Element-wise floor
    floor() {
        return new F32x8(this.x.floor(), this.y.floor());
    }

    // Element-wise absolute value
    abs() {
        return new F32x8(this.x.abs(), this.y.abs());
    }

    // Element-wise maximum
    max(rhs:F32x8) {
        return new F32x8(this.x.max(rhs.x), this.y.max(rhs.y));
    }

    // Element-wise minimum
    min(rhs:F32x8) {
        return new F32x8(this.x.min(rhs.x), this.y.min(rhs.y));
    }

    // Element-wise equality comparison
    cmp_eq(rhs:F32x8) {
        return new F32x8(this.x.cmp_eq(rhs.x), this.y.cmp_eq(rhs.y));
    }

    // Element-wise inequality comparison
    cmp_ne(rhs:F32x8) {
        return new F32x8(this.x.cmp_ne(rhs.x), this.y.cmp_ne(rhs.y));
    }

    // Element-wise greater-than-or-equal comparison
    cmp_ge(rhs:F32x8) {
        return new F32x8(this.x.cmp_ge(rhs.x), this.y.cmp_ge(rhs.y));
    }

    // Element-wise greater-than comparison
    cmp_gt(rhs:F32x8) {
        return new F32x8(this.x.cmp_gt(rhs.x), this.y.cmp_gt(rhs.y));
    }

    // Element-wise less-than-or-equal comparison
    cmp_le(rhs:F32x8) {
        return new F32x8(this.x.cmp_le(rhs.x), this.y.cmp_le(rhs.y));
    }

    // Element-wise less-than comparison
    cmp_lt(rhs:F32x8) {
        return new F32x8(this.x.cmp_lt(rhs.x), this.y.cmp_lt(rhs.y));
    }

    // Blend two F32x8 vectors based on a mask
    blend(t:F32x8, f:F32x8) {
        return new F32x8(this.x.blend(t.x, f.x), this.y.blend(t.y, f.y));
    }

    // Round each element to the nearest integer
    round() {
        return new F32x8(this.x.round(), this.y.round());
    }

    // Truncate each element to an integer
    trunc_int() {
        return [this.x.trunc_int(), this.y.trunc_int()];
    }

    // Fast reciprocal of each element
    recip_fast() {
        return new F32x8(this.x.recip_fast(), this.y.recip_fast());
    }

    // Reciprocal square root of each element
    recip_sqrt() {
        return new F32x8(this.x.recip_sqrt(), this.y.recip_sqrt());
    }

    // Square root of each element
    sqrt() {
        return new F32x8(this.x.sqrt(), this.y.sqrt());
    }
}

