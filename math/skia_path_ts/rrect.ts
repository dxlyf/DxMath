import { Ref } from "./util";
import { Point } from "./point";
import { Rect } from "./rect";
import { SK_Scalar1, SkScalarAve, SkScalarHalf, SkScalarNearlyEqual, SkScalarsAreFinite, SkScalarsAreFiniteArray, SkScalarsEqual, SkScalarSquare } from "./scalar";
function compute_min_scale(rad1, rad2, limit, curMin) {
    if ((rad1 + rad2) > limit) {
        return Math.min(curMin, limit / (rad1 + rad2));
    }
    return curMin;
}
/**
 * 模拟 C++ 中的 nextafterf 函数：
 * 返回从 x 向 y 方向的下一个可表示的 32 位浮点数。
 *
 * 注意：JavaScript 的数字是 64 位浮点数，所以这里我们用 Float32Array 来模拟 32 位浮点数操作。
 */
function nextafterf(x, y) {
    // 如果任一参数为 NaN，返回 NaN
    if (Number.isNaN(x) || Number.isNaN(y)) return NaN;

    // 如果 x 和 y 相等，直接返回 y
    if (x === y) return y;

    // 创建一个 4 字节的 ArrayBuffer，用于在 Float32 和 Int32 之间共享底层二进制数据
    const buffer = new ArrayBuffer(4);
    const f32 = new Float32Array(buffer);
    const i32 = new Int32Array(buffer);

    f32[0] = x;

    // 如果 x 为 0，返回正的或负的最小非零 32 位浮点数
    if (x === 0) {
        i32[0] = (y > 0) ? 1 : 0x80000001;
        return f32[0];
    }

    // 根据 x 和 y 的关系调整二进制表示
    // 对于正数：x < y 时，增加 bit（即下一个更大的数）；x > y 时，减少 bit
    // 对于负数：x < y 时，减少 bit；x > y 时，增加 bit
    if ((x < y) === (x > 0)) {
        i32[0]++;
    } else {
        i32[0]--;
    }

    return f32[0];
}

function AdjustRadii(limit, scale, a: Ref, b: Ref) {

    a.value = a.value * scale;
    b.value = b.value * scale;

    if (a.value + b.value > limit) {
        let minRadius = a;
        let maxRadius = b;

        // Force minRadius to be the smaller of the two.
        if (minRadius > maxRadius) {
            let tmp = minRadius
            minRadius = maxRadius
            maxRadius = tmp
        }

        // newMinRadius must be float in order to give the actual value of the radius.
        // The newMinRadius will always be smaller than limit. The largest that minRadius can be
        // is 1/2 the ratio of minRadius : (minRadius + maxRadius), therefore in the resulting
        // division, minRadius can be no larger than 1/2 limit + ULP.
        let newMinRadius = minRadius;

        let newMaxRadius = (limit - newMinRadius.value);

        // Reduce newMaxRadius an ulp at a time until it fits. This usually never happens,
        // but if it does it could be 1 or 2 times. In certain pathological cases it could be
        // more. Max iterations seen so far is 17.
        while (newMaxRadius + newMinRadius.value > limit) {
            newMaxRadius = nextafterf(newMaxRadius, 0);
        }
        maxRadius.value = newMaxRadius;
    }

}
function flush_to_zero(a: Ref, b: Ref) {

    if (a.value + b.value == a.value) {
        b.value = 0;
    } else if (a.value + b.value == b.value) {
        a.value = 0;
    }
}
function are_radius_check_predicates_valid(rad, min, max) {
    return (min <= max) && (rad <= max - min) && (min + rad <= max) && (max - rad >= min) &&
        rad >= 0;
}
function radii_are_nine_patch(radii: Point[]) {
    return radii[Corner.kUpperLeft_Corner].x == radii[Corner.kLowerLeft_Corner].x &&
        radii[Corner.kUpperLeft_Corner].y == radii[Corner.kUpperRight_Corner].y &&
        radii[Corner.kUpperRight_Corner].x == radii[Corner.kLowerRight_Corner].x &&
        radii[Corner.kLowerLeft_Corner].y == radii[Corner.kLowerRight_Corner].y;
}
function clamp_to_zero(radii: Point[]) {
    let allCornersSquare = true;

    // Clamp negative radii to zero
    for (let i = 0; i < 4; ++i) {
        if (radii[i].x <= 0 || radii[i].y <= 0) {
            // In this case we are being a little fast & loose. Since one of
            // the radii is 0 the corner is square. However, the other radii
            // could still be non-zero and play in the global scale factor
            // computation.
            radii[i].x = 0;
            radii[i].y = 0;
        } else {
            allCornersSquare = false;
        }
    }

    return allCornersSquare;
}
/** \enum SkRRect::Type
      Type describes possible specializations of SkRRect. Each Type is
      exclusive; a SkRRect may only have one type.
 
      Type members become progressively less restrictive; larger values of
      Type have more degrees of freedom than smaller values.
  */
