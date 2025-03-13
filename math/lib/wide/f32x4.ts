// Copyright 2020 Yevhenii Reizner
//
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Based on https://github.com/Lokathor/wide (Zlib)

export class F32x4 {
    values:Float32Array=new Float32Array(4)
    constructor(values:Float32Array|number[]) {
        if (values.length !== 4) {
            throw new Error("F32x4 must have exactly 4 values");
        }
        this.values.set(values);
    }

    static splat(n:number) {
        return new F32x4([n, n, n, n]);
    }

    static from(array:number[]) {
        return new F32x4(array);
    }

    floor() {
        return new F32x4(this.values.map(x => Math.floor(x)));
    }

    abs() {
        return new F32x4(this.values.map(x => Math.abs(x)));
    }

    max(rhs:F32x4) {
        return new F32x4([
            Math.max(this.values[0], rhs.values[0]),
            Math.max(this.values[1], rhs.values[1]),
            Math.max(this.values[2], rhs.values[2]),
            Math.max(this.values[3], rhs.values[3]),
        ]);
    }

    min(rhs:F32x4) {
        return new F32x4([
            Math.min(this.values[0], rhs.values[0]),
            Math.min(this.values[1], rhs.values[1]),
            Math.min(this.values[2], rhs.values[2]),
            Math.min(this.values[3], rhs.values[3]),
        ]);
    }

    cmp_eq(rhs:F32x4) {
        return new F32x4(this.values.map((x, i) => x === rhs.values[i] ? 1.0 : 0.0));
    }

    cmp_ne(rhs:F32x4) {
        return new F32x4(this.values.map((x, i) => x !== rhs.values[i] ? 1.0 : 0.0));
    }

    cmp_ge(rhs:F32x4) {
        return new F32x4(this.values.map((x, i) => x >= rhs.values[i] ? 1.0 : 0.0));
    }

    cmp_gt(rhs:F32x4) {
        return new F32x4(this.values.map((x, i) => x > rhs.values[i] ? 1.0 : 0.0));
    }

    cmp_le(rhs:F32x4) {
        return new F32x4(this.values.map((x, i) => x <= rhs.values[i] ? 1.0 : 0.0));
    }

    cmp_lt(rhs:F32x4) {
        return new F32x4(this.values.map((x, i) => x < rhs.values[i] ? 1.0 : 0.0));
    }

    blend(t:F32x4, f:F32x4) {
        return new F32x4(this.values.map((x, i) => x !== 0.0 ? t.values[i] : f.values[i]));
    }

    round() {
        return new F32x4(this.values.map(x => Math.round(x)));
    }

    round_int() {
        return new Int32Array(this.values.map(x => Math.round(x)));
    }

    trunc_int() {
        return new Int32Array(this.values.map(x => Math.trunc(x)));
    }

    recip_fast() {
        return new F32x4(this.values.map(x => 1.0 / x));
    }

    recip_sqrt() {
        return new F32x4(this.values.map(x => 1.0 / Math.sqrt(x)));
    }

    sqrt() {
        return new F32x4(this.values.map(x => Math.sqrt(x)));
    }

    add(rhs:F32x4) {
        return new F32x4([
            this.values[0] + rhs.values[0],
            this.values[1] + rhs.values[1],
            this.values[2] + rhs.values[2],
            this.values[3] + rhs.values[3],
        ]);
    }

    sub(rhs:F32x4) {
        return new F32x4([
            this.values[0] - rhs.values[0],
            this.values[1] - rhs.values[1],
            this.values[2] - rhs.values[2],
            this.values[3] - rhs.values[3],
        ]);
    }
    mul(rhs:F32x4){
        return new F32x4([
            this.values[0]* rhs.values[0],
            this.values[1]* rhs.values[1],
            this.values[2]* rhs.values[2],
            this.values[3]* rhs.values[3],
        ]);
    }
    div(rhs:F32x4){
        return new F32x4([
            this.values[0]/rhs.values[0],
            this.values[1]/rhs.values[1],
            this.values[2]/rhs.values[2],
            this.values[3]/rhs.values[3],
        ]);
    }
}

