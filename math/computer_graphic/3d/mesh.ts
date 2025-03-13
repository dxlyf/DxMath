
import {Geometry} from './geometry'
import {Texture} from './texture'
import {mat4,Mat4Like,vec3, Vec3Like,quat,QuatLike} from '../../gl_matrix'

const viewMatrix:Mat4Like=mat4.create()
const rotateMatrix:Mat4Like=mat4.create()
export class Object3D{
    type='Object3D'
    children:Object3D[]=[]
    position:Vec3Like=vec3.create()
    _rotation:Vec3Like=vec3.create()
    rotation:Vec3Like
    scale:Vec3Like=vec3.fromValues(1,1,1)
    quad:QuatLike=quat.create()
    matrix!:Mat4Like
    matrixWorld!:Mat4Like
    parent:Object3D|null=null
    constructor(){
        this.matrix=mat4.identity(mat4.create())
        this.matrixWorld=mat4.identity(mat4.create())
        
        let that=this;
        this.rotation=new Proxy<Vec3Like>(this._rotation,{
            set:(target:Vec3Like,p:any,value:any,receiver)=>{
                Reflect.set(target,p,value,receiver)
                that.updateRotate()
                return true
            },
            get(target,key,receiver){
                return Reflect.get(target,key,receiver)
            }
        })
    }
    updateRotate(){
        quat.fromEuler(this.quad,this._rotation[0],this._rotation[1],this._rotation[2])
    }
    add(child:Object3D){
        child.parent=this;
        this.children.push(child)
    }
    lookAt(target:Vec3Like,up=vec3.fromValues(0,1,0)){
        if(this.type==='Camera'){
            mat4.lookAt(viewMatrix,this.position,target,up)
        }else{
            mat4.targetTo(viewMatrix,this.position,target,up)
        }
        mat4.invert(rotateMatrix,viewMatrix)
        rotateMatrix[12]=0
        rotateMatrix[13]=0
        rotateMatrix[14]=0
        mat4.getRotation(this.quad,rotateMatrix)
        this.updateMatrix()

    }
    updateMatrix(){
        mat4.fromRotationTranslationScale(this.matrix,this.quad,this.position,this.scale)
    }
    updateMatrixWorld(){
        this.updateMatrix()
        if(this.parent){
            mat4.multiply(this.matrixWorld,this.parent.matrixWorld,this.matrix)
        }else{
            mat4.copy(this.matrixWorld,this.matrix)
        }
        for(let child of this.children){
            child.updateMatrixWorld()
        }
    }
	traverse( callback:(obj:Object3D)=>void ) {
        callback(this)
		const children = this.children;
		for ( let i = 0, l = children.length; i < l; i ++ ) {

			children[ i ].traverse( callback );

		}
    }

}


export class Camera extends Object3D{
    type='Camera'
    rotateMatrix:Mat4Like=mat4.create()
    projectionMatrix:Mat4Like= mat4.create()
    fov:number
    aspectRatio:number
    near:number
    far:number
    matrixWorldInverse:Mat4Like=mat4.create()

    constructor(fov=75,aspectRatio=1,near=0.1,far=100){
        super()
        this.fov=fov;
        this.aspectRatio=aspectRatio;
        this.near=near;
        this.far=far;
        this.updateProjectionMatrix()
    }
    updateMatrixWorld(): void {
        super.updateMatrixWorld()
        mat4.invert(this.matrixWorldInverse,this.matrixWorld)
    }
    updateProjectionMatrix(){
        mat4.perspectiveNO(this.projectionMatrix,this.fov,this.aspectRatio,this.near,this.far)
    }
}

export class Material{
    map:Texture|null=null
    color:number[]=[1,0,0,1]
}
export class Mesh extends Object3D{
    type='Mesh'
    geometry!:Geometry
    material!:Material
    constructor(geometry:Geometry,material:Material=new Material()){
        super()
        this.geometry=geometry;
        this.material=material
    }
}