enum RRect_Type {
    kEmpty_Type,                     //!< zero width or height
    kRect_Type,                      //!< non-zero width and height, and zeroed radii
    kOval_Type,                      //!< non-zero width and height filled with radii
    kSimple_Type,                    //!< non-zero width and height with equal radii
    kNinePatch_Type,                 //!< non-zero width and height with axis-aligned radii
    kComplex_Type,                   //!< non-zero width and height with arbitrary radii
    kLastType = kComplex_Type, //!< largest Type value
};
const kEmpty_Type = RRect_Type.kEmpty_Type
const kRect_Type = RRect_Type.kRect_Type
const kOval_Type = RRect_Type.kOval_Type
const kSimple_Type = RRect_Type.kSimple_Type
const kNinePatch_Type = RRect_Type.kNinePatch_Type
const kComplex_Type = RRect_Type.kComplex_Type
const kLastType = RRect_Type.kLastType

enum Corner {
    kUpperLeft_Corner,  //!< index of top-left corner radii
    kUpperRight_Corner, //!< index of top-right corner radii
    kLowerRight_Corner, //!< index of bottom-right corner radii
    kLowerLeft_Corner,  //!< index of bottom-left corner radii
};
const kUpperLeft_Corner = Corner.kUpperLeft_Corner
const kUpperRight_Corner = Corner.kUpperRight_Corner
const kLowerRight_Corner = Corner.kLowerRight_Corner
const kLowerLeft_Corner = Corner.kLowerLeft_Corner

export class RRect {
    static default() {
        const rrect = new this()
        return rrect
    }
    static from(rect: Rect, radii: Point[], fType: RRect_Type = kEmpty_Type) {
        const rrect = new this()
        rrect.fRect = rect
        rrect.fRadii = radii
        rrect.fType = fType
        return rrect

    }
    fRect: Rect = Rect.makeEmpty()
    fType: RRect_Type = RRect_Type.kEmpty_Type
    fRadii: Point[] = [Point.zero(), Point.zero(), Point.zero(), Point.zero()]
    constructor() {

    }




    getType() {
        return this.fType
    }

    get type() { return this.getType(); }

    isEmpty() { return kEmpty_Type == this.getType(); }
    isRect() { return kRect_Type == this.getType(); }
    isOval() { return kOval_Type == this.getType(); }
    isSimple() { return kSimple_Type == this.getType(); }
    isNinePatch() { return kNinePatch_Type == this.getType(); }
    isComplex() { return kComplex_Type == this.getType(); }

    /** Returns span on the x-axis. This does not check if result fits in 32-bit float;
        result may be infinity.
 
        @return  rect().fRight minus rect().fLeft
    */
    width() { return this.fRect.width; }

    /** Returns span on the y-axis. This does not check if result fits in 32-bit float;
        result may be infinity.
 
        @return  rect().fBottom minus rect().fTop
    */
    height() { return this.height; }

    /** Returns top-left corner radii. If type() returns kEmpty_Type, kRect_Type,
        kOval_Type, or kSimple_Type, returns a value representative of all corner radii.
        If type() returns kNinePatch_Type or kComplex_Type, at least one of the
        remaining three corners has a different value.
 
        @return  corner radii for simple types
    */
    getSimpleRadii() {
        return this.fRadii[0];
    }

    copy(source: RRect) {
        this.fRect.copy(source.fRect)
        this.fType = source.fType
        for (let i = 0; i < 4; i++) {
            this.fRadii[i].copy(source.fRadii[i])
        }
    }
    /** Sets bounds to zero width and height at (0, 0), the origin. Sets
        corner radii to zero and sets type to kEmpty_Type.
    */
    setEmpty() { this.copy(RRect.default()) }

    /** Sets bounds to sorted rect, and sets corner radii to zero.
        If set bounds has width and height, and sets type to kRect_Type;
        otherwise, sets type to kEmpty_Type.
    
        @param rect  bounds to set
    */
    setRect(rect: Rect) {
        if (!this.initializeRect(rect)) {
            return;
        }
        this.fRadii.forEach(p => {
            p.set(0, 0)
        })
        this.fType = kRect_Type;
    }

