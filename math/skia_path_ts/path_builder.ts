import { Path } from "./path";
import { PathDirection, PathFillType, PathSegmentMask, PathVerb } from "./path_types";
import { Point } from "./point";
import { Rect } from "./rect";
import { SkDegreesToRadians, SkScalarCos, SkScalarNearlyEqual, SkScalarSin } from "./scalar";

enum IsA {
    kIsA_JustMoves,     // we only have 0 or more moves
    kIsA_MoreThanMoves, // we have verbs other than just move
    kIsA_Oval,          // we are 0 or more moves followed by an oval
    kIsA_RRect,         // we are 0 or more moves followed by a rrect
};
enum ArcSize {
    kSmall_ArcSize, //!< smaller of arc pair
    kLarge_ArcSize, //!< larger of arc pair
};
function nearly_equal(a:Point, b:Point) {
    return SkScalarNearlyEqual(a.x, b.x)
        && SkScalarNearlyEqual(a.y, b.y);
}

function angles_to_unit_vectors(startAngle: number, sweepAngle: number,
    startV: Point, stopV: Point) {
    let startRad = startAngle * Math.PI / 180,
        stopRad = (startAngle + sweepAngle) * Math.PI / 180;

    const SkScalarSinSnapToZero = (v: number) => {
        v = Math.sin(v)
        return Math.abs(v) <= 1e-5 ? 0 : v;
    }
    const SkScalarCosSnapToZero = (v: number) => {
        v = Math.cos(v)
        return Math.abs(v) <= 1e-5 ? 0 : v;
    }
    /**
     * 返回具有 x 的绝对值但 y 符号的数值
     * 等价于 C++ 的 std::copysign(x, y)
     *
     * @param {number} x - 数值，其绝对值将被保留
     * @param {number} y - 数值，其符号将赋值给 x 的绝对值
     * @returns {number} 拥有 x 的绝对值及 y 符号的数值
     */
    function copysign(x: number, y: number) {
        // 当 y 为 0 时，需要区分正 0 与负 0
        if (y === 0) {
            return 1 / y === -Infinity ? -Math.abs(x) : Math.abs(x);
        }
        return y < 0 ? -Math.abs(x) : Math.abs(x);
    }
    startV.y = SkScalarSinSnapToZero(startRad);
    startV.x = SkScalarCosSnapToZero(startRad);
    stopV.y = SkScalarSinSnapToZero(stopRad);
    stopV.x = SkScalarCosSnapToZero(stopRad);

    /*  If the sweep angle is nearly (but less than) 360, then due to precision
    loss in radians-conversion and/or sin/cos, we may end up with coincident
    vectors, which will fool SkBuildQuadArc into doing nothing (bad) instead
    of drawing a nearly complete circle (good).
    e.g. canvas.drawArc(0, 359.99, ...)
    -vs- canvas.drawArc(0, 359.9, ...)
    We try to detect this edge case, and tweak the stop vector
    */
    if (startV.equalsEpsilon(stopV)) {
        let sw = Math.abs(sweepAngle);
        if (sw < 360 && sw > 359) {
            // make a guess at a tiny angle (in radians) to tweak by
            let deltaRad = copysign(1 / 512, sweepAngle);
            // not sure how much will be enough, so we use a loop
            do {
                stopRad -= deltaRad;
                stopV.y = SkScalarSinSnapToZero(stopRad);
                stopV.x = SkScalarCosSnapToZero(stopRad);
            } while (startV.equalsEpsilon(stopV));
        }
    }
    const dir = sweepAngle > 0 ? PathDirection.kCW : PathDirection.kCCW
    return {
        dir
    }
}
function arc_is_lone_point(oval: Rect, startAngle: number, sweepAngle: number, pt: Point) {
    if (0 == sweepAngle && (0 == startAngle || 360 == startAngle)) {
        //Chrome使用此路径进入椭圆形。如果不
        //被视为特殊情况，移动会使椭圆形变形
        //边界框（并打破圆形特殊情况）。
        pt.set(oval.right, oval.centerX);
        return true;
    } else if (0 == oval.width && 0 == oval.height) {
        //Chrome有时会创建0个半径圆形矩形。退化
        //路径中的四段段可防止路径被识别为
        //一个矩形。
        //todo：优化宽度或高度之一的情况
        //也应考虑。但是，这种情况似乎并不是
        //与单点案例一样常见。
        pt.set(oval.right, oval.top);
        return true;
    }
    return false;
}
export class  PathBuilder {
    static IsA=IsA
    static default(){

    }
    static fromPathFillType(fillType:PathFillType){
        //return new PathBuilder().setFillType(fillType);
    }
    static fromPath(path:Path){
       // return new PathBuilder().setFillType(path.getFillType()).addPath(path);
    }
    static fromPathBuilder(builder:PathBuilder){
       // return new PathBuilder().setFillType(builder.getFillType()).addPath(builder);
    }
    fPts:Point[]=[]
    fVerbs:PathVerb[]=[];
    fConicWeights:number[]=[];
    fFillType:PathFillType=PathFillType.kWinding
   
