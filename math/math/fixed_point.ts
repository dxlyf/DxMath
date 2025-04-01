

export type int26_6 = number
export type int52_12 = bigint
export type f32 = number
export type int24_8 = number
export type int32 = number
export class Int26_6 {
  static ONE = 1 << 6
  static SHIFT = 6
  static DECIMAL = (1 << 6) - 1
  static HALF = (1 << 6) / 2
  static fromF32(value: f32) {
    return new this(Math.round(value * this.ONE))
  }
  static fromInt32(value: int32) {
    return new this(value << this.SHIFT)
  }
  static from(value: int26_6) {
    return new this(value)
  }
  static add(a: int26_6, b: int26_6) {
    return a + b
  }
  static sub(a: int26_6, b: int26_6) {
    return a - b
  }
  static mul(a: int26_6, b: int26_6) {
    return (a * b) >> this.SHIFT
  }
  static div(a: int26_6, b: int26_6) {
    return (a << this.SHIFT) / b
  }
  static floor(value: int26_6) {
    return Math.trunc(value / this.ONE)
  }
  static ceil(value: int26_6) {
    // 0x3f 63
    return Math.ceil((value + this.DECIMAL) / this.ONE)
  }
  static round(value: int26_6) {
    return Math.trunc((value + this.HALF) >> this.SHIFT)
  }
  static toFloat(value: int26_6) {
    return value / this.ONE
  }
  static toRoundInt64(value: int26_6) {
    return BigInt(Math.round(value / this.ONE))
  }
  static toInt64(value: int26_6) {
    return BigInt(Math.trunc(value / this.ONE))
  }
  value: int26_6;
  constructor(value: int26_6) {
    this.value = value
  }
  copy(source: Int26_6) {
    this.value = source.value
    return this
  }
  clone() {
    return (this.constructor as typeof Int26_6).from(this.value)
  }
  set(value: int26_6) {
    return Int26_6.from(value)
  }
  floor(){
    return this.set(this.value>>Int26_6.SHIFT)
  }
  ceil(){
    return this.set((this.value + Int26_6.DECIMAL)>> Int26_6.SHIFT)
  }
  round(){
    return this.set((this.value + Int26_6.HALF) >> Int26_6.SHIFT)
  }
  add(other: Int26_6) {
    return this.set(this.value + other.value)
  }
  sub(other: Int26_6) {
    return this.set(this.value - other.value)
  }
  mul(other: Int26_6) {
    return this.set((this.value * other.value) >> Int26_6.SHIFT)
  }
  div(other: Int26_6) {
    return this.set((this.value << Int26_6.SHIFT) / other.value)
  }
  toFloat() {
    return this.value / Int26_6.ONE
  }
}

export class Point26_6 {
  static default() {
    return this.from(0, 0)
  }
  static fromF32(x: f32, y: f32) {
    return new this(
      Int26_6.fromF32(x).value,
      Int26_6.fromF32(y).value
    )
  }
  static fromInt26_6(x: Int26_6, y: Int26_6) {
    return new this(x.value, y.value)
  }
  static from(x: int26_6, y: int26_6) {
    return new this(x >> 0, y >> 0)
  }
  x: int26_6
  y: int26_6
  constructor(x: int26_6, y: int26_6) {
    this.x = x
    this.y = y
  }
  copy(source: Point26_6) {
    this.x = source.x
    this.y = source.y
    return this
  }
  clone() {
    return Point26_6.from(this.x, this.y)
  }
  set(x: int26_6, y: int26_6) {
    return Point26_6.from(x, y)
  }
  add(other: Point26_6) {
    return this.set(Int26_6.add(this.x, other.x), Int26_6.add(this.y, other.y))
  }
  sub(other: Point26_6) {
    return this.set(Int26_6.sub(this.x, other.x), Int26_6.sub(this.y, other.y))
  }
  mul(other: Point26_6) {
    return this.set(Int26_6.mul(this.x, other.x), Int26_6.mul(this.y, other.y))
  }
  multiplyScalar(value: int26_6) {
    return this.set(Int26_6.mul(this.x, value), Int26_6.mul(this.y, value))
  }

  div(other: Point26_6) {
    return this.set(Int26_6.div(this.x, other.x), Int26_6.div(this.y, other.y))
  }
  dot(other: Point26_6) {
    return Int26_6.mul(this.x, other.x) + Int26_6.mul(this.y, other.y)
  }
  length() {
    return Math.sqrt(this.dot(this))
  }
  toFloatX() {
    return Int26_6.toFloat(this.x)
  }
  toFloatY() {
    return Int26_6.toFloat(this.y)
  }
  toBigintX() {
    return BigInt(this.x)
  }
  toBigintY() {
    return BigInt(this.y)
  }
  toInt64X() {
    return Int26_6.toInt64(this.x)
  }
  toInt64Y() {
    return Int26_6.toInt64(this.y)
  }
  toInt64RoundX() {
    return Int26_6.toRoundInt64(this.x)
  }
  toInt64RoundY() {
    return Int26_6.toRoundInt64(this.y)
  }
}



