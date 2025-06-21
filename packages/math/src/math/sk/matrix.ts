
import { Point, Point3D } from "./point"
import { Rect } from "./rect";
import { SK_Scalar1, SK_ScalarNearlyZero, SkDegreesToRadians, SkDoubleToScalar, SkRadiansToDegrees, SkScalarAbs, SkScalarCosSnapToZero, SkScalarHalf, SkScalarInvert, SkScalarIsFinite, SkScalarNearlyEqual, SkScalarNearlyZero, SkScalarSinSnapToZero, SkScalarSqrt, SkScalarSquare } from "./scalar";
import { FloatPoint } from "./util";

function sort_as_rect(ltrb: FloatPoint) {
    let rblt = FloatPoint.make(4).setElements([ltrb.elements[2], ltrb.elements[3], ltrb.elements[0], ltrb.elements[1]]);
    let min = ltrb.clone().min(rblt);
    let max = ltrb.clone().max(rblt);
    // We can extract either pair [0,1] or [2,3] from min and max and be correct, but on
    // ARM this sequence generates the fastest (a single instruction).
    return FloatPoint.make(4).setElements([min[2], min[3], max[0], max[1]]);
}
function sk_ieee_float_divide(numer:number, denom:number) {
    return numer / denom;
}
function checkForZero(x:number) {
    return x * x == 0;
}
function sk_ieee_double_divide(numer:number, denom:number) {
    return numer / denom;
}
function only_scale_and_translate(mask:number) {
    return 0 == (mask & (kAffine_Mask | kPerspective_Mask));
}
function is_degenerate_2x2(scaleX:number, skewX:number,
    skewY:number, scaleY:number) {
    let perp_dot = scaleX * scaleY - skewX * skewY;
    return SkScalarNearlyZero(perp_dot, SK_ScalarNearlyZero * SK_ScalarNearlyZero);
}
function SkSignBitTo2sCompliment(x:number) {
    if (x < 0) {
        x &= 0x7FFFFFFF;
        x = -x;
    }
    return x;
}
function SkScalarAs2sCompliment(v:number) {
    return v
}
function SkFloat2Bits(x:number) {
    // SkFloatIntUnion data;
    // data.fFloat = x;
    // return data.fSignBitInt;
}
function sk_inv_determinant(mat:ArrayLike<number>,  isPerspective:int) {
    let det = sk_determinant(mat, isPerspective);

    // Since the determinant is on the order of the cube of the matrix members,
    // compare to the cube of the default nearly-zero constant (although an
    // estimate of the condition number would be better if it wasn't so expensive).
    if (SkScalarNearlyZero(sk_double_to_float(det),
                           SK_ScalarNearlyZero * SK_ScalarNearlyZero * SK_ScalarNearlyZero)) {
        return 0;
    }
    return 1.0 / det;
}
function sk_double_to_float(x:number) {
    return x
}
function sk_determinant(mat:ArrayLike<number>,  isPerspective:int) {
    if (isPerspective) {
        return mat[kMScaleX] *
                    dcross(mat[kMScaleY], mat[kMPersp2],
                           mat[kMTransY], mat[kMPersp1])
                    +
                    mat[kMSkewX]  *
                    dcross(mat[kMTransY], mat[kMPersp0],
                           mat[kMSkewY],  mat[kMPersp2])
                    +
                    mat[kMTransX] *
                    dcross(mat[kMSkewY],  mat[kMPersp1],
                           mat[kMScaleY], mat[kMPersp0]);
    } else {
        return dcross(mat[kMScaleX], mat[kMScaleY],
                      mat[kMSkewX], mat[kMSkewY]);
    }
}

function scross_dscale(a:number, b:number,c:number,d:number,scale:number) {
    return SkDoubleToScalar(scross(a, b, c, d) * scale);
}



function dcross_dscale(a:number, b:number,c:number,d:number,scale:number) {
return SkDoubleToScalar(dcross(a, b, c, d) * scale);
}
/** \enum Matrix.TypeMask
        Enum of bit fields for mask returned by getType().
 enum skmatrix :: typemask
        getType（）返回的蒙版的枚举字段。
        用于确定Skmatrix的复杂性，以优化性能。
    */
enum TypeMask {
    kIdentity_Mask = 0,    //!< identity SkMatrix; all bits clear
    kTranslate_Mask = 0x01, //!< translation SkMatrix
    kScale_Mask = 0x02, //!< scale SkMatrix
    kAffine_Mask = 0x04, //!< skew or rotate SkMatrix
    kPerspective_Mask = 0x08, //!< perspective SkMatrix
};

const kIdentity_Mask = TypeMask.kIdentity_Mask;
const kTranslate_Mask = TypeMask.kTranslate_Mask
const kScale_Mask = TypeMask.kScale_Mask
const kAffine_Mask = TypeMask.kAffine_Mask
const kPerspective_Mask = TypeMask.kPerspective_Mask

const kScalar1Int = 0x3f800000;
enum MinMaxOrBoth {
    kMin_MinMaxOrBoth,
    kMax_MinMaxOrBoth,
    kBoth_MinMaxOrBoth
};
const kMin_MinMaxOrBoth = MinMaxOrBoth.kMin_MinMaxOrBoth;
const kMax_MinMaxOrBoth = MinMaxOrBoth.kMax_MinMaxOrBoth;
const kBoth_MinMaxOrBoth = MinMaxOrBoth.kBoth_MinMaxOrBoth;
const kTranslate_Shift = 0
const kScale_Shift = 1
const kAffine_Shift = 2
const kPerspective_Shift = 3
const kRectStaysRect_Shift = 4
function get_scale_factor(MIN_MAX_OR_BOTH: MinMaxOrBoth, typeMask: TypeMask, m: number[] | Float32Array, results: number[] | Float32Array) {
    if (typeMask & kPerspective_Mask) {
        return false;
    }
    if (kIdentity_Mask == typeMask) {
        results[0] = SK_Scalar1;
        if (kBoth_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[1] = SK_Scalar1;
        }
        return true;
    }
    if (!(typeMask & kAffine_Mask)) {
        if (kMin_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[0] = Math.min(SkScalarAbs(m[kMScaleX]),
                Math.abs(m[kMScaleY]));
        } else if (kMax_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[0] = Math.max(SkScalarAbs(m[kMScaleX]),
                SkScalarAbs(m[kMScaleY]));
        } else {
            results[0] = SkScalarAbs(m[kMScaleX]);
            results[1] = SkScalarAbs(m[kMScaleY]);
            if (results[0] > results[1]) {
                let tmp = results[0]
                results[0] = results[1]
                results[1] = tmp
            }
        }
        return true;
    }
    // ignore the translation part of the matrix, just look at 2x2 portion.
    // compute singular values, take largest or smallest abs value.
    // [a b; b c] = A^T*A
    let a = sdot(m[kMScaleX], m[kMScaleX],
        m[kMSkewY], m[kMSkewY]);
    let b = sdot(m[kMScaleX], m[kMSkewX],
        m[kMScaleY], m[kMSkewY]);
    let c = sdot(m[kMSkewX], m[kMSkewX],
        m[kMScaleY], m[kMScaleY]);
    // eigenvalues of A^T*A are the squared singular values of A.
    // characteristic equation is det((A^T*A) - l*I) = 0
    // l^2 - (a + c)l + (ac-b^2)
    // solve using quadratic equation (divisor is non-zero since l^2 has 1 coeff
    // and roots are guaranteed to be pos and real).
    let bSqd = b * b;
    // if upper left 2x2 is orthogonal save some math
    if (bSqd <= SK_ScalarNearlyZero * SK_ScalarNearlyZero) {
        if (kMin_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[0] = Math.min(a, c);
        } else if (kMax_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[0] = Math.max(a, c);
        } else {
            results[0] = a;
            results[1] = c;
            if (results[0] > results[1]) {
                let tmp = results[0]
                results[0] = results[1]
                results[1] = tmp
            }
        }
    } else {
        let aminusc = a - c;
        let apluscdiv2 = SkScalarHalf(a + c);
        let x = SkScalarHalf(SkScalarSqrt(aminusc * aminusc + 4 * bSqd));
        if (kMin_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[0] = apluscdiv2 - x;
        } else if (kMax_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
            results[0] = apluscdiv2 + x;
        } else {
            results[0] = apluscdiv2 - x;
            results[1] = apluscdiv2 + x;
        }
    }
    if (!SkScalarIsFinite(results[0])) {
        return false;
    }
    // Due to the floating polet inaccuracy, there might be an error in a, b, c
    // calculated by sdot, further deepened by subsequent arithmetic operations
    // on them. Therefore, we allow and cap the nearly-zero negative values.
    if (results[0] < 0) {
        results[0] = 0;
    }
    results[0] = SkScalarSqrt(results[0]);
    if (kBoth_MinMaxOrBoth == MIN_MAX_OR_BOTH) {
        if (!SkScalarIsFinite(results[1])) {
            return false;
        }
        if (results[1] < 0) {
            results[1] = 0;
        }
        results[1] = SkScalarSqrt(results[1]);
    }
    return true;
}
function muladdmul(a:number, b:number, c:number, d:number) {
    return (a * b + c * d);
}

function rowcol3(row:ArrayLike<number>, col:ArrayLike<number>) {
    return row[0] * col[0] + row[1] * col[3] + row[2] * col[6];
}

function sdot(a:number, b:number, c:number, d:number, e?:number, f?:number) {
    if (e !== undefined) {
        return a * b + c * d + e * f!;
    }
    return a * b + c * d;
}

function scross(a:number, b:number, c:number, d:number) {
    return a * b - c * d;
}
function dcross(a:number, b:number, c:number, d:number) {
    return a * b - c * d;
}
const kRectStaysRect_Mask = 0x10;

/** Set if the perspective bit is valid even though the rest of
    the matrix is Unknown.
*/
const kOnlyPerspectiveValid_Mask = 0x40;

const kUnknown_Mask = 0x80;

const kORableMasks = kTranslate_Mask |
    kScale_Mask |
    kAffine_Mask |
    kPerspective_Mask;

const kAllMasks = kTranslate_Mask |
    kScale_Mask |
    kAffine_Mask |
    kPerspective_Mask |
    kRectStaysRect_Mask;
/** SkMatrix organizes its values in row-major order. These members correspond to
    each value in SkMatrix.
*/
const kMScaleX = 0; //!< horizontal scale factor
const kMSkewX = 1; //!< horizontal skew factor
const kMTransX = 2; //!< horizontal translation
const kMSkewY = 3; //!< vertical skew factor
const kMScaleY = 4; //!< vertical scale factor
const kMTransY = 5; //!< vertical translation
const kMPersp0 = 6; //!< input x perspective factor
const kMPersp1 = 7; //!< input y perspective factor
const kMPersp2 = 8; //!< perspective bias

/** Affine arrays are in column-major order to match the matrix used by
    PDF and XPS.
*/
const kAScaleX = 0; //!< horizontal scale factor
const kASkewY = 1; //!< vertical skew factor
const kASkewX = 2; //!< horizontal skew factor
const kAScaleY = 3; //!< vertical scale factor
const kATransX = 4; //!< horizontal translation
const kATransY = 5; //!< vertical translation
/** \enum Matrix.ScaleToFit
    ScaleToFit describes how SkMatrix is constructed to map one SkRect to another.
    ScaleToFit may allow SkMatrix to have unequal horizontal and vertical scaling,
    or may restrict SkMatrix to square scaling. If restricted, ScaleToFit specifies
    how SkMatrix maps to the side or center of the destination SkRect.
*/
enum ScaleToFit {
    kFill_ScaleToFit,   //!< scales in x and y to fill destination SkRect
    kStart_ScaleToFit,  //!< scales and aligns to left and top
    kCenter_ScaleToFit, //!< scales and aligns to center
    kEnd_ScaleToFit,    //!< scales and aligns to right and bottom
};
const kFill_ScaleToFit = ScaleToFit.kFill_ScaleToFit;
const kStart_ScaleToFit = ScaleToFit.kStart_ScaleToFit;
const kCenter_ScaleToFit = ScaleToFit.kCenter_ScaleToFit;
const kEnd_ScaleToFit = ScaleToFit.kEnd_ScaleToFit;


/**
 *  When we transform points through a matrix containing perspective (the bottom row is something
 *  other than 0,0,1), the bruteforce math can produce confusing results (since we might divide
 *  by 0, or a negative w value). By default, methods that map rects and paths will apply
 *  perspective clipping, but this can be changed by specifying kYes to those methods.
 */
enum SkApplyPerspectiveClip {
    kNo,    //!< Don't pre-clip the geometry before applying the (perspective) matrix
    kYes,   //!< Do pre-clip the geometry before applying the (perspective) matrix
};
const kNo = SkApplyPerspectiveClip.kNo;
const kYes = SkApplyPerspectiveClip.kYes;