    /** Initializes bounds at (0, 0), the origin, with zero width and height.
        Initializes corner radii to (0, 0), and sets type of kEmpty_Type.
 
        @return  empty SkRRect
    */
    static makeEmpty() { return new this(); }

    /** Initializes to copy of r bounds and zeroes corner radii.
 
        @param r  bounds to copy
        @return   copy of r
    */
    static makeRect(r: Rect) {
        let rr = RRect.default();
        rr.setRect(r);
        return rr;
    }

    /** Sets bounds to oval, x-axis radii to half oval.width(), and all y-axis radii
        to half oval.height(). If oval bounds is empty, sets to kEmpty_Type.
        Otherwise, sets to kOval_Type.
 
        @param oval  bounds of oval
        @return      oval
    */
    static makeOval(oval: Rect) {
        let rr = RRect.default();
        rr.setOval(oval);
        return rr;
    }

    /** Sets to rounded rectangle with the same radii for all four corners.
        If rect is empty, sets to kEmpty_Type.
        Otherwise, if xRad and yRad are zero, sets to kRect_Type.
        Otherwise, if xRad is at least half rect.width() and yRad is at least half
        rect.height(), sets to kOval_Type.
        Otherwise, sets to kSimple_Type.
 
        @param rect  bounds of rounded rectangle
        @param xRad  x-axis radius of corners
        @param yRad  y-axis radius of corners
        @return      rounded rectangle
    */
    static makeRectXY(rect: Rect, xRad: number, yRad: number) {
        let rr = this.default();
        rr.setRectXY(rect, xRad, yRad);
        return rr;
    }

    setRadiiEmpty() {
        this.fRadii.forEach(p => {
            p.set(0, 0)
        })
    }

    /** Sets bounds to oval, x-axis radii to half oval.width(), and all y-axis radii
        to half oval.height(). If oval bounds is empty, sets to kEmpty_Type.
        Otherwise, sets to kOval_Type.
    
        @param oval  bounds of oval
    */
    setOval(oval: Rect) {
        if (!this.initializeRect(oval)) {
            return;
        }

        let xRad = this.fRect.halfWidth
        let yRad = this.fRect.halfHeight

        if (xRad == 0 || yRad == 0) {
            // All the corners will be square
            this.setRadiiEmpty()

            this.fType = kRect_Type;
        } else {
            for (let i = 0; i < 4; ++i) {
                this.fRadii[i].set(xRad, yRad);
            }
            this.fType = kOval_Type;
        }


    }

    /** Sets to rounded rectangle with the same radii for all four corners.
        If rect is empty, sets to kEmpty_Type.
        Otherwise, if xRad or yRad is zero, sets to kRect_Type.
        Otherwise, if xRad is at least half rect.width() and yRad is at least half
        rect.height(), sets to kOval_Type.
        Otherwise, sets to kSimple_Type.
    
        @param rect  bounds of rounded rectangle
        @param xRad  x-axis radius of corners
        @param yRad  y-axis radius of corners
    
        example: https://fiddle.skia.org/c/@RRect_setRectXY
    */
    setRectXY(rect: Rect, xRad: number, yRad: number) {
        if (!this.initializeRect(rect)) {
            return;
        }
        const fRect = this.fRect
        if (!SkScalarsAreFinite(xRad, yRad)) {
            xRad = yRad = 0;    // devolve into a simple rect
        }

        if (fRect.width < xRad + xRad || fRect.height < yRad + yRad) {
            // At most one of these two divides will be by zero, and neither numerator is zero.
            let scale = Math.min(fRect.width / (xRad + xRad), fRect.height / (yRad + yRad));

            xRad *= scale;
            yRad *= scale;
        }

        if (xRad <= 0 || yRad <= 0) {
            // all corners are square in this case
            this.setRect(rect);
            return;
        }

        for (let i = 0; i < 4; ++i) {
            this.fRadii[i].set(xRad, yRad);
        }
        this.fType = kSimple_Type;
        if (xRad >= SkScalarHalf(fRect.width) && yRad >= SkScalarHalf(fRect.height)) {
            this.fType = kOval_Type;
            // TODO: assert that all the x&y radii are already W/2 & H/2
        }
    }

