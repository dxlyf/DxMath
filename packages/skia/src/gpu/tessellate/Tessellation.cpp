/*
 * Copyright 2021 Google LLC.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#include "src/gpu/tessellate/Tessellation.h"

#include "include/core/SkPath.h"
#include "src/base/SkUtils.h"
#include "src/core/SkGeometry.h"
#include "src/core/SkPathPriv.h"
#include "src/gpu/BufferWriter.h"
#include "src/gpu/tessellate/CullTest.h"
#include "src/gpu/tessellate/MiddleOutPolygonTriangulator.h"
#include "src/gpu/tessellate/WangsFormula.h"

using namespace skia_private;

namespace skgpu::tess {

namespace {

using float2 = skvx::float2;
using float4 = skvx::float4;

//该值仅保护我们免于因 fp32 精度而陷入无限递归
//问题。从数学上讲，每条曲线都应在 O(log N) 内减少为可管理的可见部分
//Chops，其中 N 是其控制点的大小。
//
//但是，为了定义保护上限，立方体可以进入或退出视口多达 6 个
//次。因此，我们可能需要将曲线细化（通过 T=.5 处的二分搜索斩波）最多 6 次。
//
//此外，在 T=.5 处切割立方体可能只会将其长度减少 1/8 (.5^3)，因此我们可能需要
//最多 6 次砍伐，以便将长度减少 1/2。
constexpr static int kMaxChopsPerCurve = 128/*magnitude of +fp32_max - -fp32_max*/ *
                                         6/*max number of chops to reduce the length by half*/ *
                                         6/*max number of viewport boundary crosses*/;

//写入一条新路径，根据需要进行切割，这样就没有动词需要比
//kMaxTessellationSegmentsPerCurve。完全在视口之外的曲线被展平为
//行。
class PathChopper {
public:
    PathChopper(float tessellationPrecision, const SkMatrix& matrix, const SkRect& viewport)
            : fTessellationPrecision(tessellationPrecision)
            , fCullTest(viewport, matrix)
            , fVectorXform(matrix) {
        fPath.setIsVolatile(true);
    }

    SkPath path() const { return fPath; }

    void moveTo(SkPoint p) { fPath.moveTo(p); }
    void lineTo(const SkPoint p[2]) { fPath.lineTo(p[1]); }
    void close() { fPath.close(); }

    void quadTo(const SkPoint quad[3]) {
        SkASSERT(fPointStack.empty());
        // Use a heap stack to recursively chop the quad into manageable, on-screen segments.
        fPointStack.push_back_n(3, quad);
        int numChops = 0;
        while (!fPointStack.empty()) {
            const SkPoint* p = fPointStack.end() - 3;
            if (!fCullTest.areVisible3(p)) {
                fPath.lineTo(p[2]);
            } else {
                float n4 = wangs_formula::quadratic_p4(fTessellationPrecision, p, fVectorXform);
                if (n4 > kMaxSegmentsPerCurve_p4 && numChops < kMaxChopsPerCurve) {
                    SkPoint chops[5];
                    SkChopQuadAtHalf(p, chops);
                    fPointStack.pop_back_n(3);
                    fPointStack.push_back_n(3, chops+2);
                    fPointStack.push_back_n(3, chops);
                    ++numChops;
                    continue;
                }
                fPath.quadTo(p[1], p[2]);
            }
            fPointStack.pop_back_n(3);
        }
    }

    void conicTo(const SkPoint conic[3], float weight) {
        SkASSERT(fPointStack.empty());
        SkASSERT(fWeightStack.empty());
        // Use a heap stack to recursively chop the conic into manageable, on-screen segments.
        fPointStack.push_back_n(3, conic);
        fWeightStack.push_back(weight);
        int numChops = 0;
        while (!fPointStack.empty()) {
            const SkPoint* p = fPointStack.end() - 3;
            float w = fWeightStack.back();
            if (!fCullTest.areVisible3(p)) {
                fPath.lineTo(p[2]);
            } else {
                float n2 = wangs_formula::conic_p2(fTessellationPrecision, p, w, fVectorXform);
                if (n2 > kMaxSegmentsPerCurve_p2 && numChops < kMaxChopsPerCurve) {
                    SkConic chops[2];
                    if (!SkConic(p,w).chopAt(.5, chops)) {
                        SkPoint line[2] = {p[0], p[2]};
                        this->lineTo(line);
                        continue;
                    }
                    fPointStack.pop_back_n(3);
                    fWeightStack.pop_back();
                    fPointStack.push_back_n(3, chops[1].fPts);
                    fWeightStack.push_back(chops[1].fW);
                    fPointStack.push_back_n(3, chops[0].fPts);
                    fWeightStack.push_back(chops[0].fW);
                    ++numChops;
                    continue;
                }
                fPath.conicTo(p[1], p[2], w);
            }
            fPointStack.pop_back_n(3);
            fWeightStack.pop_back();
        }
        SkASSERT(fWeightStack.empty());
    }