export class Matrix {
    static identity() {
        const instance = this.fromRows(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        )
        instance.fTypeMask = TypeMask.kIdentity_Mask | kRectStaysRect_Mask
        return instance
    }
    static fromRows(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number) {
        return new this([m11, m12, m13,
            m21, m22, m23,
            m31, m32, m33
        ])
    }
    fMat: Float32Array = new Float32Array(9)
    fTypeMask: TypeMask = TypeMask.kIdentity_Mask
    constructor(elements: number[] | Float32Array) {
        this.fMat.set(elements)
    }

    /** Sets SkMatrix to scale by (sx, sy). Returned matrix is:

            | sx  0  0 |
            |  0 sy  0 |
            |  0  0  1 |

        @param sx  horizontal scale factor
        @param sy  vertical scale factor
        @return    SkMatrix with scale
    */
    static Scale(sx:number, sy:number) {
        let m = this.identity();
        m.setScale(sx, sy);
        return m;
    }

    /** Sets SkMatrix to translate by (dx, dy). Returned matrix is:

            | 1 0 dx |
            | 0 1 dy |
            | 0 0  1 |

        @param dx  horizontal translation
        @param dy  vertical translation
        @return    SkMatrix with translation
    */
    static Translate(dx:number, dy:number) {
        let m = this.identity();
        m.setTranslate(dx, dy);
        return m;
    }
    /** Sets SkMatrix to rotate by |deg| about a pivot polet at (0, 0).

        @param deg  rotation angle in degrees (positive rotates clockwise)
        @return     SkMatrix with rotation
    */
    static RotateDeg(deg:number, pt?: Point) {
        let m = this.identity();
        m.setRotate(deg, pt?.x,pt?.y);
        return m;
    }

    static RotateRad(rad:number) {
        return this.RotateDeg(SkRadiansToDegrees(rad));
    }

    /** Sets SkMatrix to skew by (kx, ky) about pivot polet (0, 0).

        @param kx  horizontal skew factor
        @param ky  vertical skew factor
        @return    SkMatrix with skew
    */
    static Skew(kx:number, ky:number) {
        let m = this.identity();
        m.setSkew(kx, ky);
        return m;
    }



    /** Returns SkMatrix set to scale and translate src to dst. ScaleToFit selects
        whether mapping completely fills dst or preserves the aspect ratio, and how to
        align src within dst. Returns the identity SkMatrix if src is empty. If dst is
        empty, returns SkMatrix set to:

            | 0 0 0 |
            | 0 0 0 |
            | 0 0 1 |

        @param src  SkRect to map from
        @param dst  SkRect to map to
        @param mode How to handle the mapping
        @return     SkMatrix mapping src to dst
    */
    static RectToRect(src: Rect, dst: Rect, mode = ScaleToFit.kFill_ScaleToFit) {
        return this.MakeRectToRect(src, dst, mode);
    }

    /** Sets SkMatrix to:

            | scaleX  skewX transX |
            |  skewY scaleY transY |
            |  pers0  pers1  pers2 |

        @param scaleX  horizontal scale factor
        @param skewX   horizontal skew factor
        @param transX  horizontal translation
        @param skewY   vertical skew factor
        @param scaleY  vertical scale factor
        @param transY  vertical translation
        @param pers0   input x-axis perspective factor
        @param pers1   input y-axis perspective factor
        @param pers2   perspective scale factor
        @return        SkMatrix constructed from parameters
    */
    static MakeAll(scaleX:number, skewX:number, transX:number,
        skewY:number, scaleY:number, transY:number,
        pers0:number, pers1:number, pers2:number) {
        let m = this.identity();
        m.setAll(scaleX, skewX, transX, skewY, scaleY, transY, pers0, pers1, pers2);
        return m;
    }

    setRows(m11: number, m12: number, m13: number, m21: number, m22: number, m23: number, m31: number, m32: number, m33: number, typeMask?: TypeMask) {
        if (typeMask !== undefined) {
            this.fTypeMask = typeMask
        }
        return this.fMat.set([m11, m12, m13,
            m21, m22, m23,
            m31, m32, m33
        ])

    }
    /** Returns a bit field describing the transformations the matrix may
        perform. The bit field is computed conservatively, so it may include
        false positives. For example, when kPerspective_Mask is set, all
        other bits are set.

        @return  kIdentity_Mask, or combinations of: kTranslate_Mask, kScale_Mask,
                 kAffine_Mask, kPerspective_Mask
    */
    getType() {
        if (this.fTypeMask & kUnknown_Mask) {
            this.fTypeMask = this.computeTypeMask();
        }
        // only return the public masks
        return (this.fTypeMask & 0xF);
    }

    /** Returns true if SkMatrix is identity.  Identity matrix is:

            | 1 0 0 |
            | 0 1 0 |
            | 0 0 1 |

        @return  true if SkMatrix has no effect
    */
    isIdentity() {
        return this.getType() == 0;
    }

    /** Returns true if SkMatrix at most scales and translates. SkMatrix may be identity,
        contain only scale elements, only translate elements, or both. SkMatrix form is:

            | scale-x    0    translate-x |
            |    0    scale-y translate-y |
            |    0       0         1      |

        @return  true if SkMatrix is identity; or scales, translates, or both
    */
    isScaleTranslate() {
        return !(this.getType() & ~(TypeMask.kScale_Mask | TypeMask.kTranslate_Mask));
    }

    /** Returns true if SkMatrix is identity, or translates. SkMatrix form is:

            | 1 0 translate-x |
            | 0 1 translate-y |
            | 0 0      1      |

        @return  true if SkMatrix is identity, or translates
    */
    isTranslate() { return !(this.getType() & ~(TypeMask.kTranslate_Mask)); }

    /** Returns true SkMatrix maps SkRect to another SkRect. If true, SkMatrix is identity,
        or scales, or rotates a multiple of 90 degrees, or mirrors on axes. In all
        cases, SkMatrix may also have translation. SkMatrix form is either:

            | scale-x    0    translate-x |
            |    0    scale-y translate-y |
            |    0       0         1      |

        or

            |    0     rotate-x translate-x |
            | rotate-y    0     translate-y |
            |    0        0          1      |

        for non-zero values of scale-x, scale-y, rotate-x, and rotate-y.

        Also called preservesAxisAlignment(); use the one that provides better inline
        documentation.

        @return  true if SkMatrix maps one SkRect into another
    */
    rectStaysRect() {
        if (this.fTypeMask & kUnknown_Mask) {
            this.fTypeMask = this.computeTypeMask();
        }
        return (this.fTypeMask & kRectStaysRect_Mask) != 0;
    }

    /** Returns true SkMatrix maps SkRect to another SkRect. If true, SkMatrix is identity,
        or scales, or rotates a multiple of 90 degrees, or mirrors on axes. In all
        cases, SkMatrix may also have translation. SkMatrix form is either:

            | scale-x    0    translate-x |
            |    0    scale-y translate-y |
            |    0       0         1      |

        or

            |    0     rotate-x translate-x |
            | rotate-y    0     translate-y |
            |    0        0          1      |

        for non-zero values of scale-x, scale-y, rotate-x, and rotate-y.

        Also called rectStaysRect(); use the one that provides better inline
        documentation.

        @return  true if SkMatrix maps one SkRect into another
    */
    preservesAxisAlignment() { return this.rectStaysRect(); }

    /** Returns true if the matrix contains perspective elements. SkMatrix form is:

            |       --            --              --          |
            |       --            --              --          |
            | perspective-x  perspective-y  perspective-scale |

        where perspective-x or perspective-y is non-zero, or perspective-scale is
        not one. All other elements may have any value.

        @return  true if SkMatrix is in most general form
    */
    hasPerspective() {
        return !!(this.getPerspectiveTypeMaskOnly() &
            TypeMask.kPerspective_Mask);
    }

    /** Returns true if SkMatrix contains only translation, rotation, reflection, and
        uniform scale.
        Returns false if SkMatrix contains different scales, skewing, perspective, or
        degenerate forms that collapse to a line or point.

        Describes that the SkMatrix makes rendering with and without the matrix are
        visually alike; a transformed circle remains a circle. Mathematically, this is
        referred to as similarity of a Euclidean space, or a similarity transformation.

        Preserves right angles, keeping the arms of the angle equal lengths.

        @param tol  to be deprecated
        @return     true if SkMatrix only rotates, uniformly scales, translates

        example: https://fiddle.skia.org/c/@Matrix_isSimilarity
    */
    isSimilarity(tol = SK_ScalarNearlyZero) {
        // if identity or translate matrix
        let mask = this.getType();
        if (mask <= TypeMask.kTranslate_Mask) {
            return true;
        }
        if (mask & TypeMask.kPerspective_Mask) {
            return false;
        }
        const fMat = this.fMat
        let mx = fMat[kMScaleX];
        let my = fMat[kMScaleY];
        // if no skew, can just compare scale factors
        if (!(mask & kAffine_Mask)) {
            return !SkScalarNearlyZero(mx) && SkScalarNearlyEqual(SkScalarAbs(mx), SkScalarAbs(my));
        }
        let sx = fMat[kMSkewX];
        let sy = fMat[kMSkewY];

        if (is_degenerate_2x2(mx, sx, sy, my)) {
            return false;
        }

        // upper 2x2 is rotation/reflection + uniform scale if basis vectors
        // are 90 degree rotations of each other
        return (SkScalarNearlyEqual(mx, my, tol) && SkScalarNearlyEqual(sx, -sy, tol))
            || (SkScalarNearlyEqual(mx, -my, tol) && SkScalarNearlyEqual(sx, sy, tol));
    };

    /** Returns true if SkMatrix contains only translation, rotation, reflection, and
        scale. Scale may differ along rotated axes.
        Returns false if SkMatrix skewing, perspective, or degenerate forms that collapse
        to a line or point.

        Preserves right angles, but not requiring that the arms of the angle
        retain equal lengths.

        @param tol  to be deprecated
        @return     true if SkMatrix only rotates, scales, translates

        example: https://fiddle.skia.org/c/@Matrix_preservesRightAngles
    */
    preservesRightAngles(tol = SK_ScalarNearlyZero) {
        let mask = this.getType();
        let fMat = this.fMat

        if (mask <= kTranslate_Mask) {
            // identity, translate and/or scale
            return true;
        }
        if (mask & kPerspective_Mask) {
            return false;
        }


        let mx = fMat[kMScaleX];
        let my = fMat[kMScaleY];
        let sx = fMat[kMSkewX];
        let sy = fMat[kMSkewY];

        if (is_degenerate_2x2(mx, sx, sy, my)) {
            return false;
        }

        // upper 2x2 is scale + rotation/reflection if basis vectors are orthogonal
        let vec = [Point.zero(), Point.zero()];
        vec[0].set(mx, sy);
        vec[1].set(sx, my);

        return SkScalarNearlyZero(vec[0].dot(vec[1]), SkScalarSquare(tol));
    };




    /** Returns one matrix value. Asserts if index is out of range and SK_DEBUG is
        defined.

        @param index  one of: kMScaleX, kMSkewX, kMTransX, kMSkewY, kMScaleY, kMTransY,
                      kMPersp0, kMPersp1, kMPersp2
        @return       value corresponding to index
    */
    get(index:number) {
        return this.fMat[index];
    }

    /** Returns one matrix value from a particular row/column. Asserts if index is out
        of range and SK_DEBUG is defined.

        @param r  matrix row to fetch
        @param c  matrix column to fetch
        @return   value at the given matrix position
    */
    rc(r:number, c:number) {
        return this.fMat[r * 3 + c];
    }

    /** Returns scale factor multiplied by x-axis input, contributing to x-axis output.
        With mapPoints(), scales SkPolet along the x-axis.

        @return  horizontal scale factor
    */
    getScaleX() { return this.fMat[kMScaleX]; }

    /** Returns scale factor multiplied by y-axis input, contributing to y-axis output.
        With mapPoints(), scales SkPolet along the y-axis.

        @return  vertical scale factor
    */
    getScaleY() { return this.fMat[kMScaleY]; }

    /** Returns scale factor multiplied by x-axis input, contributing to y-axis output.
        With mapPoints(), skews SkPolet along the y-axis.
        Skewing both axes can rotate SkPoint.

        @return  vertical skew factor
    */
    getSkewY() { return this.fMat[kMSkewY]; }

    /** Returns scale factor multiplied by y-axis input, contributing to x-axis output.
        With mapPoints(), skews SkPolet along the x-axis.
        Skewing both axes can rotate SkPoint.

        @return  horizontal scale factor
    */
    getSkewX() { return this.fMat[kMSkewX]; }

    /** Returns translation contributing to x-axis output.
        With mapPoints(), moves SkPolet along the x-axis.

        @return  horizontal translation factor
    */
    getTranslateX() { return this.fMat[kMTransX]; }

    /** Returns translation contributing to y-axis output.
        With mapPoints(), moves SkPolet along the y-axis.

        @return  vertical translation factor
    */
    getTranslateY() { return this.fMat[kMTransY]; }

