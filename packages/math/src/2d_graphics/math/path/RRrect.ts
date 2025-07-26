import { Vector2, Vector2Like } from '../Vector2';
import { Rect, PointIterator } from './Rect'


export class RRectPointIterator extends PointIterator<Vector2> {
    constructor(rrect: RRect, ccw = false, index = 0) {
        super([], 8, ccw, index)
        const bounds = rrect.getBounds();
        const L = bounds.left;
        const T = bounds.top;
        const R = bounds.right;
        const B = bounds.bottom;
        const fPts: Vector2[] = []
        fPts[0] = Vector2.create(L + rrect.radii(RRect.kUpperLeft_Corner).x, T);
        fPts[1] = Vector2.create(R - rrect.radii(RRect.kUpperRight_Corner).x, T);
        fPts[2] = Vector2.create(R, T + rrect.radii(RRect.kUpperRight_Corner).y);
        fPts[3] = Vector2.create(R, B - rrect.radii(RRect.kLowerRight_Corner).y);
        fPts[4] = Vector2.create(R - rrect.radii(RRect.kLowerRight_Corner).x, B);
        fPts[5] = Vector2.create(L + rrect.radii(RRect.kLowerLeft_Corner).x, B);
        fPts[6] = Vector2.create(L, B - rrect.radii(RRect.kLowerLeft_Corner).y);
        fPts[7] = Vector2.create(L, T + rrect.radii(RRect.kUpperLeft_Corner).y);
        this.data = fPts;
    }
}
type RRectRadii = [Vector2, Vector2, Vector2, Vector2]
function clampToZero(radii: RRectRadii) {
    let allCornersSquare = true;
    for (let i = 0; i < 4; ++i) {
        if (radii[i].x <= 0 || radii[i].y <= 0) {
            radii[i].x = 0;
            radii[i].y = 0;
        } else {
            allCornersSquare = false;
        }
    }
    return allCornersSquare;
}
function computeMinScale(rad1: number, rad2: number, limit: number, curMin: number) {
    if ((rad1 + rad2) > limit) {
        return Math.min(curMin, limit / (rad1 + rad2));
    }
    return curMin;
}
function flushToZero(a: Vector2Like, b: Vector2Like, index: number) {
    if (a[index] + b[index] == a[index]) {
        b[index] = 0;
    } else if (a[index] + b[index] == b[index]) {
        a[index] = 0;
    }
}
function nextAfter(x: number, target: number) {
    // Simple implementation - may not handle all edge cases perfectly
    if (x === target) return x;
    const direction = x > target ? -1 : 1;
    const epsilon = Number.EPSILON * Math.abs(x) || Number.MIN_VALUE;
    return x + direction * epsilon;
};
function adjustRadii(limit: number, scale: number, a: Vector2Like, b: Vector2Like, valueIndex: number) {

    a[valueIndex] = a[valueIndex] * scale;
    b[valueIndex] = b[valueIndex] * scale;

    if (a[valueIndex] + b[valueIndex] > limit) {
        let minRadius = a;
        let maxRadius = b;

        // Force minRadius to be the smaller of the two.
        if (minRadius[valueIndex] > maxRadius[valueIndex]) {
            [maxRadius, minRadius] = [minRadius, maxRadius]
        }

        let newMinRadius = minRadius[valueIndex];

        let newMaxRadius = (limit - newMinRadius);

        while (newMaxRadius + newMinRadius > limit) {
            newMaxRadius = nextAfter(newMaxRadius, 0)
        }
        maxRadius[valueIndex] = newMaxRadius;
    }
}
function radii_are_nine_patch(radii: RRectRadii) {
    return radii[Corner.kUpperLeft_Corner].x == radii[Corner.kLowerLeft_Corner].x &&
        radii[Corner.kUpperLeft_Corner].y == radii[Corner.kUpperRight_Corner].y &&
        radii[Corner.kUpperRight_Corner].x == radii[Corner.kLowerRight_Corner].x &&
        radii[Corner.kLowerLeft_Corner].y == radii[Corner.kLowerRight_Corner].y;
}
function are_radius_check_predicates_valid(rad: number, min: number, max: number) {
    return (min <= max) && (rad <= max - min) && (min + rad <= max) && (max - rad >= min) &&
        rad >= 0;
}

