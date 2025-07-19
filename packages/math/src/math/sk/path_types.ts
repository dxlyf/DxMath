export enum  PathFillType {
    /** Specifies that "inside" is computed by a non-zero sum of signed edge crossings */
    kWinding,
    /** Specifies that "inside" is computed by an odd number of edge crossings */
    kEvenOdd,
    /** Same as Winding, but draws outside of the path, rather than inside */
    kInverseWinding,
    /** Same as EvenOdd, but draws outside of the path, rather than inside */
    kInverseEvenOdd
};

export enum  PathDirection {
    /** clockwise direction for adding closed contours */
    kCW,
    /** counter-clockwise direction for adding closed contours */
    kCCW,
};

export enum PathSegmentMask {
    kLine_SkPathSegmentMask   = 1 << 0,
    kQuad_SkPathSegmentMask   = 1 << 1,
    kConic_SkPathSegmentMask  = 1 << 2,
    kCubic_SkPathSegmentMask  = 1 << 3,
};

export enum  PathVerb {
    kMove,   //!< SkPath::RawIter returns 1 point
    kLine,   //!< SkPath::RawIter returns 2 points
    kQuad,   //!< SkPath::RawIter returns 3 points
    kConic,  //!< SkPath::RawIter returns 3 points + 1 weight
    kCubic,  //!< SkPath::RawIter returns 4 points
    kClose   //!< SkPath::RawIter returns 0 points
};
export enum PathIterVerb {
    kMoveTo = PathVerb.kMove,
    kLineTo = PathVerb.kLine,
    kQuadCurveTo = PathVerb.kQuad,
    kConicTo = PathVerb.kConic,
    kCubicCurveTo = PathVerb.kCubic,
    kClose = PathVerb.kClose,
    kDone = PathVerb.kClose + 1
}
export function PathFillType_IsInverse(ft:PathFillType) {
    return ((ft) & 2) != 0;
}