    /** Returns factor scaling input x-axis relative to input y-axis.

        @return  input x-axis perspective factor
    */
    getPerspX() { return this.fMat[kMPersp0]; }

    /** Returns factor scaling input y-axis relative to input x-axis.

        @return  input y-axis perspective factor
    */
    getPerspY() { return this.fMat[kMPersp1]; }



    /** Sets SkMatrix value. Asserts if index is out of range and SK_DEBUG is
        defined. Safer than operator[]; internal cache is always maintained.
    
        @param index  one of: kMScaleX, kMSkewX, kMTransX, kMSkewY, kMScaleY, kMTransY,
                      kMPersp0, kMPersp1, kMPersp2
        @param value  scalar to store in SkMatrix
    */
    set(index:number, value:number) {

        this.fMat[index] = value;
        this.setTypeMask(kUnknown_Mask);
        return this;
    }

    /** Sets horizontal scale factor.
    
        @param v  horizontal scale factor to store
    */
    setScaleX(v:number) { return this.set(kMScaleX, v); }

    /** Sets vertical scale factor.
    
        @param v  vertical scale factor to store
    */
    setScaleY(v:number) { return this.set(kMScaleY, v); }

    /** Sets vertical skew factor.
    
        @param v  vertical skew factor to store
    */
    setSkewY(v: number) { return this.set(kMSkewY, v); }

    /** Sets horizontal skew factor.
    
        @param v  horizontal skew factor to store
    */
    setSkewX(v: number) { return this.set(kMSkewX, v); }

    /** Sets horizontal translation.
    
        @param v  horizontal translation to store
    */
    setTranslateX(v: number) { return this.set(kMTransX, v); }

    /** Sets vertical translation.
    
        @param v  vertical translation to store
    */
    setTranslateY(v: number) { return this.set(kMTransY, v); }

    /** Sets input x-axis perspective factor, which causes mapXY() to vary input x-axis values
        inversely proportional to input y-axis values.
    
        @param v  perspective factor
    */
    setPerspX(v: number) { return this.set(kMPersp0, v); }

    /** Sets input y-axis perspective factor, which causes mapXY() to vary input y-axis values
        inversely proportional to input x-axis values.
    
        @param v  perspective factor
    */
    setPerspY(v: number) { return this.set(kMPersp1, v); }

    /** Sets all values from parameters. Sets matrix to:
    
            | scaleX  skewX transX |
            |  skewY scaleY transY |
            | persp0 persp1 persp2 |
    
        @param scaleX  horizontal scale factor to store
        @param skewX   horizontal skew factor to store
        @param transX  horizontal translation to store
        @param skewY   vertical skew factor to store
        @param scaleY  vertical scale factor to store
        @param transY  vertical translation to store
        @param persp0  input x-axis values perspective factor to store
        @param persp1  input y-axis values perspective factor to store
        @param persp2  perspective scale factor to store
    */
    setAll(scaleX:number, skewX:number, transX:number,
        skewY:number, scaleY:number, transY:number,
        persp0:number, persp1:number, persp2:number) {
        this.fMat[kMScaleX] = scaleX;
        this.fMat[kMSkewX] = skewX;
        this.fMat[kMTransX] = transX;
        this.fMat[kMSkewY] = skewY;
        this.fMat[kMScaleY] = scaleY;
        this.fMat[kMTransY] = transY;
        this.fMat[kMPersp0] = persp0;
        this.fMat[kMPersp1] = persp1;
        this.fMat[kMPersp2] = persp2;
        this.setTypeMask(kUnknown_Mask);
        return this;
    }

    /** Copies nine scalar values contained by SkMatrix into buffer, in member value
        ascending order: kMScaleX, kMSkewX, kMTransX, kMSkewY, kMScaleY, kMTransY,
        kMPersp0, kMPersp1, kMPersp2.
    
        @param buffer  storage for nine scalar values
    */
    get9(buffer: number[] | Float32Array) {
        this.fMat.forEach((v, i) => buffer[i] = v);
        return this;
    }

    /** Sets SkMatrix to nine scalar values in buffer, in member value ascending order:
        kMScaleX, kMSkewX, kMTransX, kMSkewY, kMScaleY, kMTransY, kMPersp0, kMPersp1,
        kMPersp2.
    
        Sets matrix to:
    
            | buffer[0] buffer[1] buffer[2] |
            | buffer[3] buffer[4] buffer[5] |
            | buffer[6] buffer[7] buffer[8] |
    
        In the future, set9 followed by get9 may not return the same values. Since SkMatrix
        maps non-homogeneous coordinates, scaling all nine values produces an equivalent
        transformation, possibly improving precision.
    
        @param buffer  nine scalar values
    */
    set9(buffer: number[]) {
        this.fMat.set(buffer)
    }

    /** Sets SkMatrix to identity; which has no effect on mapped SkPoint. Sets SkMatrix to:
    
            | 1 0 0 |
            | 0 1 0 |
            | 0 0 1 |
    
        Also called setIdentity(); use the one that provides better inline
        documentation.
    */
    reset() {
        this.setRows(
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        )
    }

    /** Sets SkMatrix to identity; which has no effect on mapped SkPoint. Sets SkMatrix to:
    
            | 1 0 0 |
            | 0 1 0 |
            | 0 0 1 |
    
        Also called reset(); use the one that provides better inline
        documentation.
    */
    setIdentity() { return this.reset(); }

    /** Sets SkMatrix to translate by (dx, dy).
    
        @param dx  horizontal translation
        @param dy  vertical translation
    */
    setTranslate(dx:number, dy:number) {
        this.setRows(1, 0, dx,
            0, 1, dy,
            0, 0, 1,
            (dx != 0 || dy != 0) ? kTranslate_Mask | kRectStaysRect_Mask
                : kIdentity_Mask | kRectStaysRect_Mask);
    }
    setTranslatePoint(pt: Point) {
        this.setTranslate(pt.x, pt.y)
    }

    /** Sets SkMatrix to scale by sx and sy, about a pivot polet at (px, py).
        The pivot polet is unchanged when mapped with SkMatrix.
    
        @param sx  horizontal scale factor
        @param sy  vertical scale factor
        @param px  pivot on x-axis
        @param py  pivot on y-axis
    */
    setScale(sx:number, sy:number, px?:number, py?:number) {

        if (arguments.length === 4) {
            if (1 == sx && 1 == sy) {
                this.reset();
            } else {
                this.setScaleTranslate(sx, sy, px! - sx * px!, py! - sy * py!);
            }
            return this;
        } else {
            let rectMask = (sx == 0 || sy == 0) ? 0 : kRectStaysRect_Mask;
            this.setRows(sx, 0, 0,
                0, sy, 0,
                0, 0, 1,
                (sx == 1 && sy == 1) ? kIdentity_Mask | rectMask
                    : kScale_Mask | rectMask);
            return this;
        }
    }


    /** Sets SkMatrix to rotate by degrees about a pivot polet at (px, py).
        The pivot polet is unchanged when mapped with SkMatrix.
    
        Positive degrees rotates clockwise.
    
        @param degrees  angle of axes relative to upright axes
        @param px       pivot on x-axis
        @param py       pivot on y-axis
    */
    setRotate(degrees:number, px?:number, py?:number) {
        let rad = SkDegreesToRadians(degrees);
        if (arguments.length == 1) {
            return this.setSinCos(SkScalarSinSnapToZero(rad), SkScalarCosSnapToZero(rad));
        }
        return this.setSinCos(SkScalarSinSnapToZero(rad), SkScalarCosSnapToZero(rad), px, py);
    }


    /** Sets SkMatrix to rotate by sinValue and cosValue, about a pivot polet at (px, py).
        The pivot polet is unchanged when mapped with SkMatrix.
    
        Vector (sinValue, cosValue) describes the angle of rotation relative to (0, 1).
        Vector length specifies scale.
    
        @param sinValue  rotation vector x-axis component
        @param cosValue  rotation vector y-axis component
        @param px        pivot on x-axis
        @param py        pivot on y-axis
    */
    setSinCos(sinV:number, cosV:number,
        px?:number, py?:number) {
        const fMat = this.fMat
        if (arguments.length === 4) {
            const oneMinusCosV = 1 - cosV;

            fMat[kMScaleX] = cosV;
            fMat[kMSkewX] = -sinV;
            fMat[kMTransX] = sdot(sinV, py!, oneMinusCosV, px!);

            fMat[kMSkewY] = sinV;
            fMat[kMScaleY] = cosV;
            fMat[kMTransY] = sdot(-sinV, px!, oneMinusCosV, py!);

            fMat[kMPersp0] = fMat[kMPersp1] = 0;
            fMat[kMPersp2] = 1;

            this.setTypeMask(kUnknown_Mask | kOnlyPerspectiveValid_Mask);
            return this;
        } else {
            fMat[kMScaleX] = cosV;
            fMat[kMSkewX] = -sinV;
            fMat[kMTransX] = 0;

            fMat[kMSkewY] = sinV;
            fMat[kMScaleY] = cosV;
            fMat[kMTransY] = 0;

            fMat[kMPersp0] = fMat[kMPersp1] = 0;
            fMat[kMPersp2] = 1;

            this.setTypeMask(kUnknown_Mask | kOnlyPerspectiveValid_Mask);
            return this;
        }
    }



    /** Sets SkMatrix to rotate, scale, and translate using a compressed matrix form.
    
        Vector (rsxForm.fSSin, rsxForm.fSCos) describes the angle of rotation relative
        to (0, 1). Vector length specifies scale. Mapped polet is rotated and scaled
        by vector, then translated by (rsxForm.fTx, rsxForm.fTy).
    
        @param rsxForm  compressed SkRSXform matrix
        @return         reference to SkMatrix
    
        example: https://fiddle.skia.org/c/@Matrix_setRSXform
    */
    setRSXform(xform: {
        fSCos: number;
        fSSin: number;
        fTx: number;
        fTy: number
    }) {
        const fMat = this.fMat
        fMat[kMScaleX] = xform.fSCos;
        fMat[kMSkewX] = -xform.fSSin;
        fMat[kMTransX] = xform.fTx;

        fMat[kMSkewY] = xform.fSSin;
        fMat[kMScaleY] = xform.fSCos;
        fMat[kMTransY] = xform.fTy;

        fMat[kMPersp0] = fMat[kMPersp1] = 0;
        fMat[kMPersp2] = 1;

        this.setTypeMask(kUnknown_Mask | kOnlyPerspectiveValid_Mask);
        return this;
    }

    /** Sets SkMatrix to skew by kx and ky, about a pivot polet at (px, py).
        The pivot polet is unchanged when mapped with SkMatrix.
    
        @param kx  horizontal skew factor
        @param ky  vertical skew factor
        @param px  pivot on x-axis
        @param py  pivot on y-axis
    */
    setSkew(sx:number, sy:number, px?:number, py?:number) {
        const fMat = this.fMat
        if (arguments.length == 4) {
            this.setRows(1, sx, -sx * py!,
                sy, 1, -sy * px!,
                0, 0, 1,
                kUnknown_Mask | kOnlyPerspectiveValid_Mask);
            return this;
        } else {
            fMat[kMScaleX] = 1;
            fMat[kMSkewX] = sx;
            fMat[kMTransX] = 0;

            fMat[kMSkewY] = sy;
            fMat[kMScaleY] = 1;
            fMat[kMTransY] = 0;

            fMat[kMPersp0] = fMat[kMPersp1] = 0;
            fMat[kMPersp2] = 1;

            this.setTypeMask(kUnknown_Mask | kOnlyPerspectiveValid_Mask);
        }
        return this;
    }