    fIsVolatile:boolean=false;
   
    fSegmentMask:number;
    fLastMovePoint=Point.zero();
    fLastMoveIndex:number=-1; // only needed until SkPath is immutable
    fNeedsMoveVerb:boolean=true;
   
   
    fIsA:IsA      = IsA.kIsA_JustMoves;
     fIsAStart:number = -1;     // tracks direction iff fIsA is not unknown
     fIsACCW  = false;  // tracks direction iff fIsA is not unknown
   
     countVerbs()  { return this.fVerbs.length; }
   
    // called right before we add a (non-move) verb
     ensureMove() {
        this.fIsA = IsA.kIsA_MoreThanMoves;
        if (this.fNeedsMoveVerb) {
            this.moveTo(this.fLastMovePoint.x,this.fLastMovePoint.y);
        }
    }
   
  
     privateReverseAddPath(src:Path){

            // const  verbsBegin = src.fPathRef.verbsBegin();
            // const  verbs = src.fPathRef.verbsEnd();
            // const pts = src.fPathRef->pointsEnd();
            // const conicWeights = src.fPathRef->conicWeightsEnd();

            // let needMove = true;
            // let needClose = false;
            // while (verbs > verbsBegin) {
            //     let v = --verbs;
            //     let n = SkPathPriv::PtsInVerb(v);

            //     if (needMove) {
            //         --pts;
            //         this->moveTo(pts->fX, pts->fY);
            //         needMove = false;
            //     }
            //     pts -= n;
            //     switch ((SkPathVerb)v) {
            //         case SkPathVerb::kMove:
            //             if (needClose) {
            //                 this->close();
            //                 needClose = false;
            //             }
            //             needMove = true;
            //             pts += 1;   // so we see the point in "if (needMove)" above
            //             break;
            //         case SkPathVerb::kLine:
            //             this->lineTo(pts[0]);
            //             break;
            //         case SkPathVerb::kQuad:
            //             this->quadTo(pts[1], pts[0]);
            //             break;
            //         case SkPathVerb::kConic:
            //             this->conicTo(pts[1], pts[0], *--conicWeights);
            //             break;
            //         case SkPathVerb::kCubic:
            //             this->cubicTo(pts[2], pts[1], pts[0]);
            //             break;
            //         case SkPathVerb::kClose:
            //             needClose = true;
            //             break;
            //         default:
            //             SkDEBUGFAIL("unexpected verb");
            //     }
            // }
        return this;
     }
  
    fillType(){
        return this.fFillType
    }
    computeBounds(){
        let bounds=Rect.makeEmpty(),fPts=this.fPts;
        bounds.setBounds(fPts, fPts.length);
        return bounds;
    }

     snapshot(){

     }  // the builder is unchanged after returning this path
     detach()    // the builder is reset to empty after returning this path
    {
        // let path = this.make(new SkPathRef(std::move(fPts),
        //                                               std::move(fVerbs),
        //                                               std::move(fConicWeights),
        //                                               fSegmentMask)));
            this.reset();
           // return path;
    }
    setFillType(ft:PathFillType) { this.fFillType = ft; return this; }
    setIsVolatile(isVolatile:boolean) { this.fIsVolatile = isVolatile; return this; }

     reset(){

     }

    moveTo(x:number,y:number):PathBuilder;
    moveTo(x:Point):PathBuilder;
    moveTo(x:Point|number,y?:number) {
        let pt:Point=typeof x==="number"?Point.create(x,y!):x;  
        // only needed while SkPath is mutable
        this.fLastMoveIndex = this.fPts.length

        this.fPts.push(pt);
        this.fVerbs.push(PathVerb.kMove);
        this.fLastMovePoint = pt;
        this.fNeedsMoveVerb = false;
        return this;
}

