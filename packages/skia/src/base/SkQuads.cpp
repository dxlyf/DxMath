/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */
#include "src/base/SkQuads.h"

#include "include/private/base/SkFloatingPoint.h"

#include <cmath>

//求解 0 = M *x + B。如果 M 为 0，则无解，除非 B 也为 0，
//在这种情况下，有无限个解，所以我们只返回其中的 1 个。
static int solve_linear(const double M, const double B, double solution[2]) {
    if (sk_double_nearly_zero(M)) {
        solution[0] = 0;
        if (sk_double_nearly_zero(B)) {
            return 1;
        }
        return 0;
    }
    solution[0] = -B / M;
    if (!std::isfinite(solution[0])) {
        return 0;
    }
    return 1;
}

//当二次方程的A系数接近0时，可能会出现浮点误差
//这是由于计算一个非常大的根而产生的。在这些情况下，我们宁愿
//精确到一个较小的根，所以当 A 是时我们有这个任意截止值
//与 B 相比确实很小或很小。
static bool close_to_linear(double A, double B) {
    if (sk_double_nearly_zero(B)) {
        return sk_double_nearly_zero(A);
    }
    // This is a different threshold (tighter) than the close_to_a_quadratic in SkCubics.cpp
    // because the SkQuads::RootsReal gives better answers for longer as A/B -> 0.
    return std::abs(A / B) < 1.0e-16;
}

int SkQuads::RootsReal(const double A, const double B, const double C, double solution[2]) {
    if (close_to_linear(A, B)) {
        return solve_linear(B, C, solution);
    }
    // If A is zero (e.g. B was nan and thus close_to_linear was false), we will
    // temporarily have infinities rolling about, but will catch that when checking
    // p2 - q.
    const double p = sk_ieee_double_divide(B, 2 * A);
    const double q = sk_ieee_double_divide(C, A);
    /* normal form: x^2 + px + q = 0 */
    const double p2 = p * p;
    if (!std::isfinite(p2 - q) ||
        (!sk_double_nearly_zero(p2 - q) && p2 < q)) {
        return 0;
    }
    double sqrt_D = 0;
    if (p2 > q) {
        sqrt_D = sqrt(p2 - q);
    }
    solution[0] = sqrt_D - p;
    solution[1] = -sqrt_D - p;
    if (sk_double_nearly_zero(sqrt_D) ||
        sk_doubles_nearly_equal_ulps(solution[0], solution[1])) {
        return 1;
    }
    return 2;
}
