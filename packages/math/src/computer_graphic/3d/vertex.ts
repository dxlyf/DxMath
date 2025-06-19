
import {mat4,vec3,Vec3Like,vec2,vec4} from '../../gl_matrix'


export class Face3{
    static from(a:number,b:number,c:number):Face3{
        const that=new this()
        that.a=a
        that.b=b
        that.c=c
        return that
    }
    a:number=0
    b:number=0
    c:number=0
    normal=vec3.create()
}
export class Vertex{
    static fromXYZ(x:number,y:number,z:number):Vertex{
        const that=new this()
        that.position.x=x
        that.position.y=y
        that.position.z=z

        return that
    }
    invW:number=0
    positionScreen=vec4.create()
    positionClip=vec4.create()
    positionWorld=vec3.create()
    position=vec3.create()
    normal=vec3.create()
    uv=vec2.create()

}