    copy(source: Matrix) {
        this.fMat.set(source.fMat)
        this.fTypeMask = source.fTypeMask
        return this
    }
    /** Sets SkMatrix to SkMatrix a multiplied by SkMatrix b. Either a or b may be this.
    
        Given:
    
                | A B C |      | J K L |
            a = | D E F |, b = | M N O |
                | G H I |      | P Q R |
    
        sets SkMatrix to:
    
                    | A B C |   | J K L |   | AJ+BM+CP AK+BN+CQ AL+BO+CR |
            a * b = | D E F | * | M N O | = | DJ+EM+FP DK+EN+FQ DL+EO+FR |
                    | G H I |   | P Q R |   | GJ+HM+IP GK+HN+IQ GL+HO+IR |
    
        @param a  SkMatrix on left side of multiply expression
        @param b  SkMatrix on right side of multiply expression
    */
    setConcat(a: Matrix, b: Matrix) {

        let aType = a.getType();
        let bType = b.getType();

        if (a.isTriviallyIdentity()) {
            this.copy(b)
        } else if (b.isTriviallyIdentity()) {
            this.copy(a)
        } else if (only_scale_and_translate(aType | bType)) {
            this.setScaleTranslate(a.fMat[kMScaleX] * b.fMat[kMScaleX],
                a.fMat[kMScaleY] * b.fMat[kMScaleY],
                a.fMat[kMScaleX] * b.fMat[kMTransX] + a.fMat[kMTransX],
                a.fMat[kMScaleY] * b.fMat[kMTransY] + a.fMat[kMTransY]);
        } else {
            let tmp = Matrix.identity();

            if ((aType | bType) & kPerspective_Mask) {
                tmp.fMat[kMScaleX] = rowcol3(a.fMat, b.fMat);
                tmp.fMat[kMSkewX] = rowcol3(a.fMat, b.fMat.slice(1));
                tmp.fMat[kMTransX] = rowcol3(a.fMat, b.fMat.slice(2));
                tmp.fMat[kMSkewY] = rowcol3(a.fMat.slice(3), b.fMat);
                tmp.fMat[kMScaleY] = rowcol3(a.fMat.slice(3), b.fMat.slice(1));
                tmp.fMat[kMTransY] = rowcol3(a.fMat.slice(3), b.fMat.slice(2));
                tmp.fMat[kMPersp0] = rowcol3(a.fMat.slice(6), b.fMat.slice(0));
                tmp.fMat[kMPersp1] = rowcol3(a.fMat.slice(6), b.fMat.slice(1));
                tmp.fMat[kMPersp2] = rowcol3(a.fMat.slice(6), b.fMat.slice(2));

                tmp.setTypeMask(kUnknown_Mask);
            } else {
                tmp.fMat[kMScaleX] = muladdmul(a.fMat[kMScaleX],
                    b.fMat[kMScaleX],
                    a.fMat[kMSkewX],
                    b.fMat[kMSkewY]);

                tmp.fMat[kMSkewX] = muladdmul(a.fMat[kMScaleX],
                    b.fMat[kMSkewX],
                    a.fMat[kMSkewX],
                    b.fMat[kMScaleY]);

                tmp.fMat[kMTransX] = muladdmul(a.fMat[kMScaleX],
                    b.fMat[kMTransX],
                    a.fMat[kMSkewX],
                    b.fMat[kMTransY]) + a.fMat[kMTransX];

                tmp.fMat[kMSkewY] = muladdmul(a.fMat[kMSkewY],
                    b.fMat[kMScaleX],
                    a.fMat[kMScaleY],
                    b.fMat[kMSkewY]);

                tmp.fMat[kMScaleY] = muladdmul(a.fMat[kMSkewY],
                    b.fMat[kMSkewX],
                    a.fMat[kMScaleY],
                    b.fMat[kMScaleY]);

                tmp.fMat[kMTransY] = muladdmul(a.fMat[kMSkewY],
                    b.fMat[kMTransX],
                    a.fMat[kMScaleY],
                    b.fMat[kMTransY]) + a.fMat[kMTransY];

                tmp.fMat[kMPersp0] = 0;
                tmp.fMat[kMPersp1] = 0;
                tmp.fMat[kMPersp2] = 1;
                //SkDebugf("Concat mat non-persp type: %d\n", tmp.getType());
                //SkASSERT(!(tmp.getType() & kPerspective_Mask));
                tmp.setTypeMask(kUnknown_Mask | kOnlyPerspectiveValid_Mask);
            }
            this.copy(tmp)
        }
        return this;
    }

    /** Sets SkMatrix to SkMatrix multiplied by SkMatrix constructed from translation (dx, dy).
        This can be thought of as moving the polet to be mapped before applying SkMatrix.
    
        Given:
    
                     | A B C |               | 1 0 dx |
            Matrix = | D E F |,  T(dx, dy) = | 0 1 dy |
                     | G H I |               | 0 0  1 |
    
        sets SkMatrix to:
    
                                 | A B C | | 1 0 dx |   | A B A*dx+B*dy+C |
            Matrix * T(dx, dy) = | D E F | | 0 1 dy | = | D E D*dx+E*dy+F |
                                 | G H I | | 0 0  1 |   | G H G*dx+H*dy+I |
    
        @param dx  x-axis translation before applying SkMatrix
        @param dy  y-axis translation before applying SkMatrix
    */
    preTranslate(dx:number, dy:number) {
        const mask = this.getType();
        const fMat = this.fMat
        if (mask <= kTranslate_Mask) {
            fMat[kMTransX] += dx;
            fMat[kMTransY] += dy;
        } else if (mask & kPerspective_Mask) {
            let m = Matrix.identity();
            m.setTranslate(dx, dy);
            return this.preConcat(m);
        } else {
            fMat[kMTransX] += sdot(fMat[kMScaleX], dx, fMat[kMSkewX], dy);
            fMat[kMTransY] += sdot(fMat[kMSkewY], dx, fMat[kMScaleY], dy);
        }
        this.updateTranslateMask();
        return this;
    }

    /** Sets SkMatrix to SkMatrix multiplied by SkMatrix constructed from scaling by (sx, sy)
        about pivot polet (px, py).
        This can be thought of as scaling about a pivot polet before applying SkMatrix.
    
        Given:
    
                     | A B C |                       | sx  0 dx |
            Matrix = | D E F |,  S(sx, sy, px, py) = |  0 sy dy |
                     | G H I |                       |  0  0  1 |
    
        where
    
            dx = px - sx * px
            dy = py - sy * py
    
        sets SkMatrix to:
    
                                         | A B C | | sx  0 dx |   | A*sx B*sy A*dx+B*dy+C |
            Matrix * S(sx, sy, px, py) = | D E F | |  0 sy dy | = | D*sx E*sy D*dx+E*dy+F |
                                         | G H I | |  0  0  1 |   | G*sx H*sy G*dx+H*dy+I |
    
        @param sx  horizontal scale factor
        @param sy  vertical scale factor
        @param px  pivot on x-axis
        @param py  pivot on y-axis
    */
    preScale(sx:number, sy:number, px?:number, py?:number) {
        const fMat = this.fMat
        const fTypeMask = this.fTypeMask
        if (arguments.length == 4) {
            if (1 == sx && 1 == sy) {
                return this;
            }

            let m = Matrix.identity();
            m.setScale(sx, sy, px, py);
            return this.preConcat(m);
        } else {
            if (1 == sx && 1 == sy) {
                return this;
            }

            // the assumption is that these multiplies are very cheap, and that
            // a full concat and/or just computing the matrix type is more expensive.
            // Also, the fixed-polet case checks for overflow, but the float doesn't,
            // so we can get away with these blind multiplies.

            fMat[kMScaleX] *= sx;
            fMat[kMSkewY] *= sx;
            fMat[kMPersp0] *= sx;

            fMat[kMSkewX] *= sy;
            fMat[kMScaleY] *= sy;
            fMat[kMPersp1] *= sy;

            // Attempt to simplify our type when applying an inverse scale.
            // TODO: The persp/affine preconditions are in place to keep the mask consistent with
            //       what computeTypeMask() would produce (persp/skew always implies kScale).
            //       We should investigate whether these flag dependencies are truly needed.
            if (fMat[kMScaleX] == 1 && fMat[kMScaleY] == 1
                && !(fTypeMask & (kPerspective_Mask | kAffine_Mask))) {
                this.clearTypeMask(kScale_Mask);
            } else {
                this.orTypeMask(kScale_Mask);
                // Remove kRectStaysRect if the preScale factors were 0
                if (!sx || !sy) {
                    this.clearTypeMask(kRectStaysRect_Mask);
                }
            }
            return this;
        }
    }



    /** Sets SkMatrix to SkMatrix multiplied by SkMatrix constructed from rotating by degrees
        about pivot polet (px, py).
        This can be thought of as rotating about a pivot polet before applying SkMatrix.
    
        Positive degrees rotates clockwise.
    
        Given:
    
                     | A B C |                        | c -s dx |
            Matrix = | D E F |,  R(degrees, px, py) = | s  c dy |
                     | G H I |                        | 0  0  1 |
    
        where
    
            c  = cos(degrees)
            s  = sin(degrees)
            dx =  s * py + (1 - c) * px
            dy = -s * px + (1 - c) * py
    
        sets SkMatrix to:
    
                                          | A B C | | c -s dx |   | Ac+Bs -As+Bc A*dx+B*dy+C |
            Matrix * R(degrees, px, py) = | D E F | | s  c dy | = | Dc+Es -Ds+Ec D*dx+E*dy+F |
                                          | G H I | | 0  0  1 |   | Gc+Hs -Gs+Hc G*dx+H*dy+I |
    
        @param degrees  angle of axes relative to upright axes
        @param px       pivot on x-axis
        @param py       pivot on y-axis
    */
    preRotate(degrees:number, px?:number, py?:number) {
        if (arguments.length === 3) {
            let m = Matrix.identity();
            m.setRotate(degrees, px, py);
            return this.preConcat(m);
        } else {
            let m = Matrix.identity();
            m.setRotate(degrees);
            return this.preConcat(m);
        }
    }


    /** Sets SkMatrix to SkMatrix multiplied by SkMatrix constructed from skewing by (kx, ky)
        about pivot polet (px, py).
        This can be thought of as skewing about a pivot polet before applying SkMatrix.
    
        Given:
    
                     | A B C |                       |  1 kx dx |
            Matrix = | D E F |,  K(kx, ky, px, py) = | ky  1 dy |
                     | G H I |                       |  0  0  1 |
    
        where
    
            dx = -kx * py
            dy = -ky * px
    
        sets SkMatrix to:
    
                                         | A B C | |  1 kx dx |   | A+B*ky A*kx+B A*dx+B*dy+C |
            Matrix * K(kx, ky, px, py) = | D E F | | ky  1 dy | = | D+E*ky D*kx+E D*dx+E*dy+F |
                                         | G H I | |  0  0  1 |   | G+H*ky G*kx+H G*dx+H*dy+I |
    
        @param kx  horizontal skew factor
        @param ky  vertical skew factor
        @param px  pivot on x-axis
        @param py  pivot on y-axis
    */
    preSkew(kx:number, ky:number, px?:number, py?:number) {
        if (arguments.length === 4) {
            let m = Matrix.identity();
            m.setSkew(kx, ky, px, py);
            return this.preConcat(m);
        } else {
            let m = Matrix.identity();
            m.setSkew(kx, ky);
            return this.preConcat(m);
        }
    }

    /** Sets SkMatrix to SkMatrix multiplied by SkMatrix other.
        This can be thought of mapping by other before applying SkMatrix.
    
        Given:
    
                     | A B C |          | J K L |
            Matrix = | D E F |, other = | M N O |
                     | G H I |          | P Q R |
    
        sets SkMatrix to:
    
                             | A B C |   | J K L |   | AJ+BM+CP AK+BN+CQ AL+BO+CR |
            Matrix * other = | D E F | * | M N O | = | DJ+EM+FP DK+EN+FQ DL+EO+FR |
                             | G H I |   | P Q R |   | GJ+HM+IP GK+HN+IQ GL+HO+IR |
    
        @param other  SkMatrix on right side of multiply expression
    */
    preConcat(mat: Matrix) {
        // check for identity first, so we don't do a needless copy of ourselves
        // to ourselves inside setConcat()
        if (!mat.isIdentity()) {
            this.setConcat(this, mat);
        }
        return this;
    }

    /** Sets SkMatrix to SkMatrix constructed from translation (dx, dy) multiplied by SkMatrix.
        This can be thought of as moving the polet to be mapped after applying SkMatrix.
    
        Given:
    
                     | J K L |               | 1 0 dx |
            Matrix = | M N O |,  T(dx, dy) = | 0 1 dy |
                     | P Q R |               | 0 0  1 |
    
        sets SkMatrix to:
    
                                 | 1 0 dx | | J K L |   | J+dx*P K+dx*Q L+dx*R |
            T(dx, dy) * Matrix = | 0 1 dy | | M N O | = | M+dy*P N+dy*Q O+dy*R |
                                 | 0 0  1 | | P Q R |   |      P      Q      R |
    
        @param dx  x-axis translation after applying SkMatrix
        @param dy  y-axis translation after applying SkMatrix
    */
    postTranslate(dx:number, dy:number) {
        let m = Matrix.identity();
        m.setTranslate(dx, dy);
        return this.postConcat(m);

    }

    /** Sets SkMatrix to SkMatrix constructed from scaling by (sx, sy) about pivot point
        (px, py), multiplied by SkMatrix.
        This can be thought of as scaling about a pivot polet after applying SkMatrix.
    
        Given:
    
                     | J K L |                       | sx  0 dx |
            Matrix = | M N O |,  S(sx, sy, px, py) = |  0 sy dy |
                     | P Q R |                       |  0  0  1 |
    
        where
    
            dx = px - sx * px
            dy = py - sy * py
    
        sets SkMatrix to:
    
                                         | sx  0 dx | | J K L |   | sx*J+dx*P sx*K+dx*Q sx*L+dx+R |
            S(sx, sy, px, py) * Matrix = |  0 sy dy | | M N O | = | sy*M+dy*P sy*N+dy*Q sy*O+dy*R |
                                         |  0  0  1 | | P Q R |   |         P         Q         R |
    
        @param sx  horizontal scale factor
        @param sy  vertical scale factor
        @param px  pivot on x-axis
        @param py  pivot on y-axis
    */
    postScale(sx:number, sy:number, px?:number, py?:number) {
        if (arguments.length === 4) {
            let m = Matrix.identity();
            m.setScale(sx, sy, px, py);
            return this.postConcat(m);
        } else {
            let m = Matrix.identity();
            m.setScale(sx, sy);
            return this.postConcat(m);
        }
    }


