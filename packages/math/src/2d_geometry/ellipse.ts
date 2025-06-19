import { BoundingRect } from "../math/bounding_rect"
import { Vector2 } from "../math/vec2"

export class Ellipse{
    radius:Vector2
    center:Vector2
    constructor(center:Vector2,radius:Vector2){
        this.radius=radius
        this.center=center
    }
    get halfWidth(){
        return this.radius.x*0.5
    }
    get halfHeight(){
        return this.radius.y*0.5
    }
    containsPoint(point:Vector2):boolean{
        // (x-h)^2/a^2 + (y-k)^2/b^2 <= 1
        return (Math.pow(point.x-this.center.x,2)/Math.pow(this.radius.x,2))+(Math.pow(point.y-this.center.y,2)/Math.pow(this.radius.y,2))<=1
    }
     /**
     * Checks whether the x and y coordinates given are contained within this ellipse
     * @param x - The X coordinate of the point to test
     * @param y - The Y coordinate of the point to test
     * @returns Whether the x/y coords are within this ellipse
     */
    public contains(x: number, y: number): boolean
    {
        if (this.halfWidth <= 0 || this.halfHeight <= 0)
        {
            return false;
        }

        // normalize the coords to an ellipse with center 0,0
        let normx = ((x - this.center.x) / this.halfWidth);
        let normy = ((y - this.center.y) / this.halfHeight);

        normx *= normx;
        normy *= normy;

        return (normx + normy <= 1);
    }

    /**
     * Checks whether the x and y coordinates given are contained within this ellipse including stroke
     * @param x - The X coordinate of the point to test
     * @param y - The Y coordinate of the point to test
     * @param strokeWidth - The width of the line to check
     * @param alignment - The alignment of the stroke
     * @returns Whether the x/y coords are within this ellipse
     */
    public strokeContains(x: number, y: number, strokeWidth: number, alignment: number = 0.5): boolean
    {
        const { halfWidth, halfHeight } = this;

        if (halfWidth <= 0 || halfHeight <= 0)
        {
            return false;
        }

        const strokeOuterWidth = strokeWidth * (1 - alignment);
        const strokeInnerWidth = strokeWidth - strokeOuterWidth;

        const innerHorizontal = halfWidth - strokeInnerWidth;
        const innerVertical = halfHeight - strokeInnerWidth;

        const outerHorizontal = halfWidth + strokeOuterWidth;
        const outerVertical = halfHeight + strokeOuterWidth;

        const normalizedX = x - this.center.x;
        const normalizedY = y - this.center.y;

        const innerEllipse = ((normalizedX * normalizedX) / (innerHorizontal * innerHorizontal))
            + ((normalizedY * normalizedY) / (innerVertical * innerVertical));

        const outerEllipse = ((normalizedX * normalizedX) / (outerHorizontal * outerHorizontal))
            + ((normalizedY * normalizedY) / (outerVertical * outerVertical));

        return innerEllipse > 1 && outerEllipse <= 1;
    }

    /**
     * Returns the framing rectangle of the ellipse as a Rectangle object
     * @param out
     * @returns The framing rectangle
     */
    public getBounds(out?: BoundingRect): BoundingRect
    {
        out ||= new BoundingRect();

        // out.min.set(this.center.x - this.halfWidth,this.center.y - this.halfHeight)
        // out.max.set(out.min.x+this.halfWidth*2,out.min.y+this.halfHeight*2)
        out.fromCircle(this.center.x, this.center.y, Math.max(this.halfWidth, this.halfHeight));
        return out;
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