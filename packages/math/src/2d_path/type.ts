export enum AddPathMode {
    kAppend_AddPathMode, //!< appended to destination unaltered
    kExtend_AddPathMode, //!< add line if prior contour is not closed
};

export enum RotationDirection {
    kCW_SkRotationDirection,
    kCCW_SkRotationDirection
};
export enum ArcSize {
    kSmall_ArcSize, //!< smaller of arc pair
    kLarge_ArcSize, //!< larger of arc pair
};
export enum PathFillType {
    /** Specifies that "inside" is computed by a non-zero sum of signed edge crossings */
    kWinding,
    /** Specifies that "inside" is computed by an odd number of edge crossings */
    kEvenOdd,
    /** Same as Winding, but draws outside of the path, rather than inside */
    kInverseWinding,
    /** Same as EvenOdd, but draws outside of the path, rather than inside */
    kInverseEvenOdd
};
export enum PathSegmentMask {
    kLine_SkPathSegmentMask = 1 << 0,
    kQuad_SkPathSegmentMask = 1 << 1,
    kConic_SkPathSegmentMask = 1 << 2,
    kCubic_SkPathSegmentMask = 1 << 3,
};
export enum PathVerb {
    MoveTo,
    LineTo,
    QuadTo,
    CubicTo,
    Close
}
export enum IsA {
    kIsA_JustMoves,     // we only have 0 or more moves
    kIsA_MoreThanMoves, // we have verbs other than just move
    kIsA_Oval,          // we are 0 or more moves followed by an oval
    kIsA_RRect,         // we are 0 or more moves followed by a rrect
};
export enum PathDirection {
    /** clockwise direction for adding closed contours */
    kCW,
    /** counter-clockwise direction for adding closed contours */
    kCCW,
};