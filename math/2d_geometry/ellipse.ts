import { Vector2 } from "../math/vec2"

export class Ellipse{
    radius:Vector2
    center:Vector2
    constructor(center:Vector2,radius:Vector2){
        this.radius=radius
        this.center=center
    }
    contains(point:Vector2):boolean{
        // (x-h)^2/a^2 + (y-k)^2/b^2 <= 1
        return (Math.pow(point.x-this.center.x,2)/Math.pow(this.radius.x,2))+(Math.pow(point.y-this.center.y,2)/Math.pow(this.radius.y,2))<=1
    }
    flatten(){
        // S = π / arccos(1 - L/R)
        // S_ellipse = π / (a * arccos(1 - L/a)) + π / (b * arccos(1 - L/b))
        const maximum=0.25
        const _segments= Math.PI/(this.radius.x*Math.acos(1-maximum/this.radius.x))+Math.PI/(this.radius.y*Math.acos(1-maximum/this.radius.y))
        const segments=Math.max(1,Math.round(_segments))
        const delta=2*Math.PI/segments
        let startAngle=0
        let points:Vector2[]=[]
        for(let i=0;i<segments;i++){
            let curAngle=startAngle+delta
            let x=this.center.x+Math.cos(curAngle)*this.radius.x
            let y=this.center.y+Math.sin(curAngle)*this.radius.y
            points.push(Vector2.create(x,y))
            startAngle=curAngle
        }
        return points
    }
}