    /** Sets bounds to rect. Sets radii to (leftRad, topRad), (rightRad, topRad),
        (rightRad, bottomRad), (leftRad, bottomRad).
    
        If rect is empty, sets to kEmpty_Type.
        Otherwise, if leftRad and rightRad are zero, sets to kRect_Type.
        Otherwise, if topRad and bottomRad are zero, sets to kRect_Type.
        Otherwise, if leftRad and rightRad are equal and at least half rect.width(), and
        topRad and bottomRad are equal at least half rect.height(), sets to kOval_Type.
        Otherwise, if leftRad and rightRad are equal, and topRad and bottomRad are equal,
        sets to kSimple_Type. Otherwise, sets to kNinePatch_Type.
    
        Nine patch refers to the nine parts defined by the radii: one center rectangle,
        four edge patches, and four corner patches.
    
        @param rect       bounds of rounded rectangle
        @param leftRad    left-top and left-bottom x-axis radius
        @param topRad     left-top and right-top y-axis radius
        @param rightRad   right-top and right-bottom x-axis radius
        @param bottomRad  left-bottom and right-bottom y-axis radius
    */
    setNinePatch(rect: Rect, leftRad: number, topRad: number, rightRad: number, bottomRad: number) {
        if (!this.initializeRect(rect)) {
            return;
        }
        const fRect = this.fRect

        const array: number[] = [leftRad, topRad, rightRad, bottomRad];
        if (!SkScalarsAreFiniteArray(array, 4)) {
            this.setRect(rect);    // devolve into a simple rect
            return;
        }

        leftRad = Math.max(leftRad, 0);
        topRad = Math.max(topRad, 0);
        rightRad = Math.max(rightRad, 0);
        bottomRad = Math.max(bottomRad, 0);

        let scale = SK_Scalar1;
        if (leftRad + rightRad > fRect.width) {
            scale = fRect.width / (leftRad + rightRad);
        }
        if (topRad + bottomRad > fRect.height) {
            scale = Math.min(scale, fRect.height / (topRad + bottomRad));
        }

        if (scale < SK_Scalar1) {
            leftRad *= scale;
            topRad *= scale;
            rightRad *= scale;
            bottomRad *= scale;
        }

        if (leftRad == rightRad && topRad == bottomRad) {
            if (leftRad >= SkScalarHalf(fRect.width) && topRad >= SkScalarHalf(fRect.height)) {
                this.fType = kOval_Type;
            } else if (0 == leftRad || 0 == topRad) {
                // If the left and (by equality check above) right radii are zero then it is a rect.
                // Same goes for top/bottom.
                this.fType = kRect_Type;
                leftRad = 0;
                topRad = 0;
                rightRad = 0;
                bottomRad = 0;
            } else {
                this.fType = kSimple_Type;
            }
        } else {
            this.fType = kNinePatch_Type;
        }

        this.fRadii[kUpperLeft_Corner].set(leftRad, topRad);
        this.fRadii[kUpperRight_Corner].set(rightRad, topRad);
        this.fRadii[kLowerRight_Corner].set(rightRad, bottomRad);
        this.fRadii[kLowerLeft_Corner].set(leftRad, bottomRad);
    }

    /** Sets bounds to rect. Sets radii array for individual control of all for corners.
    
        If rect is empty, sets to kEmpty_Type.
        Otherwise, if one of each corner radii are zero, sets to kRect_Type.
        Otherwise, if all x-axis radii are equal and at least half rect.width(), and
        all y-axis radii are equal at least half rect.height(), sets to kOval_Type.
        Otherwise, if all x-axis radii are equal, and all y-axis radii are equal,
        sets to kSimple_Type. Otherwise, sets to kNinePatch_Type.
    
        @param rect   bounds of rounded rectangle
        @param radii  corner x-axis and y-axis radii
    
        example: https://fiddle.skia.org/c/@RRect_setRectRadii
    */
    setRectRadii(rect: Rect, radii: Point[]) {
        if (!this.initializeRect(rect)) {
            return;
        }

        if (!SkScalarsAreFinite(radii[0].x, 8)) {
            this.setRect(rect);    // devolve into a simple rect
            return;
        }

        this.fRadii.forEach((p, i) => {
            p.copy(radii[i])
        })
        if (clamp_to_zero(this.fRadii)) {
            this.setRect(rect);
            return;
        }

        this.scaleRadii();

        if (!this.isValid()) {
            this.setRect(rect);
            return;
        }
    }

