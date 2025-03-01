import { Vector2 } from "../math/vec2"

export class Circle{
    radius:number
    center:Vector2
    constructor(center:Vector2,radius:number){
        this.radius=radius
        this.center=center
    }
    distanceTo(point:Vector2):number{
        return this.center.distanceTo(point)-this.radius
    }
    contains(point:Vector2):boolean{
        return this.center.distanceToSquared(point)<=this.radius*this.radius
    }
    intersectionFromCircle(circle:Circle):Vector2[]{
        const intersections:Vector2[]=[]
        const d=this.center.distanceTo(circle.center)
        if(d>this.radius+circle.radius) return intersections
        if(d<Math.abs(this.radius-circle.radius)) return intersections
        const a=(this.radius**2-circle.radius**2+d**2)/(2*d)
        const h=Math.sqrt(this.radius**2-a**2)
        const x0=this.center.x+a*(circle.center.x-this.center.x)/d
        const y0=this.center.y+a*(circle.center.y-this.center.y)/d
        const ix0=x0+h*(circle.center.y-this.center.y)/d
        const iy0=y0-h*(circle.center.x-this.center.x)/d
        intersections.push(Vector2.create(ix0,iy0))
        if(d>this.radius-circle.radius){
            const ix1=x0-h*(circle.center.y-this.center.y)/d
            const iy1=y0+h*(circle.center.x-this.center.x)/d
            intersections.push(Vector2.create(ix1,iy1))
        }

        return intersections
    }
    flatten(){
        // S = π / arccos(1 - L/R)
        // S_ellipse = π / (a * arccos(1 - L/a)) + π / (b * arccos(1 - L/b))
        const maximum=0.25
        const segments=Math.max(1,Math.round(Math.PI/Math.acos(1-maximum/this.radius)))
        const delta=2*Math.PI/segments
        let startAngle=0
        let points:Vector2[]=[]
        for(let i=0;i<segments;i++){
            let curAngle=startAngle+delta
            let x=this.center.x+Math.cos(curAngle)*this.radius
            let y=this.center.y+Math.sin(curAngle)*this.radius
            points.push(Vector2.create(x,y))
            startAngle=curAngle
        }
        return points
    }
}