    lineTo(x:number,y:number):PathBuilder;
    lineTo(x:Point):PathBuilder;
    lineTo(x:Point|number,y?:number) {
        let pt:Point=typeof x==="number"?Point.create(x,y!):x;  
        
        this.ensureMove();
        this.fPts.push(pt);
        this.fVerbs.push(PathVerb.kLine);
        this.fSegmentMask |= PathSegmentMask.kLine_SkPathSegmentMask;
        return this;
    }
    quadTo(x1:number, y1:number, x2:number, y2:number):PathBuilder
    quadTo(p1:Point,p2:Point):PathBuilder
    quadTo(x1:Point|number,y1:Point|number,x2?:number,y2?:number) {
        let pt1:Point=typeof x1==="number"?Point.create(x1,y1 as number):x1;  
        let pt2:Point=typeof y1==="number"?Point.create(x2!,y2!):y1;  
        this.ensureMove();
    
        this.fPts.push(pt1);
        this.fPts.push(pt2);
        this.fVerbs.push(PathVerb.kQuad);
    
        this.fSegmentMask |= PathSegmentMask.kQuad_SkPathSegmentMask;
        return this;
    }
  
    conicTo(x1:number,y1:number,x2:number,y2:number,w:number):PathBuilder
    conicTo(p1:Point,p2:Point,w:number):PathBuilder
    conicTo(x1:Point|number,y1:Point|number,x2:number,y2?:number,w?:number) {
        let pt1:Point=typeof x1==="number"?Point.create(x1,y1 as number):x1;  
        let pt2:Point=typeof y1==="number"?Point.create(x2,y2!):y1;  
        let weight=typeof x1==='number'?w!:y2!;
        this.ensureMove();
    
        this.fPts.push(pt1);
        this.fPts.push(pt2);
        this.fVerbs.push(PathVerb.kConic);

        this.fConicWeights.push(weight);
    
        this.fSegmentMask |= PathSegmentMask.kConic_SkPathSegmentMask;
        return this;
    }
    cubicTo(x1:number,y1:number,x2:number,y2:number,x3:number,y3:number):PathBuilder
    cubicTo(p1:Point,p2:Point,p3:Point):PathBuilder
    cubicTo(x1:Point|number,y1:Point|number,x2:Point|number,y2?:number,x3?:number,y3?:number) {
        this.ensureMove();
        let pt1:Point=typeof x1==="number"?Point.create(x1,y1 as number):x1;  
        let pt2:Point=typeof y1==="number"?Point.create(x2 as number,y2!):y1;  
        let pt3:Point=typeof x2==="number"?Point.create(x3!,y3! as number):x2;  

        this.fPts.push(pt1);
        this.fPts.push(pt2);
        this.fPts.push(pt3);
        this.fVerbs.push(PathVerb.kCubic);
    
        this.fSegmentMask |= PathSegmentMask.kCubic_SkPathSegmentMask;
        return this;
    }
    close(){
        if (this.fVerbs.length<=0) {
            this.ensureMove();
       
            this.fVerbs.push(PathVerb.kClose);
       
            // fLastMovePoint stays where it is -- the previous moveTo
            this.fNeedsMoveVerb = true;
        }
        return this;
    }
    get lastPoint(){
        return this.fPts[this.fPts.length-1];
    }

    // Append a series of lineTo(...)
    polylineTo(pts:Point[]){
        if (pts.length > 0) {
            this.ensureMove();
            for (let i = 0; i < pts.length; ++i) {
                this.fPts.push(pts[i]);
                this.fVerbs.push(PathVerb.kLine);
            }
            this.fSegmentMask |= PathSegmentMask.kLine_SkPathSegmentMask;
        }
        return this;
    }
    
    rLineTo(x:number, y:number) { 
        this.ensureMove();
        return this.lineTo(this.lastPoint.x+x,this.lastPoint.y+y);
     }
    rQuadTo( p1:Point, p2:Point){
        this.ensureMove();
        let base = this.lastPoint;
        return this.quadTo(base.x+p1.x,base.y+p1.y, base.x + p2.x,base.y+p2.y);
    }
   
     rConicTo(p1:Point,p2:Point,w:number){
        this.ensureMove();
        let base = this.lastPoint;
        return this.conicTo(base.x+p1.x,base.y+p1.y, base.x + p2.x,base.y+p2.y,w);
     }
    rCubicTo( p1:Point, p2:Point,p3:Point){
        this.ensureMove();
        let base = this.lastPoint;
        return this.cubicTo(base.x+p1.x,base.y+p1.y, base.x + p2.x,base.y+p2.y,base.x + p3.x,base.y+p3.y);
    }