enum RRectType {
    kEmpty_Type,                     //!< zero width or height
    kRect_Type,                      //!< non-zero width and height, and zeroed radii
    kOval_Type,                      //!< non-zero width and height filled with radii
    kSimple_Type,                    //!< non-zero width and height with equal radii
    kNinePatch_Type,                 //!< non-zero width and height with axis-aligned radii
    kComplex_Type,                   //!< non-zero width and height with arbitrary radii
    kLastType = kComplex_Type, //!< largest Type value
};
enum Corner {
    kUpperLeft_Corner,  //!< index of top-left corner radii
    kUpperRight_Corner, //!< index of top-right corner radii
    kLowerRight_Corner, //!< index of bottom-right corner radii
    kLowerLeft_Corner,  //!< index of bottom-left corner radii
};
export class RRect {
    static default() {
        return new RRect();
    }
    static fromRect(r: Rect) {
        return this.default().setRect(r)
    }
    static fromOval(oval: Rect) {
        return this.default().setOval(oval)
    }
    static kUpperLeft_Corner = Corner.kUpperLeft_Corner;
    static kUpperRight_Corner = Corner.kUpperRight_Corner;
    static kLowerRight_Corner = Corner.kLowerRight_Corner;
    static kLowerLeft_Corner = Corner.kLowerLeft_Corner;

    type = RRectType.kEmpty_Type;
    _rect = Rect.default()
    _radii: RRectRadii = [Vector2.default(), Vector2.default(), Vector2.default(), Vector2.default()];

    radii(index: number) {
        return this._radii[index];
    }
    getType() {
        return this.type;
    }
    getBounds() {
        return this._rect;
    }
    isEmpty() {
        return this.type == RRectType.kEmpty_Type;
    }
    isOval() {
        return this.type == RRectType.kOval_Type;
    }
    isRect() {
        return this.type == RRectType.kRect_Type;
    }
    resetRadii() {
        this._radii.forEach(v => {
            v.setXY(0, 0)
        })
    }
    copyDadii(radii: RRectRadii) {
        radii.forEach((v, i) => {
            this._radii[i].copy(v)
        })
    }
    scaleRadii() {
        let scale = 1.0, fRect = this._rect, fRadii = this._radii;

        // The sides of the rectangle may be larger than a float.
        let width = fRect.right - fRect.left;
        let height = fRect.bottom - fRect.top;
        scale = computeMinScale(fRadii[0].x, fRadii[1].x, width, scale);
        scale = computeMinScale(fRadii[1].y, fRadii[2].y, height, scale);
        scale = computeMinScale(fRadii[2].x, fRadii[3].x, width, scale);
        scale = computeMinScale(fRadii[3].y, fRadii[0].y, height, scale);


        flushToZero(fRadii[0], fRadii[1], 0);
        flushToZero(fRadii[1], fRadii[2], 1);
        flushToZero(fRadii[2], fRadii[3], 0);
        flushToZero(fRadii[3], fRadii[0], 1);

        if (scale < 1.0) {
            adjustRadii(width, scale, fRadii[0], fRadii[1], 0);
            adjustRadii(height, scale, fRadii[1], fRadii[2], 1);
            adjustRadii(width, scale, fRadii[2], fRadii[3], 0);
            adjustRadii(height, scale, fRadii[3], fRadii[0], 1);
        }

        // adjust radii may set x or y to zero; set companion to zero as well
        clampToZero(fRadii);

        // May be simple, oval, or complex, or become a rect/empty if the radii adjustment made them 0
        this.computeType();

        // TODO:  Why can't we assert this here?
     //   console.assert(this.isValid());

        return scale < 1.0;
    }