export class Int24_8 {
  static ONE = 1 << 8
  static SHIFT = 8
  static fromF32(value: f32) {
    return new this(Math.round(value * this.ONE))
  }
  static from(value: int24_8) {
    return new this(value)
  }
  value: int24_8;
  constructor(value: int24_8) {
    this.value = value
  }
  copy(source: Int24_8) {
    this.value = source.value
    return this
  }
  clone() {
    return (this.constructor as typeof Int24_8).from(this.value)
  }
  set(value: int24_8) {
    return Int24_8.from(value)
  }
  add(other: Int24_8) {
    return this.set(this.value + other.value)
  }
  sub(other: Int24_8) {
    return this.set(this.value - other.value)
  }
  mul(other: Int24_8) {
    return this.set((this.value * other.value) >> Int24_8.SHIFT)
  }
  div(other: Int24_8) {
    return this.set((this.value << Int24_8.SHIFT) / other.value)
  }
  toFloat() {
    return this.value / Int24_8.ONE
  }
}



export class Int52_12 {
  static ONE = BigInt(1 << 12)
  static SHIFT = BigInt(12)
  static fromF32(value: f32) {
    return new this(BigInt(Math.round(value * Number(this.ONE))))
  }
  static from(value: int52_12) {
    return new this(value)
  }
  static add(a: int52_12, b: int52_12) {
    return a + b
  }
  static sub(a: int52_12, b: int52_12) {
    return a - b
  }
  static mul(a: int52_12, b: int52_12) {
    return (a * b) >> this.SHIFT
  }
  static div(a: int52_12, b: int52_12) {
    return (a << this.SHIFT) / b
  }
  static toFloat(value: int52_12) {
    return value / this.ONE
  }

  static toRoundInt64(value: int52_12) {
    return BigInt(Math.round(Number(value / this.ONE)))
  }
  static toInt64(value: int52_12) {
    return BigInt(Math.trunc(Number(value / this.ONE)))
  }
  value: int52_12;
  constructor(value: int52_12) {
    this.value = value
  }
  copy(source: Int52_12) {
    this.value = source.value
    return this
  }
  clone() {
    return (this.constructor as typeof Int52_12).from(this.value)
  }
  set(value: int52_12) {
    return Int52_12.from(value)
  }
  add(other: Int52_12) {
    return this.set(this.value + other.value)
  }
  sub(other: Int52_12) {
    return this.set(this.value - other.value)
  }
  mul(other: Int52_12) {
    return this.set((this.value * other.value) >> Int52_12.SHIFT)
  }
  div(other: Int52_12) {
    return this.set((this.value << Int52_12.SHIFT) / other.value)
  }
  toFloat() {
    return this.value / Int52_12.ONE
  }
}




export class Point52_12 {
  static fromF32(x: f32, y: f32) {
    return new this(
      Int52_12.fromF32(x).value,
      Int52_12.fromF32(y).value
    )
  }
  static fromInt52_12(x: Int52_12, y: Int52_12) {
    return new this(x.value, y.value)
  }

  static from(x: int52_12, y: int52_12) {
    return new this(x >> 0n, y >> 0n)
  }
  x: int52_12
  y: int52_12
  constructor(x: int52_12, y: int52_12) {
    this.x = x
    this.y = y
  }
  copy(source: Point52_12) {
    this.x = source.x
    this.y = source.y
    return this
  }
  clone() {
    return Point52_12.from(this.x, this.y)
  }
  set(x: int52_12, y: int52_12) {
    return Point52_12.from(x, y)
  }
  add(other: Point52_12) {
    return this.set(Int52_12.add(this.x, other.x), Int52_12.add(this.y, other.y))
  }
  sub(other: Point52_12) {
    return this.set(Int52_12.sub(this.x, other.x), Int52_12.sub(this.y, other.y))
  }
  mul(other: Point52_12) {
    return this.set(Int52_12.mul(this.x, other.x), Int52_12.mul(this.y, other.y))
  }
  div(other: Point52_12) {
    return this.set(Int52_12.div(this.x, other.x), Int52_12.div(this.y, other.y))
  }
  dot(other: Point52_12) {
    return Int52_12.mul(this.x, other.x) + Int52_12.mul(this.y, other.y)
  }
  length() {
    return Math.sqrt(Number(this.dot(this)))
  }
  toFloatX() {
    return Int52_12.toFloat(this.x)
  }
  toFloatY() {
    return Int52_12.toFloat(this.y)
  }
  toInt64X() {
    return Int52_12.toInt64(this.x)
  }
  toInt64Y() {
    return Int52_12.toInt64(this.y)
  }
}

