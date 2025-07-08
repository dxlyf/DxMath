import { useLayoutEffect,useRef, useState } from 'react'
import * as THREE from 'three'
import type {WebGLRendererParameters,WebGLRenderer,Scene} from 'three'
import {EventTarget,Event} from 'event-propagation'
import { useLatest } from 'ahooks'
import { getSize } from 'ol/extent'
export type Creation={
    onInit?:(this:ThreeRenderer)=>void
    onCreate?:(this:ThreeRenderer)=>void
    onUpdate?:(this:ThreeRenderer,delta:number)=>void
    onDispose?:(this:ThreeRenderer)=>void
}

enum ThreeCameraType{
    PerspectiveCamera,
    OrthographicCamera,
}
export class ThreeCamera{
    private _perspectiveCamera=new THREE.PerspectiveCamera()
    private _orthograhicCamera=new THREE.OrthographicCamera()
    _type = ThreeCameraType.PerspectiveCamera
    _target=new THREE.Vector3()

    constructor(){
        
    }
    get type(){
        return this._type
    }
    set type(value:ThreeCameraType){
        this.swtichCameraType(value)
    }
    get position(){
        return this.camera.position
    }
    lookAt(target:THREE.Vector3){
        this.camera.lookAt(target)
    }
    updateMatrixWorld(){
        this.camera.updateMatrixWorld()
    }