    /** \enum SkRRect::Corner
        The radii are stored: top-left, top-right, bottom-right, bottom-left.
    */


    /** Returns bounds. Bounds may have zero width or zero height. Bounds right is
        greater than or equal to left; bounds bottom is greater than or equal to top.
        Result is identical to getBounds().
    
        @return  bounding box
    */
    rect() { return this.fRect; }

    /** Returns scalar pair for radius of curve on x-axis and y-axis for one corner.
        Both radii may be zero. If not zero, both are positive and finite.
 
        @return        x-axis and y-axis radii for one corner
    */
    radii(corner: Corner) { return this.fRadii[corner]; }

    /** Returns bounds. Bounds may have zero width or zero height. Bounds right is
        greater than or equal to left; bounds bottom is greater than or equal to top.
        Result is identical to rect().
    
        @return  bounding box
    */
    getBounds() { return this.fRect; }

    /** Returns true if bounds and radii in a are equal to bounds and radii in b.
 
        a and b are not equal if either contain NaN. a and b are equal if members
        contain zeroes with different signs.
 
        @param a  SkRect bounds and radii to compare
        @param b  SkRect bounds and radii to compare
        @return   true if members are equal
    */
    equals(a: RRect, b: RRect) {
        return a.fRect == b.fRect && SkScalarsEqual(a.fRadii.map(d => d.x), b.fRadii.map(d => d.x), 4);
    }


    /** Returns true if bounds and radii in a are not equal to bounds and radii in b.
 
        a and b are not equal if either contain NaN. a and b are equal if members
        contain zeroes with different signs.
 
        @param a  SkRect bounds and radii to compare
        @param b  SkRect bounds and radii to compare
        @return   true if members are not equal
    */
    notEquals(a: RRect, b: RRect) {
        return a.fRect != b.fRect || !SkScalarsEqual(a.fRadii.map(d => d.x), b.fRadii.map(d => d.x), 4)
    }

    /** Copies SkRRect to dst, then insets dst bounds by dx and dy, and adjusts dst
        radii by dx and dy. dx and dy may be positive, negative, or zero. dst may be
        SkRRect.
    
        If either corner radius is zero, the corner has no curvature and is unchanged.
        Otherwise, if adjusted radius becomes negative, pins radius to zero.
        If dx exceeds half dst bounds width, dst bounds left and right are set to
        bounds x-axis center. If dy exceeds half dst bounds height, dst bounds top and
        bottom are set to bounds y-axis center.
    
        If dx or dy cause the bounds to become infinite, dst bounds is zeroed.
    
        @param dx   added to rect().fLeft, and subtracted from rect().fRight
        @param dy   added to rect().fTop, and subtracted from rect().fBottom
        @param dst  insets bounds and radii
    
        example: https://fiddle.skia.org/c/@RRect_inset
    */
    insetRect(dx: number, dy: number, dst: RRect) {
        const fRect = this.fRect
        let r = fRect.makeInset(dx, dy);
        let degenerate = false;
        if (r.right <= r.left) {
            degenerate = true;
            r.left = r.right = SkScalarAve(r.left, r.right);
        }
        if (r.bottom <= r.top) {
            degenerate = true;
            r.top = r.bottom = SkScalarAve(r.top, r.bottom);
        }
        if (degenerate) {
            dst.fRect.copy(r);

            dst.setRadiiEmpty()
            dst.fType = kEmpty_Type;
            return;
        }
        if (!r.isFinite()) {
            dst.setEmpty()
            return;
        }

        let radii = [Point.zero(), Point.zero(), Point.zero(), Point.zero()];

        radii.forEach((p, i) => {
            p.copy(this.fRadii[i])
        })
        for (let i = 0; i < 4; ++i) {
            if (radii[i].x) {
                radii[i].x -= dx;
            }
            if (radii[i].y) {
                radii[i].y -= dy;
            }
        }
        dst.setRectRadii(r, radii);
    }

    /** Insets bounds by dx and dy, and adjusts radii by dx and dy. dx and dy may be
        positive, negative, or zero.
    
        If either corner radius is zero, the corner has no curvature and is unchanged.
        Otherwise, if adjusted radius becomes negative, pins radius to zero.
        If dx exceeds half bounds width, bounds left and right are set to
        bounds x-axis center. If dy exceeds half bounds height, bounds top and
        bottom are set to bounds y-axis center.
    
        If dx or dy cause the bounds to become infinite, bounds is zeroed.
    
        @param dx  added to rect().fLeft, and subtracted from rect().fRight
        @param dy  added to rect().fTop, and subtracted from rect().fBottom
    */
    inset(dx: number, dy: number) {
        this.insetRect(dx, dy, this);
    }

