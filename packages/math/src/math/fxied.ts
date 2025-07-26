type int26_6 = number
type int24_8 = number
export class Int26_6 {
    static ONE = 1 << 6
    static MASK = (1 << 6) - 1
    static HALF = 1 << 5
    static SHIFT = 6
    static fromFloat(value: number) {
        return Math.round(value * this.ONE)
    }
    static fromInt(value: int26_6) {
        return value << this.SHIFT
    }
    static toFloat(value: int26_6) {
        return value / this.ONE
    }
    static toRound(value: int26_6) {
        return (value + this.HALF) >> this.SHIFT
    }
    static toFloor(value: int26_6) {
        return (value) >> this.SHIFT
    }
    static toCeil(value: int26_6) {
        return (value + this.MASK) >> this.SHIFT
    }
    static round(value: int26_6) {
        return (value + this.HALF) & ~this.MASK
    }
    static floor(value: int26_6) {
        return value & ~this.MASK;
    }
    static ceil(value: int26_6) {
        return (value + this.MASK) & ~this.MASK
    }
    static fract(value: int26_6) {
        return value & this.MASK
    }

    static add(a: int26_6, b: int26_6) {
        return a + b
    }
    static sub(a: int26_6, b: int26_6) {
        return a - b
    }
    static mul_floor(a: int26_6, b: int26_6) {
        return (a * b) >> this.SHIFT
    }
    static div_floor(a: int26_6, b: int26_6) {
        return (a / b) << this.SHIFT
    }
    static mul_round(a: int26_6, b: int26_6) {
        return this.round(a * b) >> this.SHIFT
    }
    static div_round(a: int26_6, b: int26_6) {
        return this.round(a / b) << this.SHIFT
    }
}
export class Int24_8 {
    static ONE = 1 << 8
    static MASK = (1 << 8) - 1
    static HALF = 1 << 7
    static SHIFT = 8
    static fromFloat(value: number) {
        return Math.round(value * this.ONE)
    }
    static fromInt(value: int24_8) {
        return value << this.SHIFT
    }
    static toFloat(value: int24_8) {
        return value / this.ONE
    }
    static toRound(value: int24_8) {
        return (value + this.HALF) >> this.SHIFT
    }
    static toFloor(value: int24_8) {
        return (value) >> this.SHIFT
    }
    static toCeil(value: int24_8) {
        return (value + this.MASK) >> this.SHIFT
    }
    static round(value: int24_8) {
        return (value + this.HALF) & ~this.MASK
    }
    static floor(value: int24_8) {
        return value & ~this.MASK;
    }
    static ceil(value: int24_8) {
        return (value + this.MASK) & ~this.MASK
    }
    static fract(value: int24_8) {
        return value & this.MASK
    }

    static add(a: int24_8, b: int24_8) {
        return a + b
    }
    static sub(a: int24_8, b: int24_8) {
        return a - b
    }
    static mul_floor(a: int24_8, b: int24_8) {
        return (a * b) >> this.SHIFT
    }
    static div_floor(a: int24_8, b: int24_8) {
        return Math.floor((a << this.SHIFT) / b)
    }
    static mul_round(a: int24_8, b: int24_8) {
        return this.round((a * b) >> this.SHIFT)
    }
    static div_round(a: int24_8, b: int24_8) {
        return this.fromFloat(a / b) << this.SHIFT
    }
}
