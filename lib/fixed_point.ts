// Copyright 2006 The Android Open Source Project
// Copyright 2020 Yevhenii Reizner
//
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { left_shift } from "./math";

// Skia uses fixed points pretty chaotically, therefore we cannot use
// strongly typed wrappers. Which is unfortunate.

// A 26.6 fixed point.
export type FDot6 = number;

// A 24.8 fixed point.
export type FDot8 = number;

// A 16.16 fixed point.
export type FDot16 = number;

export namespace fdot6 {
    export const ONE: FDot6 = 64;

    export function from_i32(n: number): FDot6 {
        // Assuming n is within i32 range
        return n << 6;
    }

    export function from_f32(n: number): FDot6 {
        return Math.floor(n * 64);
    }

    export function floor(n: FDot6): FDot6 {
        return n >> 6;
    }

    export function ceil(n: FDot6): FDot6 {
        return (n + 63) >> 6;
    }

    export function round(n: FDot6): FDot6 {
        return (n + 32) >> 6;
    }

    export function to_fdot16(n: FDot6): FDot16 {
        // Assuming left_shift is implemented
        return left_shift(n, 10);
    }

    export function div(a: FDot6, b: FDot6): FDot16 {
        if (a >= -32768 && a <= 32767 && b >= -32768 && b <= 32767) {
            return (a << 16) / b;
        } else {
            return fdot16.div(a, b);
        }
    }

    export function can_convert_to_fdot16(n: FDot6): boolean {
        const max_dot6 = Math.pow(2, 31) >> (16 - 6);
        return Math.abs(n) <= max_dot6;
    }

    export function small_scale(value: number, dot6: FDot6): number {
        return ((value * dot6) >> 6) as number;
    }
}

export namespace fdot8 {
    export function from_fdot16(x: FDot16): FDot8 {
        return (x + 0x80) >> 8;
    }
}

export namespace fdot16 {
    export const HALF: FDot16 = (1 << 16) / 2;
    export const ONE: FDot16 = 1 << 16;

    export function from_f32(x: number): FDot16 {
        return Math.floor(x * ONE);
    }

    export function floor_to_i32(x: FDot16): number {
        return x >> 16;
    }

    export function ceil_to_i32(x: FDot16): number {
        return (x + ONE - 1) >> 16;
    }

    export function round_to_i32(x: FDot16): number {
        return (x + HALF) >> 16;
    }

    export function mul(a: FDot16, b: FDot16): FDot16 {
        return ((a * b) / ONE) as FDot16;
    }

    export function div(numer: FDot6, denom: FDot6): FDot16 {
        const v = (numer * Math.pow(2, 16)) / denom;
        const n = Math.max(Math.min(v, Math.pow(2, 31) - 1), -Math.pow(2, 31));
        return n as FDot16;
    }

    export function fast_div(a: FDot6, b: FDot6): FDot16 {
        return (a * Math.pow(2, 16)) / b;
    }
}