    /** Outsets dst bounds by dx and dy, and adjusts radii by dx and dy. dx and dy may be
        positive, negative, or zero.
    
        If either corner radius is zero, the corner has no curvature and is unchanged.
        Otherwise, if adjusted radius becomes negative, pins radius to zero.
        If dx exceeds half dst bounds width, dst bounds left and right are set to
        bounds x-axis center. If dy exceeds half dst bounds height, dst bounds top and
        bottom are set to bounds y-axis center.
    
        If dx or dy cause the bounds to become infinite, dst bounds is zeroed.
    
        @param dx   subtracted from rect().fLeft, and added to rect().fRight
        @param dy   subtracted from rect().fTop, and added to rect().fBottom
        @param dst  outset bounds and radii
    */
    outsetRect(dx: number, dy: number, dst: RRect) {
        this.insetRect(-dx, -dy, dst);
    }

    /** Outsets bounds by dx and dy, and adjusts radii by dx and dy. dx and dy may be
        positive, negative, or zero.
    
        If either corner radius is zero, the corner has no curvature and is unchanged.
        Otherwise, if adjusted radius becomes negative, pins radius to zero.
        If dx exceeds half bounds width, bounds left and right are set to
        bounds x-axis center. If dy exceeds half bounds height, bounds top and
        bottom are set to bounds y-axis center.
    
        If dx or dy cause the bounds to become infinite, bounds is zeroed.
    
        @param dx  subtracted from rect().fLeft, and added to rect().fRight
        @param dy  subtracted from rect().fTop, and added to rect().fBottom
    */
    outset(dx: number, dy: number) {
        this.insetRect(-dx, -dy, this);
    }

    /** Translates SkRRect by (dx, dy).
    
        @param dx  offset added to rect().fLeft and rect().fRight
        @param dy  offset added to rect().fTop and rect().fBottom
    */
    offset(dx, dy) {
        this.fRect.offset(dx, dy);
    }

    /** Returns SkRRect translated by (dx, dy).
 
        @param dx  offset added to rect().fLeft and rect().fRight
        @param dy  offset added to rect().fTop and rect().fBottom
        @return    SkRRect bounds offset by (dx, dy), with unchanged corner radii
    */
    makeOffset(dx, dy) {
        return RRect.from(this.fRect.makeOffset(dx, dy), this.fRadii, this.fType);
    }

    /** Returns true if rect is inside the bounds and corner radii, and if
        SkRRect and rect are not empty.
 
        @param rect  area tested for containment
        @return      true if SkRRect contains rect
 
        example: https://fiddle.skia.org/c/@RRect_contains
    */
    contains(rect: Rect) {
        if (!this.getBounds().contains(rect)) {
            // If 'rect' isn't contained by the RR's bounds then the
            // RR definitely doesn't contain it
            return false;
        }

        if (this.isRect()) {
            // the prior test was sufficient
            return true;
        }

        // At this point we know all four corners of 'rect' are inside the
        // bounds of of this RR. Check to make sure all the corners are inside
        // all the curves
        return this.checkCornerContainment(rect.left, rect.top) &&
            this.checkCornerContainment(rect.right, rect.top) &&
            this.checkCornerContainment(rect.right, rect.bottom) &&
            this.checkCornerContainment(rect.left, rect.bottom);
    }

