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
}