import { Dash } from "./dash"
import { LineCap,LineJoin } from "./paint"


export class StrokeData{
    width:float64=1
    miterlimit=10
    cap:LineCap=LineCap.BUTT
    join:LineJoin=LineJoin.MITER
    dash:Dash|null=null

    clone(){
        return new StrokeData().copy(this)
    }
    copy(source:StrokeData){
        this.width=source.width
        this.miterlimit=source.miterlimit
        this.cap=source.cap
        this.join=source.join
        this.dash=source.dash?source.dash.clone():null
        return this
    }

}