    // Arcs

    /** Appends arc to the builder. Arc added is part of ellipse
        bounded by oval, from startAngle through sweepAngle. Both startAngle and
        sweepAngle are measured in degrees, where zero degrees is aligned with the
        positive x-axis, and positive sweeps extends arc clockwise.

        arcTo() adds line connecting the builder's last point to initial arc point if forceMoveTo
        is false and the builder is not empty. Otherwise, added contour begins with first point
        of arc. Angles greater than -360 and less than 360 are treated modulo 360.

        @param oval          bounds of ellipse containing arc
        @param startAngleDeg starting angle of arc in degrees
        @param sweepAngleDeg sweep, in degrees. Positive is clockwise; treated modulo 360
        @param forceMoveTo   true to start a new contour with arc
        @return              reference to the builder
    */
      arcToOval(oval:Rect,startAngleDeg:number,sweepAngleDeg:number,forceMoveTo:boolean){
                            if (oval.width < 0 || oval.height < 0) {
                                return this;
                            }
                            const fVerbs=this.fVerbs
                            
                            if (fVerbs.length<=0) {
                                forceMoveTo = true;
                            }
                            
                            let lonePt=Point.default();
                            if (arc_is_lone_point(oval, startAngleDeg, sweepAngleDeg,lonePt)) {
                                return forceMoveTo ? this.moveTo(lonePt) : this.lineTo(lonePt);
                            }
                            
                            let startV, stopV;
                     
                            let {dir}=angles_to_unit_vectors(startAngleDeg, sweepAngleDeg, startV, stopV);
                            
                            let singlePt=Point.default();
                            
                            // Adds a move-to to 'pt' if forceMoveTo is true. Otherwise a lineTo unless we're sufficiently
                            // close to 'pt' currently. This prevents spurious lineTos when adding a series of contiguous
                            // arcs from the same oval.
                            let addPt = (pt:Point)=> {
                                if (forceMoveTo) {
                                    this.moveTo(pt);
                                } else if (!nearly_equal(this.lastPoint, pt)) {
                                    this.lineTo(pt);
                                }
                            };
                            
                            // At this point, we know that the arc is not a lone point, but startV == stopV
                            // indicates that the sweepAngle is too small such that angles_to_unit_vectors
                            // cannot handle it.
                            if (startV == stopV) {
                                let endAngle = SkDegreesToRadians(startAngleDeg + sweepAngleDeg);
                                let radiusX = oval.width / 2;
                                let radiusY = oval.height / 2;
                                // We do not use SkScalar[Sin|Cos]SnapToZero here. When sin(startAngle) is 0 and sweepAngle
                                // is very small and radius is huge, the expected behavior here is to draw a line. But
                                // calling SkScalarSinSnapToZero will make sin(endAngle) be 0 which will then draw a dot.
                                singlePt.set(oval.centerX + radiusX * SkScalarCos(endAngle),
                                             oval.centerY + radiusY * SkScalarSin(endAngle));
                                addPt(singlePt);
                                return this;
                            }
                            
                            let conics=new Array(5);
                            let count = build_arc_conics(oval, startV, stopV, dir, conics, &singlePt);
                            if (count) {
                                this.incReserve(count * 2 + 1);
                                const SkPoint& pt = conics[0].fPts[0];
                                addPt(pt);
                                for (int i = 0; i < count; ++i) {
                                    this->conicTo(conics[i].fPts[1], conics[i].fPts[2], conics[i].fW);
                                }
                            } else {
                                addPt(singlePt);
                            }
                            return this;
                         }

