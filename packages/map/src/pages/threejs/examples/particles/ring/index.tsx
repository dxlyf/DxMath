import { useThree } from 'src/hooks/useThree';
import * as THREE from 'three'

export default ()=>{

    const [canvasRef,renderer]=useThree({
        onInit:function(){
            const scene =renderer.scene
            const camera =renderer.camera
            this.setSize(window.innerWidth, window.innerHeight)
            camera.makePerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 1000)
            const count = 1000;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(count * 3);
            const velocities = new Float32Array(count * 3);
            
            for (let i = 0; i < count; i++) {
              const i3 = i * 3;
              positions[i3] = positions[i3+1] = positions[i3+2] = 0;
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.5 + Math.random() * 1.0;
              velocities[i3]   = Math.cos(angle) * speed;
              velocities[i3+1] = Math.sin(angle) * speed;
              velocities[i3+2] = (Math.random() - 0.5) * speed;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
            
            const material = new THREE.PointsMaterial({ color: 0xffaa00, size: 1.5 });
            const particles = new THREE.Points(geometry, material);
            scene.add(particles);
            
            this.on('onUpdate',e=>{
              const pos = geometry.attributes.position as THREE.BufferAttribute;
              const vel = geometry.attributes.velocity as THREE.BufferAttribute;
              for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                pos.array[i3]   += vel.array[i3];
                pos.array[i3+1] += vel.array[i3+1] - 0.01; // 重力效果
                pos.array[i3+2] += vel.array[i3+2];
                if (pos.array[i3+1] < -50) {
                  pos.array[i3] = pos.array[i3+1] = pos.array[i3+2] = 0;
                }
              }
              pos.needsUpdate = true;
            })
        }
    })
    
    return <canvas ref={canvasRef} ></canvas>
}