    void cubicTo(const SkPoint cubic[4]) {
        SkASSERT(fPointStack.empty());
        // Use a heap stack to recursively chop the cubic into manageable, on-screen segments.
        fPointStack.push_back_n(4, cubic);
        int numChops = 0;
        while (!fPointStack.empty()) {
            SkPoint* p = fPointStack.end() - 4;
            if (!fCullTest.areVisible4(p)) {
                fPath.lineTo(p[3]);
            } else {
                float n4 = wangs_formula::cubic_p4(fTessellationPrecision, p, fVectorXform);
                if (n4 > kMaxSegmentsPerCurve_p4 && numChops < kMaxChopsPerCurve) {
                    SkPoint chops[7];
                    SkChopCubicAtHalf(p, chops);
                    fPointStack.pop_back_n(4);
                    fPointStack.push_back_n(4, chops+3);
                    fPointStack.push_back_n(4, chops);
                    ++numChops;
                    continue;
                }
                fPath.cubicTo(p[1], p[2], p[3]);
            }
            fPointStack.pop_back_n(4);
        }
    }

private:
    const float fTessellationPrecision;
    const CullTest fCullTest;
    const wangs_formula::VectorXform fVectorXform;
    SkPath fPath;

    // Used for stack-based recursion (instead of using the runtime stack).
    STArray<8, SkPoint> fPointStack;
    STArray<2, float> fWeightStack;
};

}  // namespace

SkPath PreChopPathCurves(float tessellationPrecision,
                         const SkPath& path,
                         const SkMatrix& matrix,
                         const SkRect& viewport) {
  //如果视口特别大，我们最终可能会用无限制的内存耗尽内存
    //印章数量。因此，我们要求视口足够易于管理，以便完全
    //包含的曲线可以以 kMaxTessellationSegmentsPerCurve 或更少的形式进行细分。 （任何较大的
    //无论如何，这些像素数量都无法容纳在内存中。）
    SkASSERT(wangs_formula::worst_case_cubic(
                     tessellationPrecision,
                     viewport.width(),
                     viewport.height()) <= kMaxSegmentsPerCurve);
    PathChopper chopper(tessellationPrecision, matrix, viewport);
    for (auto [verb, p, w] : SkPathPriv::Iterate(path)) {
        switch (verb) {
            case SkPathVerb::kMove:
                chopper.moveTo(p[0]);
                break;
            case SkPathVerb::kLine:
                chopper.lineTo(p);
                break;
            case SkPathVerb::kQuad:
                chopper.quadTo(p);
                break;
            case SkPathVerb::kConic:
                chopper.conicTo(p, *w);
                break;
            case SkPathVerb::kCubic:
                chopper.cubicTo(p);
                break;
            case SkPathVerb::kClose:
                chopper.close();
                break;
        }
    }
    return chopper.path();
}

