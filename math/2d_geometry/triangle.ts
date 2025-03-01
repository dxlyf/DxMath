
// 三角形类声明

import { Vector2 } from "../math/vec2";


export class Triangle{
    static create(a:Vector2,b:Vector2,c:Vector2):Triangle{
        return new Triangle(a,b,c)
    }
    points:Vector2[]=[]
    constructor(a:Vector2,b:Vector2,c:Vector2){
        this.points=[a,b,c]
    }
    get a(){
        return this.points[0]
    }
    get b(){
        return this.points[1]
    }
    get c(){
        return this.points[2]
    }
    area(){
        Vector2.beginPools()
        const ab=Vector2.pool().subVectors(this.b,this.a)
        const ac=Vector2.pool().subVectors(this.c,this.a)
        Vector2.endPools()
        return 0.5*ab.cross(ac)
    }
    centroid(){
        Vector2.beginPools()
        const ab=Vector2.pool().subVectors(this.b,this.a)
        const ac=Vector2.pool().subVectors(this.c,this.a)
        ab.add(ac).multiplyScalar(0.5)
        ab.add(this.a)
        Vector2.endPools()
        return ab
    }
    barycentric(p:Vector2):[number,number,number]{
        Vector2.beginPools()
        const ab=Vector2.pool().subVectors(this.b,this.a)
        const ac=Vector2.pool().subVectors(this.c,this.a)
        const d=ab.cross(ac)
        if(d===0){
            return [-1,-1,-1]
        }
        const pa=Vector2.pool().subVectors(this.a,p)
        const pb=Vector2.pool().subVectors(this.b,p)
        const pc=Vector2.pool().subVectors(this.c,p)
        Vector2.endPools()
        const alpha = pb.cross(pc)/d
        const beta = pc.cross(pa)/d
        const gamma = 1 - alpha - beta;
        return [alpha,beta,gamma];
    }
    contains(p:Vector2):boolean{
        Vector2.beginPools() 
        let r=0
        for(let i=0,j=this.points.length-1;i<3;j=i++){
            const a=Vector2.pool().subVectors(this.points[i],this.points[j])
            const b=Vector2.pool().subVectors(p,this.points[j])
            // 都在一个方向
            if(a.cross(b)>0){
                r++
            }else{
                r--
            }
        }
        Vector2.endPools()
        return Math.abs(r)===3;
    }
}