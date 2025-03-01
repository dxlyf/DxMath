
export class f32x2{
    static new(a:f32,b:f32){
        return new this([a,b])
    }
    static splat(x:f32){
        return this.new(x,x)
    }
    
    elements:Float32Array=new Float32Array(2)
    constructor(elements:number[]|Float32Array){
        this.elements.set(elements)
    }
    set(x:f32,y:f32){
        return f32x2.new(x,y);
    }
    get x(){
        return this.elements[0]
    }
    get y(){
        return this.elements[1]
    }
    copy(source:f32x2){
       return this.set(source.x,source.y)
    }
    clone(){
        return f32x2.new(this.x,this.y)
    }
    abs(){
        return this.set(Math.abs(this.x),Math.abs(this.y))
    }
    min(other:f32x2){
        return this.set(Math.min(this.x,other.x),Math.min(this.y,other.y))
    }
    max(other:f32x2){
        return this.set(Math.max(this.x,other.x),Math.max(this.y,other.y))
    }
    max_component(){
        return Math.max(this.x,this.y)
    }
    add(other:f32x2){
        return this.set(this.x+other.x,this.y+other.y)
    }
    sub(other:f32x2){
        return this.set(this.x-other.x,this.y-other.y)
    }
    mul(other:f32x2){
        return this.set(this.x*other.x,this.y*other.y)
    }
    div(other:f32x2){
            return this.set(this.x/other.x,this.y/other.y)
    }
}