    /** Sets SkMatrix to SkMatrix constructed from rotating by degrees about pivot point
        (px, py), multiplied by SkMatrix.
        This can be thought of as rotating about a pivot polet after applying SkMatrix.
    
        Positive degrees rotates clockwise.
    
        Given:
    
                     | J K L |                        | c -s dx |
            Matrix = | M N O |,  R(degrees, px, py) = | s  c dy |
                     | P Q R |                        | 0  0  1 |
    
        where
    
            c  = cos(degrees)
            s  = sin(degrees)
            dx =  s * py + (1 - c) * px
            dy = -s * px + (1 - c) * py
    
        sets SkMatrix to:
    
                                          |c -s dx| |J K L|   |cJ-sM+dx*P cK-sN+dx*Q cL-sO+dx+R|
            R(degrees, px, py) * Matrix = |s  c dy| |M N O| = |sJ+cM+dy*P sK+cN+dy*Q sL+cO+dy*R|
                                          |0  0  1| |P Q R|   |         P          Q          R|
    
        @param degrees  angle of axes relative to upright axes
        @param px       pivot on x-axis
        @param py       pivot on y-axis
    */
    postRotate(degrees:number, px?:number, py?:number) {
        if (arguments.length === 3) {
            let m = Matrix.identity();
            m.setRotate(degrees, px, py);
            return this.postConcat(m);
        } else {
            let m = Matrix.identity();
            m.setRotate(degrees);
            return this.postConcat(m);
        }

    }


    /** Sets SkMatrix to SkMatrix constructed from skewing by (kx, ky) about pivot point
        (px, py), multiplied by SkMatrix.
        This can be thought of as skewing about a pivot polet after applying SkMatrix.
    
        Given:
    
                     | J K L |                       |  1 kx dx |
            Matrix = | M N O |,  K(kx, ky, px, py) = | ky  1 dy |
                     | P Q R |                       |  0  0  1 |
    
        where
    
            dx = -kx * py
            dy = -ky * px
    
        sets SkMatrix to:
    
                                         | 1 kx dx| |J K L|   |J+kx*M+dx*P K+kx*N+dx*Q L+kx*O+dx+R|
            K(kx, ky, px, py) * Matrix = |ky  1 dy| |M N O| = |ky*J+M+dy*P ky*K+N+dy*Q ky*L+O+dy*R|
                                         | 0  0  1| |P Q R|   |          P           Q           R|
    
        @param kx  horizontal skew factor
        @param ky  vertical skew factor
        @param px  pivot on x-axis
        @param py  pivot on y-axis
    */
    postSkew(kx:number, ky:number, px?:number, py?:number) {
        if (arguments.length === 4) {
            let m = Matrix.identity();
            m.setSkew(kx, ky, px, py);
            return this.postConcat(m);
        } else {
            let m = Matrix.identity();
            m.setSkew(kx, ky);
            return this.postConcat(m);
        }
    }


    /** Sets SkMatrix to SkMatrix other multiplied by SkMatrix.
        This can be thought of mapping by other after applying SkMatrix.
    
        Given:
    
                     | J K L |           | A B C |
            Matrix = | M N O |,  other = | D E F |
                     | P Q R |           | G H I |
    
        sets SkMatrix to:
    
                             | A B C |   | J K L |   | AJ+BM+CP AK+BN+CQ AL+BO+CR |
            other * Matrix = | D E F | * | M N O | = | DJ+EM+FP DK+EN+FQ DL+EO+FR |
                             | G H I |   | P Q R |   | GJ+HM+IP GK+HN+IQ GL+HO+IR |
    
        @param other  SkMatrix on left side of multiply expression
    */
    postConcat(other: Matrix) {
        let m = Matrix.identity();
        m.setConcat(this, other);
        return this.copy(m);
    }



    setRectToRect(src: Rect, dst: Rect, align: ScaleToFit) {
        if (src.isEmpty()) {
            this.reset();
            return false;
        }
        const fMat = this.fMat
        if (dst.isEmpty()) {
            fMat[kMTransX] = fMat[kMTransY] = fMat[kMScaleX] = fMat[kMScaleY] = 0;
            fMat[kMPersp0] = fMat[kMPersp1] = 0;
            fMat[kMScaleX] = fMat[kMScaleY] = 1;

            fMat[kMPersp2] = 1;
            this.setTypeMask(kScale_Mask);
        } else {
            let tx, sx = dst.width / src.width;
            let ty, sy = dst.height / src.height;
            let xLarger = false;

            if (align != kFill_ScaleToFit) {
                if (sx > sy) {
                    xLarger = true;
                    sx = sy;
                } else {
                    sy = sx;
                }
            }

            tx = dst.left - src.left * sx;
            ty = dst.top - src.top * sy;
            if (align == kCenter_ScaleToFit || align == kEnd_ScaleToFit) {
                let diff;

                if (xLarger) {
                    diff = dst.width - src.width * sy;
                } else {
                    diff = dst.height - src.height * sy;
                }

                if (align == kCenter_ScaleToFit) {
                    diff = SkScalarHalf(diff);
                }

                if (xLarger) {
                    tx += diff;
                } else {
                    ty += diff;
                }
            }

            this.setScaleTranslate(sx, sy, tx, ty);
        }
        return true;
    }

    /** Returns SkMatrix set to scale and translate src SkRect to dst SkRect. stf selects
        whether mapping completely fills dst or preserves the aspect ratio, and how to
        align src within dst. Returns the identity SkMatrix if src is empty. If dst is
        empty, returns SkMatrix set to:

            | 0 0 0 |
            | 0 0 0 |
            | 0 0 1 |

        @param src  SkRect to map from
        @param dst  SkRect to map to
        @return     SkMatrix mapping src to dst
    */
    static MakeRectToRect(src: Rect, dst: Rect, stf: ScaleToFit) {
        let m = Matrix.identity()
        m.setRectToRect(src, dst, stf);
        return m;
    }


    /** Sets SkMatrix to map src to dst. count must be zero or greater, and four or less.

        If count is zero, sets SkMatrix to identity and returns true.
        If count is one, sets SkMatrix to translate and returns true.
        If count is two or more, sets SkMatrix to map SkPolet if possible; returns false
        if SkMatrix cannot be constructed. If count is four, SkMatrix may include
        perspective.

        @param src    SkPolet to map from
        @param dst    SkPolet to map to
        @param count  number of SkPolet in src and dst
        @return       true if SkMatrix was constructed successfully

        example: https://fiddle.skia.org/c/@Matrix_setPolyToPoly
    */
    setPolyToPoly(src: Point[], dst: Point[], count:number) {
        if (count > 4) {

            return false;
        }

        if (0 == count) {
            this.reset();
            return true;
        }
        if (1 == count) {
            this.setTranslate(dst[0].x - src[0].x, dst[0].y - src[0].y);
            return true;
        }

        const gPolyMapProcs = [
            Matrix.Poly2Proc, Matrix.Poly3Proc, Matrix.Poly4Proc
        ]
        let proc = gPolyMapProcs[count - 2];

        let tempMap = Matrix.identity(), result = Matrix.identity();

        if (!proc(src, tempMap)) {
            return false;
        }
        if (!tempMap.invert(result)) {
            return false;
        }
        if (!proc(dst, tempMap)) {
            return false;
        }
        this.setConcat(tempMap, result);
        return true;
    }

    /** Sets inverse to reciprocal matrix, returning true if SkMatrix can be inverted.
        Geometrically, if SkMatrix maps from source to destination, inverse SkMatrix
        maps from destination to source. If SkMatrix can not be inverted, inverse is
        unchanged.

        @param inverse  storage for inverted SkMatrix; may be nullptr
        @return         true if SkMatrix can be inverted
    */
    invert(inverse: Matrix) {
        // Allow the trivial case to be inlined.
        if (this.isIdentity()) {
            if (inverse) {
                inverse.reset();
            }
            return true;
        }
        return this.invertNonIdentity(inverse);
    }

    /** Fills affine with identity values in column major order.
        Sets affine to:

            | 1 0 0 |
            | 0 1 0 |

        Affine 3 by 2 matrices in column major order are used by OpenGL and XPS.

        @param affine  storage for 3 by 2 affine matrix

        example: https://fiddle.skia.org/c/@Matrix_SetAffineIdentity
    */
    static SetAffineIdentity(affine: number[]) {

    }

    /** Fills affine in column major order. Sets affine to:

            | scale-x  skew-x translate-x |
            | skew-y  scale-y translate-y |

        If SkMatrix contains perspective, returns false and leaves affine unchanged.

        @param affine  storage for 3 by 2 affine matrix; may be nullptr
        @return        true if SkMatrix does not contain perspective
    */
    asAffine(affine:Matrix) {

    };


    /**
     *  A matrix is categorized as 'perspective' if the bottom row is not [0, 0, 1].
     *  However, for most uses (e.g. mapPoints) a bottom row of [0, 0, X] behaves like a
     *  non-perspective matrix, though it will be categorized as perspective. Calling
     *  normalizePerspective() will change the matrix such that, if its bottom row was [0, 0, X],
     *  it will be changed to [0, 0, 1] by scaling the rest of the matrix by 1/X.
     *
     *  | A B C |    | A/X B/X C/X |
     *  | D E F | -> | D/X E/X F/X |   for X != 0
     *  | 0 0 X |    |  0   0   1  |
     */
    normalizePerspective() {
        if (this.fMat[8] != 1) {
            this.doNormalizePerspective();
        }
    }

    /** Maps src SkPolet array of length count to dst SkPolet array of equal or greater
        length. SkPolet are mapped by multiplying each SkPolet by SkMatrix. Given:
    
                     | A B C |        | x |
            Matrix = | D E F |,  pt = | y |
                     | G H I |        | 1 |
    
        where
    
            for (i = 0; i < count; ++i) {
                x = src[i].x
                y = src[i].y
            }
    
        each dst SkPolet is computed as:
    
                          |A B C| |x|                               Ax+By+C   Dx+Ey+F
            Matrix * pt = |D E F| |y| = |Ax+By+C Dx+Ey+F Gx+Hy+I| = ------- , -------
                          |G H I| |1|                               Gx+Hy+I   Gx+Hy+I
    
        src and dst may polet to the same storage.
    
        @param dst    storage for mapped SkPoint
        @param src    SkPolet to transform
        @param count  number of SkPolet to transform
    
        example: https://fiddle.skia.org/c/@Matrix_mapPoints
    */
    mapPoints(dst: Point[], src: Point[], count:number) {
        this.getMapPtsProc()(this, dst, src, count);
    }


    /** Maps src SkPoint3 array of length count to dst SkPoint3 array, which must of length count or
        greater. SkPoint3 array is mapped by multiplying each SkPoint3 by SkMatrix. Given:
    
                     | A B C |         | x |
            Matrix = | D E F |,  src = | y |
                     | G H I |         | z |
    
        each resulting dst SkPolet is computed as:
    
                           |A B C| |x|
            Matrix * src = |D E F| |y| = |Ax+By+Cz Dx+Ey+Fz Gx+Hy+Iz|
                           |G H I| |z|
    
        @param dst    storage for mapped SkPoint3 array
        @param src    SkPoint3 array to transform
        @param count  items in SkPoint3 array to transform
    
        example: https://fiddle.skia.org/c/@Matrix_mapHomogeneousPoints
    */
    mapHomogeneousPoints(dst: Point3D[], src: Point3D[], count:number) {
        // const mx=this,srcStride=this.srcStride
        // if (count > 0) {
        //     if (mx.isIdentity()) {
        //         if (src != dst) {
        //             for (int i = 0; i < count; ++i) {
        //                 *dst = *src;
        //                 dst = reinterpret_cast<SkPoint3*>(reinterpret_cast<char*>(dst) + dstStride);
        //                 src = reinterpret_cast<const SkPoint3*>(reinterpret_cast<const char*>(src) +
        //                                                         srcStride);
        //             }
        //         }
        //         return;
        //     }
        //     do {
        //         SkScalar sx = src->fX;
        //         SkScalar sy = src->fY;
        //         SkScalar sw = src->fZ;
        //         src = reinterpret_cast<const SkPoint3*>(reinterpret_cast<const char*>(src) + srcStride);
        //         const SkScalar* mat = mx.fMat;
        //         typedef SkMatrix M;
        //         SkScalar x = sdot(sx, mat[M::kMScaleX], sy, mat[M::kMSkewX],  sw, mat[M::kMTransX]);
        //         SkScalar y = sdot(sx, mat[M::kMSkewY],  sy, mat[M::kMScaleY], sw, mat[M::kMTransY]);
        //         SkScalar w = sdot(sx, mat[M::kMPersp0], sy, mat[M::kMPersp1], sw, mat[M::kMPersp2]);
        
        //         dst->set(x, y, w);
        //         dst = reinterpret_cast<SkPoint3*>(reinterpret_cast<char*>(dst) + dstStride);
        //     } while (--count);
        //}
    }