    get camera(){
        switch(this.type){
            case ThreeCameraType.PerspectiveCamera:
                return this._perspectiveCamera
            case ThreeCameraType.OrthographicCamera:
                return this._orthograhicCamera
        }
    }
    makePerspectiveCamera(fov:number, aspect:number, near:number, far:number){
        this._type=ThreeCameraType.PerspectiveCamera
        this._perspectiveCamera.fov=fov
        this._perspectiveCamera.aspect=aspect
        this._perspectiveCamera.near=near
        this._perspectiveCamera.far=far
        this.updateCameraProjection()
    }
    makeOrthographicCamera(left:number, right:number, top:number, bottom:number, near:number, far:number){
        this._type=ThreeCameraType.OrthographicCamera
        this._orthograhicCamera.left=left
        this._orthograhicCamera.right=right
        this._orthograhicCamera.top=top
        this._orthograhicCamera.bottom=bottom
        this._orthograhicCamera.near=near
        this._orthograhicCamera.far=far
        this.updateCameraProjection()
    }
    swtichCameraType(type:ThreeCameraType){
        const prevType=this.type
        if(prevType!==type){
            if(type===ThreeCameraType.OrthographicCamera){
                const fov=this._perspectiveCamera.fov,near=this._perspectiveCamera.near
                const fov_rad=THREE.MathUtils.degToRad(fov)
                const distance =this._perspectiveCamera.position.distanceTo(this._target)+near

                console.log('_target',this._target)
                const top=Math.tan(fov_rad*0.5)*distance
                const height=top*2
                const width=height*this._perspectiveCamera.aspect
                const left=-width/2

                this._orthograhicCamera.left=left
                this._orthograhicCamera.right=left+width
                this._orthograhicCamera.top=top
                this._orthograhicCamera.bottom=top-height
                this._orthograhicCamera.near=near
                this._orthograhicCamera.far=this._perspectiveCamera.far
                this._orthograhicCamera.zoom=1
                this._orthograhicCamera.position.copy(this._perspectiveCamera.position)
                this._orthograhicCamera.quaternion.copy(this._perspectiveCamera.quaternion)
                this._orthograhicCamera.lookAt(this._target)
                this._orthograhicCamera.updateProjectionMatrix()

            }else{
                // const zoom = this._orthograhicCamera.zoom;
                // const orthoDistance = this._orthograhicCamera.position.distanceTo(this._target);
                // const scaledDistance = orthoDistance / zoom;
                // const dir = new THREE.Vector3().subVectors( this._orthograhicCamera.position, this._target).normalize();
                // const newPos = this._target.clone().add(dir.multiplyScalar(scaledDistance));

             //   this._perspectiveCamera.position.copy(newPos)
             const oldY= this._orthograhicCamera.position.y
                this._perspectiveCamera.position.copy(this._orthograhicCamera.position)
                this._perspectiveCamera.position.y=oldY/this._orthograhicCamera.zoom
                this._perspectiveCamera.quaternion.copy(this._orthograhicCamera.quaternion)
                this._perspectiveCamera.updateProjectionMatrix()
            }
        }
        this._type=type
        this.updateCameraProjection()
    }
    updateCameraProjection(){
        switch(this.type){
            case ThreeCameraType.PerspectiveCamera:
                this._perspectiveCamera.updateProjectionMatrix()
            break;
            case ThreeCameraType.OrthographicCamera:
                this._orthograhicCamera.updateProjectionMatrix()
            break;
        }
    }


}
export class ThreeRenderer extends EventTarget<{
    onInit:void
    onCreate:void
    onUpdate:{delta:number}
    onDispose:void
}>{
    clock=new THREE.Clock()
    needRendering:boolean=false
    camera=new ThreeCamera()
    scene=new THREE.Scene()
    renderer!:WebGLRenderer
    private _size=new THREE.Vector2()
    constructor(){
        super()
    }
    setupRenderer(parameters:WebGLRendererParameters={}){
        this.renderer=new THREE.WebGLRenderer({
            antialias:true,//抗锯齿
            alpha:false,//透明度
            preserveDrawingBuffer: true, //保留绘图缓冲区，用于截图
            ...parameters
        })
    }
    initialize(){
        this.emit(Event.create('onInit'))
        this.emit(Event.create('onCreate'))
    }
    get width(){
        return this._size.x
    }
    get height(){
        return this._size.y
    }
    get domElement(){
        return this.renderer.domElement
    }
    setSize(width:number,height:number){
        this._size.set(width,height)  
        this.renderer.setSize(width, height)
    }
    getSize(){
         this.renderer.getSize(this._size)
         return this._size
    }
    update=(delta:number)=>{
        this.emit(Event.create('onUpdate').setData({delta:delta}))
    }
    refresh=()=>{
        this.needRendering=true
    }
    render=()=>{
        this.needRendering=false
        this.renderer.render(this.scene, this.camera.camera)
    }
    animationLoop=()=>{
        this.update(this.clock.getDelta())
        if(this.needRendering){
            this.render()
        }
    }
    startAnimation(){
        this.renderer.setAnimationLoop(this.animationLoop)
    }
    dispose(){
        this.emit(Event.create('onDispose'))
        this.renderer.dispose()
    }
}
export const useThree=(creation:Creation,parameters: WebGLRendererParameters={})=>{
    const canvasRef=useRef<HTMLCanvasElement>(null)
    const [renderer,setRenderer]=useState<ThreeRenderer>(()=>new ThreeRenderer())
    const last=useLatest(creation)
    useLayoutEffect(()=>{    
       
            renderer.on('onCreate',e=>{
                last.current.onCreate?.call(renderer)
            })
            renderer.on('onInit',e=>{
                last.current.onInit?.call(renderer)
            })
            renderer.on('onUpdate',e=>{
                last.current.onUpdate?.call(renderer,e.data!.delta)
            })
            renderer.on('onDispose',e=>{
                last.current.onDispose?.call(renderer)
            })
            renderer.setupRenderer({
                canvas:canvasRef.current!,
                ...parameters
            })
            console.log('fffffffffff',renderer.renderer.domElement===canvasRef.current)
            renderer.initialize()
            renderer.startAnimation()
            return ()=>{

                renderer.dispose()
            }
    },[])
    console.log('yyyyyyyyyy',renderer.renderer?.domElement===canvasRef.current)
    return [canvasRef,renderer] as [typeof canvasRef,ThreeRenderer]
}