    /** Appends arc to SkPath, after appending line if needed. Arc is implemented by conic
        weighted to describe part of circle. Arc is contained by tangent from
        last SkPath point to p1, and tangent from p1 to p2. Arc
        is part of circle sized to radius, positioned so it touches both tangent lines.

        If last SkPath SkPoint does not start arc, arcTo() appends connecting line to SkPath.
        The length of vector from p1 to p2 does not affect arc.

        Arc sweep is always less than 180 degrees. If radius is zero, or if
        tangents are nearly parallel, arcTo() appends line from last SkPath SkPoint to p1.

        arcTo() appends at most one line and one conic.
        arcTo() implements the functionality of PostScript arct and HTML Canvas arcTo.

        @param p1      SkPoint common to pair of tangents
        @param p2      end of second tangent
        @param radius  distance from arc to circle center
        @return        reference to SkPath
    */
    arcToPoint(SkPoint p1, SkPoint p2, SkScalar radius){

    }

  
    /** Appends arc to SkPath. Arc is implemented by one or more conic weighted to describe
        part of oval with radii (r.fX, r.fY) rotated by xAxisRotate degrees. Arc curves
        from last SkPath SkPoint to (xy.fX, xy.fY), choosing one of four possible routes:
        clockwise or counterclockwise,
        and smaller or larger.

        Arc sweep is always less than 360 degrees. arcTo() appends line to xy if either
        radii are zero, or if last SkPath SkPoint equals (xy.fX, xy.fY). arcTo() scales radii r to
        fit last SkPath SkPoint and xy if both are greater than zero but too small to describe
        an arc.

        arcTo() appends up to four conic curves.
        arcTo() implements the functionality of SVG arc, although SVG sweep-flag value is
        opposite the integer value of sweep; SVG sweep-flag uses 1 for clockwise, while
        kCW_Direction cast to int is zero.

        @param r            radii on axes before x-axis rotation
        @param xAxisRotate  x-axis rotation in degrees; positive values are clockwise
        @param largeArc     chooses smaller or larger arc
        @param sweep        chooses clockwise or counterclockwise arc
        @param xy           end of arc
        @return             reference to SkPath
    */
    SkPathBuilder& arcTo(SkPoint r, SkScalar xAxisRotate, ArcSize largeArc, SkPathDirection sweep,
                         SkPoint xy);

    /** Appends arc to the builder, as the start of new contour. Arc added is part of ellipse
        bounded by oval, from startAngle through sweepAngle. Both startAngle and
        sweepAngle are measured in degrees, where zero degrees is aligned with the
        positive x-axis, and positive sweeps extends arc clockwise.

        If sweepAngle <= -360, or sweepAngle >= 360; and startAngle modulo 90 is nearly
        zero, append oval instead of arc. Otherwise, sweepAngle values are treated
        modulo 360, and arc may or may not draw depending on numeric rounding.

        @param oval          bounds of ellipse containing arc
        @param startAngleDeg starting angle of arc in degrees
        @param sweepAngleDeg sweep, in degrees. Positive is clockwise; treated modulo 360
        @return              reference to this builder
    */
    SkPathBuilder& addArc(const SkRect& oval, SkScalar startAngleDeg, SkScalar sweepAngleDeg);

    // Add a new contour

    SkPathBuilder& addRect(const SkRect&, SkPathDirection, unsigned startIndex);
    SkPathBuilder& addOval(const SkRect&, SkPathDirection, unsigned startIndex);
    SkPathBuilder& addRRect(const SkRRect&, SkPathDirection, unsigned startIndex);

    SkPathBuilder& addRect(const SkRect& rect, SkPathDirection dir = SkPathDirection::kCW) {
        return this->addRect(rect, dir, 0);
    }
    SkPathBuilder& addOval(const SkRect& rect, SkPathDirection dir = SkPathDirection::kCW) {
        // legacy start index: 1
        return this->addOval(rect, dir, 1);
    }
    SkPathBuilder& addRRect(const SkRRect& rrect, SkPathDirection dir = SkPathDirection::kCW) {
        // legacy start indices: 6 (CW) and 7 (CCW)
        return this->addRRect(rrect, dir, dir == SkPathDirection::kCW ? 6 : 7);
    }

    SkPathBuilder& addCircle(SkScalar center_x, SkScalar center_y, SkScalar radius,
                             SkPathDirection dir = SkPathDirection::kCW);

    SkPathBuilder& addPolygon(const SkPoint pts[], int count, bool isClosed);
    SkPathBuilder& addPolygon(const std::initializer_list<SkPoint>& list, bool isClosed) {
        return this->addPolygon(list.begin(), SkToInt(list.size()), isClosed);
    }

    SkPathBuilder& addPath(const SkPath&);

    // Performance hint, to reserve extra storage for subsequent calls to lineTo, quadTo, etc.

    void incReserve(int extraPtCount, int extraVerbCount);
    void incReserve(int extraPtCount) {
        this->incReserve(extraPtCount, extraPtCount);
    }

    SkPathBuilder& offset(SkScalar dx, SkScalar dy);

    SkPathBuilder& toggleInverseFillType() {
        fFillType = (SkPathFillType)((unsigned)fFillType ^ 2);
        return *this;
    }
};


