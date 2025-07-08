import { useSize } from 'ahooks';
import { useLayoutEffect, useRef } from 'react';
import { useThree } from 'src/hooks/useThree';
import * as THREE from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import { useGui } from 'src/hooks/useGui';

export default ()=>{
    const containerRef=useRef<HTMLDivElement>(null)
    const size=useSize(containerRef)||{width:0,height:0}
    const [gui]=useGui()
    const [canvasRef,renderer]=useThree({
        onInit:function(){
   
            const scene =renderer.scene
            const camera =renderer.camera

            camera.position.set(0, 0, 2)
            camera.lookAt(new THREE.Vector3(0,0,0))

            const light=new THREE.PointLight(0xffffff,10)
        
            light.position.set(1,2,-1)
            const basic_material=new THREE.MeshStandardMaterial({color:0x00ff00})
            const box_geometry=new THREE.BoxGeometry(1,1,1)
            
            const box=new THREE.Mesh(box_geometry,basic_material)
            box.position.set(0,0,-2)
            box.rotation.y=0.3
            box.rotation.x=0.3

            scene.add(box)
            scene.add(light)

            const orbit=new OrbitControls(camera.camera,renderer.domElement)

            orbit.addEventListener('change',e=>{
                renderer.refresh()
            })
            this.on('onDispose',e=>{
                
            })
            gui.add({
                type:0
            },'type',{
                Perspective:0,
                Orthographic:1
            }).onChange((type:number)=>{
            
         
                camera._target.copy(orbit.target)
                 renderer.camera.swtichCameraType(type)
                 orbit.object=renderer.camera.camera
                 renderer.refresh()
            })

           
        }
    })
    useLayoutEffect(()=>{
        if((size.width===0||size.height===0)||size.width===renderer.width && size.height===renderer.height){
            return
        }
       renderer.setSize(size.width, size.height-10)
       renderer.camera.makePerspectiveCamera(60, size.width/size.height, 1, 1000)
       renderer.camera.updateCameraProjection()
       renderer.refresh()
    },[size.width,size.height])
   
    
    return <div ref={containerRef} className='h-full w-full overflow-hidden'>
        <canvas ref={canvasRef} ></canvas>
    </div>
}