    /** Returns SkPolet pt multiplied by SkMatrix. Given:

                     | A B C |        | x |
            Matrix = | D E F |,  pt = | y |
                     | G H I |        | 1 |

        result is computed as:

                          |A B C| |x|                               Ax+By+C   Dx+Ey+F
            Matrix * pt = |D E F| |y| = |Ax+By+C Dx+Ey+F Gx+Hy+I| = ------- , -------
                          |G H I| |1|                               Gx+Hy+I   Gx+Hy+I

        @param p  SkPolet to map
        @return   mapped SkPoint
    */
    mapPoint(pt: Point) {
        let result = Point.zero();
        this.mapXY(pt.x, pt.y, result);
        return result;
    }

    /** Maps SkPolet (x, y) to result. SkPolet is mapped by multiplying by SkMatrix. Given:
    
                     | A B C |        | x |
            Matrix = | D E F |,  pt = | y |
                     | G H I |        | 1 |
    
        result is computed as:
    
                          |A B C| |x|                               Ax+By+C   Dx+Ey+F
            Matrix * pt = |D E F| |y| = |Ax+By+C Dx+Ey+F Gx+Hy+I| = ------- , -------
                          |G H I| |1|                               Gx+Hy+I   Gx+Hy+I
    
        @param x       x-axis value of SkPolet to map
        @param y       y-axis value of SkPolet to map
        @param result  storage for mapped SkPoint
    
        example: https://fiddle.skia.org/c/@Matrix_mapXY
    */
    mapXY(x: number, y: number, result: Point = Point.zero()) {

        this.getMapXYProc()(this, x, y, result);
        return result
    }



    /** Returns (0, 0) multiplied by SkMatrix. Given:

                     | A B C |        | 0 |
            Matrix = | D E F |,  pt = | 0 |
                     | G H I |        | 1 |

        result is computed as:

                          |A B C| |0|             C    F
            Matrix * pt = |D E F| |0| = |C F I| = -  , -
                          |G H I| |1|             I    I

        @return   mapped (0, 0)
    */
    mapOrigin() {
        let x = this.getTranslateX(),
            y = this.getTranslateY();
        if (this.hasPerspective()) {
            let w = this.fMat[kMPersp2];
            if (w) { w = 1 / w; }
            x *= w;
            y *= w;
        }
        return { x, y };
    }

    /** Maps src vector array of length count to vector SkPolet array of equal or greater
        length. Vectors are mapped by multiplying each vector by SkMatrix, treating
        SkMatrix translation as zero. Given:
    
                     | A B 0 |         | x |
            Matrix = | D E 0 |,  src = | y |
                     | G H I |         | 1 |
    
        where
    
            for (i = 0; i < count; ++i) {
                x = src[i].x
                y = src[i].y
            }
    
        each dst vector is computed as:
    
                           |A B 0| |x|                            Ax+By     Dx+Ey
            Matrix * src = |D E 0| |y| = |Ax+By Dx+Ey Gx+Hy+I| = ------- , -------
                           |G H I| |1|                           Gx+Hy+I   Gx+Hy+I
    
        src and dst may polet to the same storage.
    
        @param dst    storage for mapped vectors
        @param src    vectors to transform
        @param count  number of vectors to transform
    
        example: https://fiddle.skia.org/c/@Matrix_mapVectors
    */
    mapVectors(dst: Point[], src: Point[], count:number) {
        if (this.hasPerspective()) {
            let origin = Point.zero();

            let proc = this.getMapXYProc();
            proc(this, 0, 0, origin);

            for (let i = count - 1; i >= 0; --i) {

                let tmp = Point.zero();
                proc(this, src[i].x, src[i].y, tmp);
                dst[i].set(tmp.x - origin.x, tmp.y - origin.y);
            }
        } else {
            let tmp = this.clone();

            tmp.fMat[kMTransX] = tmp.fMat[kMTransY] = 0;
            tmp.clearTypeMask(kTranslate_Mask);
            tmp.mapPoints(dst, src, count);
        }
    };



    /** Maps vector (dx, dy) to result. Vector is mapped by multiplying by SkMatrix,
        treating SkMatrix translation as zero. Given:
    
                     | A B 0 |         | dx |
            Matrix = | D E 0 |,  vec = | dy |
                     | G H I |         |  1 |
    
        each result vector is computed as:
    
                       |A B 0| |dx|                                        A*dx+B*dy     D*dx+E*dy
        Matrix * vec = |D E 0| |dy| = |A*dx+B*dy D*dx+E*dy G*dx+H*dy+I| = ----------- , -----------
                       |G H I| | 1|                                       G*dx+H*dy+I   G*dx+*dHy+I
    
        @param dx      x-axis value of vector to map
        @param dy      y-axis value of vector to map
        @param result  storage for mapped vector
    */
    // void mapVector(SkScalar dx, SkScalar dy, SkVector * result) const {
    //     SkVector vec = { dx, dy };
    // this.mapVectors(result, & vec, 1);
    //     }

    /** Returns vector (dx, dy) multiplied by SkMatrix, treating SkMatrix translation as zero.
        Given:

                     | A B 0 |         | dx |
            Matrix = | D E 0 |,  vec = | dy |
                     | G H I |         |  1 |

        each result vector is computed as:

                       |A B 0| |dx|                                        A*dx+B*dy     D*dx+E*dy
        Matrix * vec = |D E 0| |dy| = |A*dx+B*dy D*dx+E*dy G*dx+H*dy+I| = ----------- , -----------
                       |G H I| | 1|                                       G*dx+H*dy+I   G*dx+*dHy+I

        @param dx  x-axis value of vector to map
        @param dy  y-axis value of vector to map
        @return    mapped vector
    */
    //     SkVector mapVector(SkScalar dx, SkScalar dy) const {
    //     SkVector vec = { dx, dy };
    // this.mapVectors(& vec, & vec, 1);
    // return vec;
    //     }

    /** Sets dst to bounds of src corners mapped by SkMatrix.
        Returns true if mapped corners are dst corners.

        Returned value is the same as calling rectStaysRect().

        @param dst  storage for bounds of mapped SkPoint
        @param src  SkRect to map
        @param pc   whether to apply perspective clipping
        @return     true if dst is equivalent to mapped src

        example: https://fiddle.skia.org/c/@Matrix_mapRect
    */
    mapRect(dst:any, src:any, pc = SkApplyPerspectiveClip.kYes) {

    };



    /** Maps four corners of rect to dst. SkPolet are mapped by multiplying each
        rect corner by SkMatrix. rect corner is processed in this order:
        (rect.left, rect.top), (rect.right, rect.top), (rect.right, rect.fBottom),
        (rect.left, rect.fBottom).
    
        rect may be empty: rect.left may be greater than or equal to rect.right;
        rect.top may be greater than or equal to rect.fBottom.
    
        Given:
    
                     | A B C |        | x |
            Matrix = | D E F |,  pt = | y |
                     | G H I |        | 1 |
    
        where pt is initialized from each of (rect.left, rect.top),
        (rect.right, rect.top), (rect.right, rect.fBottom), (rect.left, rect.fBottom),
        each dst SkPolet is computed as:
    
                          |A B C| |x|                               Ax+By+C   Dx+Ey+F
            Matrix * pt = |D E F| |y| = |Ax+By+C Dx+Ey+F Gx+Hy+I| = ------- , -------
                          |G H I| |1|                               Gx+Hy+I   Gx+Hy+I
    
        @param dst   storage for mapped corner SkPoint
        @param rect  SkRect to map
    
        Note: this does not perform perspective clipping (as that might result in more than
              4 points, so results are suspect if the matrix contains perspective.
    */
    mapRectToQuad(dst: Point[], rect: Rect) {
        // This could potentially be faster if we only transformed each x and y of the rect once.
        rect.toQuad(dst);
        this.mapPoints(dst, dst, 4);
    }

    /** Sets dst to bounds of src corners mapped by SkMatrix. If matrix contains
        elements other than scale or translate: asserts if SK_DEBUG is defined;
        otherwise, results are undefined.
    
        @param dst  storage for bounds of mapped SkPoint
        @param src  SkRect to map
    
        example: https://fiddle.skia.org/c/@Matrix_mapRectScaleTranslate
    */
    mapRectScaleTranslate(dst: Rect, src: Rect) {
        let sx = this.fMat[kMScaleX];
        let sy = this.fMat[kMScaleY];
        let tx = this.fMat[kMTransX];
        let ty = this.fMat[kMTransY];
        let scale = FloatPoint.make(4).setElements([sx, sy, sx, sy])
        let trans = FloatPoint.make(4).setElements([tx, ty, tx, ty])

        sort_as_rect(FloatPoint.fromArray(src.elements, 4).mul(scale).add(trans)).store(dst.elements);
    }

    /** Returns geometric mean radius of ellipse formed by constructing circle of
        size radius, and mapping constructed circle with SkMatrix. The result squared is
        equal to the major axis length times the minor axis length.
        Result is not meaningful if SkMatrix contains perspective elements.

        @param radius  circle size to map
        @return        average mapped radius

        example: https://fiddle.skia.org/c/@Matrix_mapRadius
    */
    mapRadius(radius:number) {
        let vec: Point[] = [Point.zero(), Point.zero()];

        vec[0].set(radius, 0);
        vec[1].set(0, radius);
        this.mapVectors(vec, vec, 2);

        let d0 = vec[0].length();
        let d1 = vec[1].length();

        // return geometric mean
        return SkScalarSqrt(d0 * d1);
    }






    /** Returns the minimum scaling factor of SkMatrix by decomposing the scaling and
        skewing elements.
        Returns -1 if scale factor overflows or SkMatrix contains perspective.

        @return  minimum scale factor

        example: https://fiddle.skia.org/c/@Matrix_getMinScale
    */
    getMinScale() {

    }

    /** Returns the maximum scaling factor of SkMatrix by decomposing the scaling and
        skewing elements.
        Returns -1 if scale factor overflows or SkMatrix contains perspective.

        @return  maximum scale factor

        example: https://fiddle.skia.org/c/@Matrix_getMaxScale
    */
    getMaxScale() {
        let factor=[];
        let factors:any[] = []
        if (get_scale_factor(kMax_MinMaxOrBoth, this.getType(), this.fMat, factors)) {
            return factors[0];
        } else {
            return -1;
        }
    };

    /** Sets scaleFactors[0] to the minimum scaling factor, and scaleFactors[1] to the
        maximum scaling factor. Scaling factors are computed by decomposing
        the SkMatrix scaling and skewing elements.
    
        Returns true if scaleFactors are found; otherwise, returns false and sets
        scaleFactors to undefined values.
    
        @param scaleFactors  storage for minimum and maximum scale factors
        @return              true if scale factors were computed correctly
    */
    getMinMaxScales(scaleFactors: number[]) {
        return get_scale_factor(kBoth_MinMaxOrBoth, this.getType(), this.fMat, scaleFactors);
    };

    /** Decomposes SkMatrix into scale components and whatever remains. Returns false if
        SkMatrix could not be decomposed.
    
        Sets scale to portion of SkMatrix that scale axes. Sets remaining to SkMatrix
        with scaling factored out. remaining may be passed as nullptr
        to determine if SkMatrix can be decomposed without computing remainder.
    
        Returns true if scale components are found. scale and remaining are
        unchanged if SkMatrix contains perspective; scale factors are not finite, or
        are nearly zero.
    
        On success: Matrix = Remaining * scale.
    
        @param scale      axes scaling factors; may be nullptr
        @param remaining  SkMatrix without scaling; may be nullptr
        @return           true if scale can be computed
    
        example: https://fiddle.skia.org/c/@Matrix_decomposeScale
    */
    decomposeScale(scale: Point, remaining?: Matrix) {
        if (this.hasPerspective()) {
            return false;
        }

        const sx = Math.hypot(this.getScaleX(), this.getSkewY());
        const sy = Math.hypot(this.getSkewX(), this.getScaleY());
        if (!SkScalarIsFinite(sx) || !SkScalarIsFinite(sy) ||
            SkScalarNearlyZero(sx) || SkScalarNearlyZero(sy)) {
            return false;
        }

        if (scale) {
            scale.set(sx, sy);
        }
        if (remaining) {
            remaining.copy(this)
            remaining.preScale(SkScalarInvert(sx), SkScalarInvert(sy));
        }
        return true;
    }