    initializeRect(rect: Rect) {
        // Check this before sorting because sorting can hide nans.
        if (!rect.isFinite()) {
            this._rect = Rect.default()
            return false;
        }
        this._rect = rect.makeSorted();
        if (this._rect.isEmpty()) {
            this.resetRadii()
            this.type = RRectType.kEmpty_Type;
            return false;
        }
        return true;
    }
    /**
     * 
     * @param rect 
     * @param radii [topLeft, topRight, bottomRight, bottomLeft] 
     */
    setRectRadii(rect: Rect, radii: RRectRadii) {
        if (!this.initializeRect(rect)) {
            return;
        }
        if (radii.every(v => v.x == 0)) {
            this.setRect(rect)
            return;
        }
        this.copyDadii(radii)

        if (clampToZero(this._radii)) {
            this.setRect(rect);
            return;
        }
        this.scaleRadii()
        if (!this.isValid()) {
            this.setRect(rect);
        }

    }
    setRect(rect: Rect) {
        this._rect.copy(rect)
        this.resetRadii()
        this.type = RRectType.kRect_Type;
        return this
    }
    setOval(oval: Rect) {
        if (oval.isEmpty() || !oval.isFinite()) {
            return;
        }
        this._rect.copy(oval.makeSorted())
        let xRad = this._rect.halfWidth;
        let yRad = this._rect.halfHeight

        if (xRad == 0 || yRad == 0) {
            this.resetRadii()
            this.type = RRectType.kRect_Type;
        } else {
            for (let i = 0; i < 4; ++i) {
                this._radii[i].setXY(xRad, yRad);
            }
            this.type = RRectType.kOval_Type;

        }
    }
    get width() {
        return this._rect.width
    }
    get height() {
        return this._rect.height
    }
    computeType() {
        if (this._rect.isEmpty()) {
            this.type = RRectType.kEmpty_Type;
            return;
        }
        let fRadii = this._radii, fRect = this._rect
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
            this.type = RRectType.kRect_Type;
            return;
        }

        if (allRadiiEqual) {
            if (fRadii[0].x >= (fRect.halfWidth) &&
                fRadii[0].y >= (fRect.halfHeight)) {
                this.type = RRectType.kOval_Type;
            } else {
                this.type = RRectType.kSimple_Type;
            }
            return;
        }

        if (radii_are_nine_patch(fRadii)) {
            this.type = RRectType.kNinePatch_Type;
        } else {
            this.type = RRectType.kComplex_Type;
        }

        if (!this.isValid()) {
            this.setRect(this._rect);
        }
    }
    areRectAndRadiiValid(rect: Rect, radii: RRectRadii) {
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
    isValid() {
        let fType = this.type, fRect = this._rect, fRadii = this._radii;
        if (!this.areRectAndRadiiValid(fRect, fRadii)) {
            return false;
        }

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

        if (fType < 0 || fType > RRectType.kLastType) {
            return false;
        }

        switch (fType) {
            case RRectType.kEmpty_Type:
                if (!fRect.isEmpty() || !allRadiiZero || !allRadiiSame || !allCornersSquare) {
                    return false;
                }
                break;
            case RRectType.kRect_Type:
                if (fRect.isEmpty() || !allRadiiZero || !allRadiiSame || !allCornersSquare) {
                    return false;
                }
                break;
            case RRectType.kOval_Type:
                if (fRect.isEmpty() || allRadiiZero || !allRadiiSame || allCornersSquare) {
                    return false;
                }

                for (let i = 0; i < 4; ++i) {
                    if (!(Math.abs(fRadii[i].x - fRect.halfWidth) <= 1e-6) || !(Math.abs(fRadii[i].y - fRect.halfHeight) <= 1e-6)) {
                        return false;
                    }
                }
                break;
            case RRectType.kSimple_Type:
                if (fRect.isEmpty() || allRadiiZero || !allRadiiSame || allCornersSquare) {
                    return false;
                }
                break;
            case RRectType.kNinePatch_Type:
                if (fRect.isEmpty() || allRadiiZero || allRadiiSame || allCornersSquare ||
                    !patchesOfNine) {
                    return false;
                }
                break;
            case RRectType.kComplex_Type:
                if (fRect.isEmpty() || allRadiiZero || allRadiiSame || allCornersSquare ||
                    patchesOfNine) {
                    return false;
                }
                break;
        }

        return true;
    }
}