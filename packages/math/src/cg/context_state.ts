import { Matrix } from "./matrix";
import { FillRule, Paint,Operator, LineCap, LineJoin } from "./paint";
import { Rle } from "./rle";
import { StrokeData } from "./stroke_data";


export class ContextState{
    static create(){
        const state=new ContextState();
      //  state.paint=Paint.default();
      //  state.matrix=Matrix.identity();
        state.winding=FillRule.NON_ZERO;
        state.stroke.width=1
        state.stroke.miterlimit=10
        state.stroke.cap=LineCap.BUTT;
        state.stroke.join=LineJoin.MITER;
        state.stroke.dash=null
        state.op=Operator.SRC_OVER
        state.opacity=1.0;
        state.next=null
        return state;
    }
    clipath:Rle|null=null;
    paint:Paint=Paint.default();
    matrix:Matrix=Matrix.identity();
    winding:FillRule=FillRule.NON_ZERO;
    stroke:StrokeData=new StrokeData();
    op:Operator=Operator.SRC_OVER
    opacity:float64=1.0;
    next:ContextState|null=null;

    copy(source:ContextState){
        this.clipath=source.clipath?source.clipath.clone():null;
        this.paint=source.paint.clone();
        this.matrix=source.matrix.clone()
        this.winding=source.winding;
        this.stroke=source.stroke.clone();
        this.op=source.op;
        this.opacity=source.opacity;
        this.next=null
        return this;
    }
    clone(){
        const state=new ContextState();
        state.copy(this);
        return state;
    }
    destroy(){

    }
}