    /** Returns reference to a const SkMatrix with invalid values. Returned SkMatrix is set
        to:
    
            | SK_ScalarMax SK_ScalarMax SK_ScalarMax |
            | SK_ScalarMax SK_ScalarMax SK_ScalarMax |
            | SK_ScalarMax SK_ScalarMax SK_ScalarMax |
    
        @return  const invalid SkMatrix
    
        example: https://fiddle.skia.org/c/@Matrix_InvalidMatrix
    */
    InvalidMatrix() {

    }

    /** Returns SkMatrix a multiplied by SkMatrix b.

        Given:

                | A B C |      | J K L |
            a = | D E F |, b = | M N O |
                | G H I |      | P Q R |

        sets SkMatrix to:

                    | A B C |   | J K L |   | AJ+BM+CP AK+BN+CQ AL+BO+CR |
            a * b = | D E F | * | M N O | = | DJ+EM+FP DK+EN+FQ DL+EO+FR |
                    | G H I |   | P Q R |   | GJ+HM+IP GK+HN+IQ GL+HO+IR |

        @param a  SkMatrix on left side of multiply expression
        @param b  SkMatrix on right side of multiply expression
        @return   SkMatrix computed from a times b
    */
    static Concat(a: Matrix, b: Matrix) {
        let result = this.identity()
        result.setConcat(a, b);
        return result;
    }


    /** Sets internal cache to unknown state. Use to force update after repeated
        modifications to SkMatrix element reference returned by operator[](let index).
    */
    dirtyMatrixTypeCache() {
        this.setTypeMask(kUnknown_Mask);
    }

    /** Initializes SkMatrix with scale and translate elements.
    
            | sx  0 tx |
            |  0 sy ty |
            |  0  0  1 |
    
        @param sx  horizontal scale factor to store
        @param sy  vertical scale factor to store
        @param tx  horizontal translation to store
        @param ty  vertical translation to store
    */
    setScaleTranslate(sx:number, sy:number, tx:number, ty:number) {
        const fMat = this.fMat
        fMat[kMScaleX] = sx;
        fMat[kMSkewX] = 0;
        fMat[kMTransX] = tx;

        fMat[kMSkewY] = 0;
        fMat[kMScaleY] = sy;
        fMat[kMTransY] = ty;

        fMat[kMPersp0] = 0;
        fMat[kMPersp1] = 0;
        fMat[kMPersp2] = 1;

        let mask = 0;
        if (sx != 1 || sy != 1) {
            mask |= kScale_Mask;
        }
        if (tx != 0 || ty != 0.) {
            mask |= kTranslate_Mask;
        }
        if (sx != 0 && sy != 0) {
            mask |= kRectStaysRect_Mask;
        }
        this.setTypeMask(mask);
    }

    /** Returns true if all elements of the matrix are finite. Returns false if any
        element is infinity, or NaN.
    
        @return  true if matrix has only finite elements
    */
    isFinite() {
        return this.fMat.every(v => Number.isFinite(v))
    }


    static ComputeInv(dst: number[] | Float32Array, src: number[] | Float32Array, invDet: number, isPersp: boolean) {
        if (isPersp) {
            dst[kMScaleX] = scross_dscale(src[kMScaleY], src[kMPersp2], src[kMTransY], src[kMPersp1], invDet);
            dst[kMSkewX]  = scross_dscale(src[kMTransX], src[kMPersp1], src[kMSkewX],  src[kMPersp2], invDet);
            dst[kMTransX] = scross_dscale(src[kMSkewX],  src[kMTransY], src[kMTransX], src[kMScaleY], invDet);
        
            dst[kMSkewY]  = scross_dscale(src[kMTransY], src[kMPersp0], src[kMSkewY],  src[kMPersp2], invDet);
            dst[kMScaleY] = scross_dscale(src[kMScaleX], src[kMPersp2], src[kMTransX], src[kMPersp0], invDet);
            dst[kMTransY] = scross_dscale(src[kMTransX], src[kMSkewY],  src[kMScaleX], src[kMTransY], invDet);
        
            dst[kMPersp0] = scross_dscale(src[kMSkewY],  src[kMPersp1], src[kMScaleY], src[kMPersp0], invDet);
            dst[kMPersp1] = scross_dscale(src[kMSkewX],  src[kMPersp0], src[kMScaleX], src[kMPersp1], invDet);
            dst[kMPersp2] = scross_dscale(src[kMScaleX], src[kMScaleY], src[kMSkewX],  src[kMSkewY],  invDet);
        } else {   // not perspective
            dst[kMScaleX] = SkDoubleToScalar(src[kMScaleY] * invDet);
            dst[kMSkewX]  = SkDoubleToScalar(-src[kMSkewX] * invDet);
            dst[kMTransX] = dcross_dscale(src[kMSkewX], src[kMTransY], src[kMScaleY], src[kMTransX], invDet);
        
            dst[kMSkewY]  = SkDoubleToScalar(-src[kMSkewY] * invDet);
            dst[kMScaleY] = SkDoubleToScalar(src[kMScaleX] * invDet);
            dst[kMTransY] = dcross_dscale(src[kMSkewY], src[kMTransX], src[kMScaleX], src[kMTransY], invDet);
        
            dst[kMPersp0] = 0;
            dst[kMPersp1] = 0;
            dst[kMPersp2] = 1;
        }
    }

    computeTypeMask() {
        let mask = 0;
        const fMat = this.fMat
        if (fMat[kMPersp0] != 0 || fMat[kMPersp1] != 0 || fMat[kMPersp2] != 1) {
            // Once it is determined that that this is a perspective transform,
            // all other flags are moot as far as optimizations are concerned.
            return (kORableMasks);
        }

        if (fMat[kMTransX] != 0 || fMat[kMTransY] != 0) {
            mask |= kTranslate_Mask;
        }

        let m00 = SkScalarAs2sCompliment(fMat[kMScaleX]);
        let m01 = SkScalarAs2sCompliment(fMat[kMSkewX]);
        let m10 = SkScalarAs2sCompliment(fMat[kMSkewY]);
        let m11 = SkScalarAs2sCompliment(fMat[kMScaleY]);

        if (m01 | m10) {
            // The skew components may be scale-inducing, unless we are dealing
            // with a pure rotation.  Testing for a pure rotation is expensive,
            // so we opt for being conservative by always setting the scale bit.
            // along with affine.
            // By doing this, we are also ensuring that matrices have the same
            // type masks as their inverses.
            mask |= kAffine_Mask | kScale_Mask;

            // For rectStaysRect, in the affine case, we only need check that
            // the primary diagonal is all zeros and that the secondary diagonal
            // is all non-zero.

            // map non-zero to 1
            m01 =Number( m01 != 0);
            m10 =Number( m10 != 0);

            let dp0 = 0 == (m00 | m11);  // true if both are 0
            let ds1 = m01 & m10;        // true if both are 1

            mask |= ((dp0 as any) & ds1) << kRectStaysRect_Shift;
        } else {
            // Only test for scale explicitly if not affine, since affine sets the
            // scale bit.
            if ((m00 ^ kScalar1Int) | (m11 ^ kScalar1Int)) {
                mask |= kScale_Mask;
            }

            // Not affine, therefore we already know secondary diagonal is
            // all zeros, so we just need to check that primary diagonal is
            // all non-zero.

            // map non-zero to 1
            m00 = Number(m00 != 0);
            m11 = Number(m11 != 0);

            // record if the (p)rimary diagonal is all non-zero
            mask |= (m00 & m11) << kRectStaysRect_Shift;
        }

        return mask;
    }
    computePerspectiveTypeMask() {
        const fMat = this.fMat
        // Benchmarking suggests that replacing this set of SkScalarAs2sCompliment
        // is a win, but replacing those below is not. We don't yet understand
        // that result.
        if (fMat[kMPersp0] != 0 || fMat[kMPersp1] != 0 || fMat[kMPersp2] != 1) {
            // If this is a perspective transform, we return true for all other
            // transform flags - this does not disable any optimizations, respects
            // the rule that the type mask must be conservative, and speeds up
            // type mask computation.
            return kORableMasks;
        }

        return kOnlyPerspectiveValid_Mask | kUnknown_Mask;
    }

    setTypeMask(mask:number) {

        this.fTypeMask = mask;
    }

    orTypeMask(mask: number) {

        this.fTypeMask |= mask;
    }

    clearTypeMask(mask: number) {

        this.fTypeMask &= ~mask;
    }

    getPerspectiveTypeMaskOnly() {
        const fTypeMask = this.fTypeMask
        if ((fTypeMask & kUnknown_Mask) &&
            !(fTypeMask & kOnlyPerspectiveValid_Mask)) {
            this.fTypeMask = this.computePerspectiveTypeMask();
        }
        return fTypeMask & 0xF;
    }

    /** Returns true if we already know that the matrix is identity;
        false otherwise.
    */
    isTriviallyIdentity() {
        if (this.fTypeMask & kUnknown_Mask) {
            return false;
        }
        return ((this.fTypeMask & 0xF) == 0);
    }

    updateTranslateMask() {
        const fMat = this.fMat
        if ((fMat[kMTransX] != 0) || (fMat[kMTransY] != 0)) {
            this.fTypeMask |= kTranslate_Mask;
        } else {
            this.fTypeMask &= ~kTranslate_Mask;
        }
    }

    static GetMapXYProc(mask: TypeMask) {

        return Matrix.gMapXYProcs[mask & kAllMasks];
    }

    getMapXYProc() {
        return Matrix.GetMapXYProc(this.getType());
    }

    static GetMapPtsProc(mask: TypeMask) {
        return Matrix.gMapPtsProcs[mask & kAllMasks];
    }

    getMapPtsProc() {
        return Matrix.GetMapPtsProc(this.getType());
    }
    clone() {
        return Matrix.identity().copy(this)
    }

    invertNonIdentity(inv?: Matrix) {

        let mask = this.getType();
        const fMat = this.fMat
        if (0 == (mask & ~(kScale_Mask | kTranslate_Mask))) {
            let invertible = true;
            if (inv) {
                if (mask & kScale_Mask) {
                    let invX = fMat[kMScaleX];
                    let invY = fMat[kMScaleY];
                    if (0 == invX || 0 == invY) {
                        return false;
                    }
                    invX = SkScalarInvert(invX);
                    invY = SkScalarInvert(invY);

                    // Must be careful when writing to inv, since it may be the
                    // same memory as this.

                    inv.fMat[kMSkewX] = inv.fMat[kMSkewY] =
                        inv.fMat[kMPersp0] = inv.fMat[kMPersp1] = 0;

                    inv.fMat[kMScaleX] = invX;
                    inv.fMat[kMScaleY] = invY;
                    inv.fMat[kMPersp2] = 1;
                    inv.fMat[kMTransX] = -fMat[kMTransX] * invX;
                    inv.fMat[kMTransY] = -fMat[kMTransY] * invY;

                    inv.setTypeMask(mask | kRectStaysRect_Mask);
                } else {
                    // translate only
                    inv.setTranslate(-fMat[kMTransX], -fMat[kMTransY]);
                }
            } else {    // inv is nullptr, just check if we're invertible
                if (!fMat[kMScaleX] || !fMat[kMScaleY]) {
                    invertible = false;
                }
            }
            return invertible;
        }

        let isPersp = mask & kPerspective_Mask;
        let invDet = sk_inv_determinant(fMat, isPersp);

        if (invDet == 0) { // underflow
            return false;
        }

        let applyingInPlace = (inv == this);

        let tmp = inv;

        let storage = Matrix.identity()
        if (applyingInPlace || !tmp) {
            tmp = storage;     // we either need to avoid trampling memory or have no memory
        }

        Matrix.ComputeInv(tmp.fMat, fMat, invDet, !!isPersp);
        if (!tmp.isFinite()) {
            return false;
        }

        tmp.setTypeMask(this.fTypeMask);

        if (applyingInPlace) {
            inv?.copy(storage)
        }

        return true;
    }
    static gMapXYProcs = [
        Matrix.Identity_xy, Matrix.Trans_xy,
        Matrix.Scale_xy, Matrix.ScaleTrans_xy,
        Matrix.Rot_xy, Matrix.RotTrans_xy,
        Matrix.Rot_xy, Matrix.RotTrans_xy,
        // repeat the persp proc 8 times
        Matrix.Persp_xy, Matrix.Persp_xy,
        Matrix.Persp_xy, Matrix.Persp_xy,
        Matrix.Persp_xy, Matrix.Persp_xy,
        Matrix.Persp_xy, Matrix.Persp_xy
    ]
    static gMapPtsProcs = [
        Matrix.Identity_pts, Matrix.Trans_pts,
        Matrix.Scale_pts, Matrix.Scale_pts,
        Matrix.Affine_vpts, Matrix.Affine_vpts,
        Matrix.Affine_vpts, Matrix.Affine_vpts,
        // repeat the persp proc 8 times
        Matrix.Persp_pts, Matrix.Persp_pts,
        Matrix.Persp_pts, Matrix.Persp_pts,
        Matrix.Persp_pts, Matrix.Persp_pts,
        Matrix.Persp_pts, Matrix.Persp_pts
    ];