    /** Returns true if bounds and radii values are finite and describe a SkRRect
        SkRRect::Type that matches getType(). All SkRRect methods construct valid types,
        even if the input values are not valid. Invalid SkRRect data can only
        be generated by corrupting memory.
 
        @return  true if bounds and radii match type()
 
        example: https://fiddle.skia.org/c/@RRect_isValid
    */
    isValid() {
        if (!this.areRectAndRadiiValid(this.fRect, this.fRadii)) {
            return false;
        }
        let fRadii = this.fRadii
        let allRadiiZero = (0 == fRadii[0].x && 0 == fRadii[0].y);
        let allCornersSquare = (0 == fRadii[0].x || 0 == fRadii[0].y);
        let allRadiiSame = true;

        for (let i = 1; i < 4; ++i) {
            if (0 != fRadii[i].x || 0 != fRadii[i].y) {
                allRadiiZero = false;
            }

            if (fRadii[i].x != fRadii[i - 1].x || fRadii[i].y != fRadii[i - 1].y) {
                allRadiiSame = false;
            }

            if (0 != fRadii[i].x && 0 != fRadii[i].y) {
                allCornersSquare = false;
            }
        }
        let patchesOfNine = radii_are_nine_patch(fRadii);
        let fType = this.fType, fRect = this.fRect
        if (fType < 0 || fType > kLastType) {
            return false;
        }

        switch (fType) {
            case kEmpty_Type:
                if (!fRect.isEmpty() || !allRadiiZero || !allRadiiSame || !allCornersSquare) {
                    return false;
                }
                break;
            case kRect_Type:
                if (fRect.isEmpty() || !allRadiiZero || !allRadiiSame || !allCornersSquare) {
                    return false;
                }
                break;
            case kOval_Type:
                if (fRect.isEmpty() || allRadiiZero || !allRadiiSame || allCornersSquare) {
                    return false;
                }

                for (let i = 0; i < 4; ++i) {
                    if (!SkScalarNearlyEqual(fRadii[i].x, fRect.halfWidth) ||
                        !SkScalarNearlyEqual(fRadii[i].y, fRect.halfHeight)) {
                        return false;
                    }
                }
                break;
            case kSimple_Type:
                if (fRect.isEmpty() || allRadiiZero || !allRadiiSame || allCornersSquare) {
                    return false;
                }
                break;
            case kNinePatch_Type:
                if (fRect.isEmpty() || allRadiiZero || allRadiiSame || allCornersSquare ||
                    !patchesOfNine) {
                    return false;
                }
                break;
            case kComplex_Type:
                if (fRect.isEmpty() || allRadiiZero || allRadiiSame || allCornersSquare ||
                    patchesOfNine) {
                    return false;
                }
                break;
        }

        return true;
    }
    areRectAndRadiiValid(rect: Rect, radii: Point[]) {
        if (!rect.isFinite() || !rect.isSorted()) {
            return false;
        }
        for (let i = 0; i < 4; ++i) {
            if (!are_radius_check_predicates_valid(radii[i].x, rect.left, rect.right) ||
                !are_radius_check_predicates_valid(radii[i].y, rect.top, rect.bottom)) {
                return false;
            }
        }
        return true;
    }


    transform(matrix, dst) {

    }



    /**
     * Initializes fRect. If the passed in rect is not finite or empty the rrect will be fully
     * initialized and false is returned. Otherwise, just fRect is initialized and true is returned.
     */
    initializeRect(rect: Rect) {
        // Check this before sorting because sorting can hide nans.
        if (!rect.isFinite()) {
            this.setEmpty()
            return false;
        }
        this.fRect = rect.makeSorted();
        if (this.fRect.isEmpty()) {
            this.setRadiiEmpty()
            this.fType = kEmpty_Type;
            return false;
        }
        return true;
    }