int FindCubicConvex180Chops(const SkPoint pts[], float T[2], bool* areCusps) {
    SkASSERT(pts);
    SkASSERT(T);
    SkASSERT(areCusps);

    //如果砍头落在距 0 或 1 的“kEpsilon”距离内，则将其扔掉。切线变成
    //当我们砍得太靠近边界时不稳定。这是因为镶嵌
    //着色器不允许超过 2^10 个参数段，并且它们会捕捉开头和
    //在 0 和 1 处结束边缘。因此，如果我们超过拐点或 180 度旋转点
    //曲面细分段的一小部分，它只是被捕捉。
    constexpr static float kEpsilon = 1.f / (1 << 11);
    //“1 -2*kEpsilon”的浮点表示。
    constexpr static uint32_t kIEEE_one_minus_2_epsilon = (127 << 23) - 2 * (1 << (24 - 11));
//不幸的是，我们没有办法静态断言这一点，但我们可以运行时断言
    //kIEEE_one_minus_2_epsilon 位正确。
    SkASSERT(sk_bit_cast<float>(kIEEE_one_minus_2_epsilon) == 1 - 2*kEpsilon);

    float2 p0 = skvx::bit_pun<float2>(pts[0]);
    float2 p1 = skvx::bit_pun<float2>(pts[1]);
    float2 p2 = skvx::bit_pun<float2>(pts[2]);
    float2 p3 = skvx::bit_pun<float2>(pts[3]);

    // Find the cubic's power basis coefficients. These define the bezier curve as:
    //
    //                                    |T^3|
    //     Cubic(T) = x,y = |A  3B  3C| * |T^2| + P0
    //                      |.   .   .|   |T  |
    //
    // And the tangent direction (scaled by a uniform 1/3) will be:
    //
    //                                                 |T^2|
    //     Tangent_Direction(T) = dx,dy = |A  2B  C| * |T  |
    //                                    |.   .  .|   |1  |
    //
    float2 C = p1 - p0;
    float2 D = p2 - p1;
    float2 E = p3 - p0;
    float2 B = D - C;
    float2 A = -3*D + E;

    // Now find the cubic's inflection function. There are inflections where F' x F'' == 0.
    // We formulate this as a quadratic equation:  F' x F'' == aT^2 + bT + c == 0.
    // See: https://www.microsoft.com/en-us/research/wp-content/uploads/2005/01/p1000-loop.pdf
    // NOTE: We only need the roots, so a uniform scale factor does not affect the solution.
    float a = cross(A,B);
    float b = cross(A,C);
    float c = cross(B,C);
    float b_over_minus_2 = -.5f * b;
    float discr_over_4 = b_over_minus_2*b_over_minus_2 - a*c;

    // If -cuspThreshold <= discr_over_4 <= cuspThreshold, it means the two roots are within
    // kEpsilon of one another (in parametric space). This is close enough for our purposes to
    // consider them a single cusp.
    float cuspThreshold = a * (kEpsilon/2);
    cuspThreshold *= cuspThreshold;

    if (discr_over_4 < -cuspThreshold) {
        // The curve does not inflect or cusp. This means it might rotate more than 180 degrees
        // instead. Chop were rotation == 180 deg. (This is the 2nd root where the tangent is
        // parallel to tan0.)
        //
        //      Tangent_Direction(T) x tan0 == 0
        //      (AT^2 x tan0) + (2BT x tan0) + (C x tan0) == 0
        //      (A x C)T^2 + (2B x C)T + (C x C) == 0  [[because tan0 == P1 - P0 == C]]
        //      bT^2 + 2cT + 0 == 0  [[because A x C == b, B x C == c]]
        //      T = [0, -2c/b]
        //
        // NOTE: if C == 0, then C != tan0. But this is fine because the curve is definitely
        // convex-180 if any points are colocated, and T[0] will equal NaN which returns 0 chops.
        *areCusps = false;
        float root = sk_ieee_float_divide(c, b_over_minus_2);
        // Is "root" inside the range [kEpsilon, 1 - kEpsilon)?
        if (sk_bit_cast<uint32_t>(root - kEpsilon) < kIEEE_one_minus_2_epsilon) {
            T[0] = root;
            return 1;
        }
        return 0;
    }

    *areCusps = (discr_over_4 <= cuspThreshold);
    if (*areCusps) {
        // The two roots are close enough that we can consider them a single cusp.
        if (a != 0 || b_over_minus_2 != 0 || c != 0) {
            // Pick the average of both roots.
            float root = sk_ieee_float_divide(b_over_minus_2, a);
            // Is "root" inside the range [kEpsilon, 1 - kEpsilon)?
            if (sk_bit_cast<uint32_t>(root - kEpsilon) < kIEEE_one_minus_2_epsilon) {
                T[0] = root;
                return 1;
            }
            return 0;
        }

        //曲线是一条平坦的线。标准拐点函数无法检测平坦的尖点
        //行。通过搜索切线垂直于的点来查找尖点
        //tan0.这将找到任何尖点。
        //
        //     dot(tan0, Tangent_Direction(T)) == 0
        //
        //                         |T^2|
        //     tan0 * |A  2B  C| * |T  | == 0
        //            |.   .  .|   |1  |
        //
        float2 tan0 = skvx::if_then_else(C != 0, C, p2 - p0);
        a = dot(tan0, A);
        b_over_minus_2 = -dot(tan0, B);
        c = dot(tan0, C);
        discr_over_4 = std::max(b_over_minus_2*b_over_minus_2 - a*c, 0.f);
    }

    // Solve our quadratic equation to find where to chop. See the quadratic formula from
    // Numerical Recipes in C.
    float q = sqrtf(discr_over_4);
    q = copysignf(q, b_over_minus_2);
    q = q + b_over_minus_2;
    float2 roots = float2{q,c} / float2{a,q};

    auto inside = (roots > kEpsilon) & (roots < (1 - kEpsilon));
    if (inside[0]) {
        if (inside[1] && roots[0] != roots[1]) {
            if (roots[0] > roots[1]) {
                roots = skvx::shuffle<1,0>(roots);  // Sort.
            }
            roots.store(T);
            return 2;
        }
        T[0] = roots[0];
        return 1;
    }
    if (inside[1]) {
        T[0] = roots[1];
        return 1;
    }
    return 0;
}

}  // namespace skgpu::tess