    static Persp_xy(m: Matrix, sx: number, sy: number, pt: Point) {

        let x = sdot(sx, m.fMat[kMScaleX], sy, m.fMat[kMSkewX]) + m.fMat[kMTransX];
        let y = sdot(sx, m.fMat[kMSkewY], sy, m.fMat[kMScaleY]) + m.fMat[kMTransY];
        let z = sdot(sx, m.fMat[kMPersp0], sy, m.fMat[kMPersp1]) + m.fMat[kMPersp2];
        if (z) {
            z = 1 / z;
        }
        pt.x = x * z;
        pt.x = y * z;
    }

    static RotTrans_xy(m: Matrix, sx: number, sy: number,
        pt: Point) {

        pt.x = sdot(sx, m.fMat[kMScaleX], sy, m.fMat[kMSkewX]) + m.fMat[kMTransX];
        pt.y = sdot(sx, m.fMat[kMSkewY], sy, m.fMat[kMScaleY]) + m.fMat[kMTransY];
    }

    static Rot_xy(m: Matrix, sx: number, sy: number,
        pt: Point) {

        pt.x = sdot(sx, m.fMat[kMScaleX], sy, m.fMat[kMSkewX]) + m.fMat[kMTransX];
        pt.y = sdot(sx, m.fMat[kMSkewY], sy, m.fMat[kMScaleY]) + m.fMat[kMTransY];
    }

    static ScaleTrans_xy(m: Matrix, sx: number, sy: number,
        pt: Point) {
        pt.x = sx * m.fMat[kMScaleX] + m.fMat[kMTransX];
        pt.y = sy * m.fMat[kMScaleY] + m.fMat[kMTransY];
    }

    static Scale_xy(m: Matrix, sx: number, sy: number,
        pt: Point) {


        pt.x = sx * m.fMat[kMScaleX];
        pt.y = sy * m.fMat[kMScaleY];
    }

    static Trans_xy(m: Matrix, sx: number, sy: number,
        pt: Point) {


        pt.x = sx + m.fMat[kMTransX];
        pt.y = sy + m.fMat[kMTransY];
    }

    static Identity_xy(m: Matrix, sx: number, sy: number,
        pt: Point) {


        pt.x = sx;
        pt.y = sy;
    }



    static Identity_pts(m: Matrix, dst: Point[], src: Point[], count: number) {

        if (dst !== src && count > 0) {

            src.forEach((v, i) => {
                dst[i].copy(v)
            })
        }
    }

    static Trans_pts(m: Matrix, dst: Point[], src: Point[], count: number) {

        if (count > 0) {
            let tx = m.getTranslateX();
            let ty = m.getTranslateY();
            if (count & 1) {
                dst[0].x = src[0].x + tx;
                dst[0].y = src[0].y + ty;

            }
            let trans4 = FloatPoint.make(4).setElements([tx, ty, tx, ty]);
            let srcIndex = 0, dstIndex = 0
            count >>= 1;
            if (count & 1) {
                (FloatPoint.fromPoints(src, 2).add(trans4)).storePoints(dst);
                srcIndex += 2;
                dstIndex += 2;
            }
            count >>= 1;

            for (let i = 0; i < count; ++i) {
                FloatPoint.fromPoints(src.slice(dstIndex), 2).add(trans4).storePoints(dst.slice(dstIndex))
                FloatPoint.fromPoints(src.slice(srcIndex + 2), 2).add(trans4).storePoints(dst.slice(dstIndex + 2))
                srcIndex += 4;
                dstIndex += 4;
            }
        }
    }

    static Scale_pts(m: Matrix, dst: Point[], src: Point[], count: number) {
        let srcIndex = 0, dstIndex = 0
        if (count > 0) {
            let tx = m.getTranslateX();
            let ty = m.getTranslateY();
            let sx = m.getScaleX();
            let sy = m.getScaleY();
            let trans4 = FloatPoint.make(4).setElements([tx, ty, tx, ty]);

            let scale4 = FloatPoint.make(4).setElements([sx, sy, sx, sy]);
            if (count & 1) {

                let p = FloatPoint.make(4).setElements([src[0].x, src[0].y, 0, 0]);
                p.mul(scale4).add(trans4)
                dst[0].x = p[0];
                dst[0].y = p[1];
                srcIndex += 1;
                dstIndex += 1;
            }
            count >>= 1;
            if (count & 1) {
                (FloatPoint.fromPoints(src.slice(srcIndex), 2).mul(scale4).add(trans4)).storePoints(dst);
                srcIndex += 2;
                dstIndex += 2;
            }
            count >>= 1;
            for (let i = 0; i < count; ++i) {
                FloatPoint.fromPoints(src.slice(dstIndex), 2).mul(scale4).add(trans4).storePoints(dst.slice(dstIndex))
                FloatPoint.fromPoints(src.slice(srcIndex + 2), 2).mul(scale4).add(trans4).storePoints(dst.slice(dstIndex + 2))

                srcIndex += 4;
                dstIndex += 4;
            }
        }
    }

    static Persp_pts(m: Matrix, dst: Point[],
        src: Point[], count: number) {

        if (count > 0) {
            let i = 0, k = 0
            do {
                let sy = src[i].y;
                let sx = src[i].x;
                i += 1;

                let x = sdot(sx, m.fMat[kMScaleX], sy, m.fMat[kMSkewX]) + m.fMat[kMTransX];
                let y = sdot(sx, m.fMat[kMSkewY], sy, m.fMat[kMScaleY]) + m.fMat[kMTransY];
                let z = sdot(sx, m.fMat[kMPersp0], sy, m.fMat[kMPersp1]) + m.fMat[kMPersp2];
                if (z) {
                    z = 1 / z;
                }

                dst[k].y = y * z;
                dst[k].x = x * z;
                k += 1;
            } while (--count);
        }
    }

    static Affine_vpts(m: Matrix, dst: Point[], src: Point[], count: number) {

        if (count > 0) {
            let tx = m.getTranslateX();
            let ty = m.getTranslateY();
            let sx = m.getScaleX();
            let sy = m.getScaleY();
            let kx = m.getSkewX();
            let ky = m.getSkewY();
            let trans4 = FloatPoint.make(4).setElements([tx, ty, tx, ty]);
            let scale4 = FloatPoint.make(4).setElements([sx, sy, sx, sy]);
            let skew4 = FloatPoint.make(4).setElements([kx, ky, kx, ky]);    // applied to swizzle of src4
            let trailingElement = (count & 1);
            count >>= 1;
            let src4: FloatPoint = FloatPoint.make(4).setElements([0, 0, 0, 0]);
            let srcIndex = 0, dstIndex = 0;
            for (let i = 0; i < count; ++i) {
                src4 = FloatPoint.fromPoints(src.slice(srcIndex), 2);

                let swz4 = FloatPoint.make(4).setElements([1, 0, 3, 2].map(i => src4.elements[i]));  // y0 x0, y1 x1
                (src4.mul(scale4).add(swz4.mul(skew4)).add(trans4)).storePoints(dst);
                srcIndex += 2;
                dstIndex += 2;
            }
            if (trailingElement) {
                // We use the same logic here to ensure that the math stays consistent throughout, even
                // though the high float2 is ignored.
                const a = FloatPoint.fromPoints(src, 1);
                src4.elements[0] = a.x
                src4.elements[1] = a.y


                let swz4 = FloatPoint.make(4).setElements([1, 0, 3, 2].map(i => src4.elements[i]));  // y0 x0, y1 x1
                (src4.mul(scale4).add(swz4.mul(skew4)).add(trans4)).storePoints(dst);
            }
        }
    }


    static Poly2Proc(srcPt: Point[], dst: Matrix) {
        dst.fMat[kMScaleX] = srcPt[1].y - srcPt[0].y;
        dst.fMat[kMSkewY] = srcPt[0].x - srcPt[1].x;
        dst.fMat[kMPersp0] = 0;

        dst.fMat[kMSkewX] = srcPt[1].x - srcPt[0].x;
        dst.fMat[kMScaleY] = srcPt[1].y - srcPt[0].y;
        dst.fMat[kMPersp1] = 0;

        dst.fMat[kMTransX] = srcPt[0].x;
        dst.fMat[kMTransY] = srcPt[0].y;
        dst.fMat[kMPersp2] = 1;
        dst.setTypeMask(kUnknown_Mask);
        return true;
    }

    static Poly3Proc(srcPt: Point[], dst: Matrix) {
        dst.fMat[kMScaleX] = srcPt[2].x - srcPt[0].x;
        dst.fMat[kMSkewY] = srcPt[2].y - srcPt[0].y;
        dst.fMat[kMPersp0] = 0;

        dst.fMat[kMSkewX] = srcPt[1].x - srcPt[0].x;
        dst.fMat[kMScaleY] = srcPt[1].y - srcPt[0].y;
        dst.fMat[kMPersp1] = 0;

        dst.fMat[kMTransX] = srcPt[0].x;
        dst.fMat[kMTransY] = srcPt[0].y;
        dst.fMat[kMPersp2] = 1;
        dst.setTypeMask(kUnknown_Mask);
        return true;
    }

    static Poly4Proc(srcPt: Point[], dst: Matrix) {
        let a1, a2;
        let x0, y0, x1, y1, x2, y2;

        x0 = srcPt[2].x - srcPt[0].x;
        y0 = srcPt[2].y - srcPt[0].y;
        x1 = srcPt[2].x - srcPt[1].x;
        y1 = srcPt[2].y - srcPt[1].y;
        x2 = srcPt[2].x - srcPt[3].x;
        y2 = srcPt[2].y - srcPt[3].y;

        /* check if abs(x2) > abs(y2) */
        if (x2 > 0 ? y2 > 0 ? x2 > y2 : x2 > -y2 : y2 > 0 ? -x2 > y2 : x2 < y2) {
            let denom = sk_ieee_float_divide(x1 * y2, x2) - y1;
            if (checkForZero(denom)) {
                return false;
            }
            a1 = (((x0 - x1) * y2 / x2) - y0 + y1) / denom;
        } else {
            let denom = x1 - sk_ieee_float_divide(y1 * x2, y2);
            if (checkForZero(denom)) {
                return false;
            }
            a1 = (x0 - x1 - sk_ieee_float_divide((y0 - y1) * x2, y2)) / denom;
        }

        /* check if abs(x1) > abs(y1) */
        if (x1 > 0 ? y1 > 0 ? x1 > y1 : x1 > -y1 : y1 > 0 ? -x1 > y1 : x1 < y1) {
            let denom = y2 - sk_ieee_float_divide(x2 * y1, x1);
            if (checkForZero(denom)) {
                return false;
            }
            a2 = (y0 - y2 - sk_ieee_float_divide((x0 - x2) * y1, x1)) / denom;
        } else {
            let denom = sk_ieee_float_divide(y2 * x1, y1) - x2;
            if (checkForZero(denom)) {
                return false;
            }
            a2 = (sk_ieee_float_divide((y0 - y2) * x1, y1) - x0 + x2) / denom;
        }

        dst.fMat[kMScaleX] = a2 * srcPt[3].x + srcPt[3].x - srcPt[0].x;
        dst.fMat[kMSkewY] = a2 * srcPt[3].y + srcPt[3].y - srcPt[0].y;
        dst.fMat[kMPersp0] = a2;

        dst.fMat[kMSkewX] = a1 * srcPt[1].x + srcPt[1].x - srcPt[0].x;
        dst.fMat[kMScaleY] = a1 * srcPt[1].y + srcPt[1].y - srcPt[0].y;
        dst.fMat[kMPersp1] = a1;

        dst.fMat[kMTransX] = srcPt[0].x;
        dst.fMat[kMTransY] = srcPt[0].y;
        dst.fMat[kMPersp2] = 1;
        dst.setTypeMask(kUnknown_Mask);
        return true;
    }

    doNormalizePerspective() {
        // If the bottom row of the matrix is [0, 0, not_one], we will treat the matrix as if it
        // is in perspective, even though it stills behaves like its affine. If we divide everything
        // by the not_one value, then it will behave the same, but will be treated as affine,
        // and therefore faster (e.g. clients can forward-difference calculations).
        //
        let fMat = this.fMat
        if (0 == fMat[kMPersp0] && 0 == fMat[kMPersp1]) {
            let p2 = fMat[kMPersp2];
            if (p2 != 0 && p2 != 1) {
                let inv = 1.0 / p2;
                for (let i = 0; i < 6; ++i) {
                    fMat[i] = SkDoubleToScalar(fMat[i] * inv);
                }
                fMat[kMPersp2] = 1;
            }
            this.setTypeMask(kUnknown_Mask);
        }
    }
};