    computeType() {
        const fRect = this.fRect
        if (fRect.isEmpty()) {

            this.fType = kEmpty_Type;
            return;
        }
        let fRadii = this.fRadii
        let allRadiiEqual = true; // are all x radii equal and all y radii?
        let allCornersSquare = 0 == fRadii[0].x || 0 == fRadii[0].y;

        for (let i = 1; i < 4; ++i) {
            if (0 != fRadii[i].x && 0 != fRadii[i].y) {
                // if either radius is zero the corner is square so both have to
                // be non-zero to have a rounded corner
                allCornersSquare = false;
            }
            if (fRadii[i].x != fRadii[i - 1].x || fRadii[i].y != fRadii[i - 1].y) {
                allRadiiEqual = false;
            }
        }

        if (allCornersSquare) {
            this.fType = kRect_Type;
            return;
        }

        if (allRadiiEqual) {
            if (fRadii[0].x >= SkScalarHalf(fRect.width) &&
                fRadii[0].y >= SkScalarHalf(fRect.height)) {
                this.fType = kOval_Type;
            } else {
                this.fType = kSimple_Type;
            }
            return;
        }

        if (radii_are_nine_patch(fRadii)) {
            this.fType = kNinePatch_Type;
        } else {
            this.fType = kComplex_Type;
        }

        if (!this.isValid()) {
            this.setRect(this.rect());

        }
    }
    checkCornerContainment(x, y) {
        let canonicalPt: Point = Point.default(); // (x,y) translated to one of the quadrants
        let index;
        const fRect = this.fRect, fRadii = this.fRadii
        if (kOval_Type == this.type) {
            canonicalPt.set(x - fRect.centerX, y - fRect.centerY);
            index = kUpperLeft_Corner;  // any corner will do in this case
        } else {
            if (x < fRect.left + fRadii[kUpperLeft_Corner].x &&
                y < fRect.top + fRadii[kUpperLeft_Corner].y) {
                // UL corner
                index = kUpperLeft_Corner;
                canonicalPt.set(x - (fRect.left + fRadii[kUpperLeft_Corner].x),
                    y - (fRect.top + fRadii[kUpperLeft_Corner].y));

            } else if (x < fRect.left + fRadii[kLowerLeft_Corner].x &&
                y > fRect.bottom - fRadii[kLowerLeft_Corner].y) {
                // LL corner
                index = kLowerLeft_Corner;
                canonicalPt.set(x - (fRect.left + fRadii[kLowerLeft_Corner].x),
                    y - (fRect.bottom - fRadii[kLowerLeft_Corner].y));

            } else if (x > fRect.right - fRadii[kUpperRight_Corner].x &&
                y < fRect.top + fRadii[kUpperRight_Corner].y) {
                // UR corner
                index = kUpperRight_Corner;
                canonicalPt.set(x - (fRect.right - fRadii[kUpperRight_Corner].x),
                    y - (fRect.top + fRadii[kUpperRight_Corner].y));

            } else if (x > fRect.right - fRadii[kLowerRight_Corner].x &&
                y > fRect.bottom - fRadii[kLowerRight_Corner].y) {
                // LR corner
                index = kLowerRight_Corner;
                canonicalPt.set(x - (fRect.right - fRadii[kLowerRight_Corner].x),
                    y - (fRect.bottom - fRadii[kLowerRight_Corner].y));

            } else {
                // not in any of the corners
                return true;
            }
        }

        // A point is in an ellipse (in standard position) if:
        //      x^2     y^2
        //     ----- + ----- <= 1
        //      a^2     b^2
        // or :
        //     b^2*x^2 + a^2*y^2 <= (ab)^2
        let dist = SkScalarSquare(canonicalPt.x) * SkScalarSquare(fRadii[index].y) +
            SkScalarSquare(canonicalPt.y) * SkScalarSquare(fRadii[index].x);
        return dist <= SkScalarSquare(fRadii[index].x * fRadii[index].x);
    }
    // Returns true if the radii had to be scaled to fit rect
    scaleRadii() {
        let scale = 1.0;
        const fRect = this.fRect, fRadii = this.fRadii
        // The sides of the rectangle may be larger than a float.
        let width = fRect.right - fRect.left;
        let height = fRect.bottom - fRect.top;
        scale = compute_min_scale(fRadii[0].x, fRadii[1].x, width, scale);
        scale = compute_min_scale(fRadii[1].y, fRadii[2].y, height, scale);
        scale = compute_min_scale(fRadii[2].x, fRadii[3].x, width, scale);
        scale = compute_min_scale(fRadii[3].y, fRadii[0].y, height, scale);

        let ref_0_x = Ref.from(fRadii[0].x)
        let ref_1_x = Ref.from(fRadii[1].x)
        let ref_2_x = Ref.from(fRadii[2].x)
        let ref_3_x = Ref.from(fRadii[3].x)

        let ref_0_y = Ref.from(fRadii[0].y)
        let ref_1_y = Ref.from(fRadii[1].y)
        let ref_2_y = Ref.from(fRadii[2].y)
        let ref_3_y = Ref.from(fRadii[3].y)

        flush_to_zero(ref_0_x, ref_1_x);
        flush_to_zero(ref_1_y, ref_2_y);
        flush_to_zero(ref_2_x, ref_3_x);
        flush_to_zero(ref_3_y, ref_0_y);

        if (scale < 1.0) {
            AdjustRadii(width, scale, ref_0_x, ref_1_x);
            AdjustRadii(height, scale, ref_1_y, ref_2_y);
            AdjustRadii(width, scale, ref_2_x, ref_3_x);
            AdjustRadii(height, scale, ref_3_y, ref_0_y);
        }

        // adjust radii may set x or y to zero; set companion to zero as well
        clamp_to_zero(fRadii);

        // May be simple, oval, or complex, or become a rect/empty if the radii adjustment made them 0
        this.computeType();

        // TODO:  Why can't we assert this here?
        //SkASSERT(this->isValid());

        return scale < 1.0;
    }
}

