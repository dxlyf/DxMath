import Canvas, { CanvasExpose } from "src/components/Canvas"
import {Raster3D,Object3D,Mesh,Geometry,Camera,createCubeVertices,Texture,Vertex,Face3} from 'math/computer_graphic/3d'

import imageUrl from 'src/assets/uv_grid_opengl.jpg'

export default () => {

    const onInit = (ctx: CanvasExpose) => {

        const camera=new Camera(70*Math.PI/180,ctx.width/ctx.height,0.1,100)

        camera.position[0]=0
        camera.position[1]=1
        camera.position[2]=3

        camera.lookAt([0,0,0])


        const r=new Raster3D(ctx.canvasWidth,ctx.canvasHeight)

        const scene=new Object3D()
        const box = new Geometry()
       const {position,indices,texcoord}=createCubeVertices(1)
       box.position=position
       box.index=indices
       box.uv=texcoord

        // box.position=new Float32Array([
        //     -1,-1,-1,
        //     -1,1,-1,
        //     -1,1,1
           
        // ])
        // box.uv=new Float32Array([
        //     0,0,
        //     0,1,
        //     1,1
        // ])
        const mesh=new Mesh(box)
        mesh.material.map=Texture.fromImageUrl(imageUrl,512,512)

      
function loadModel() {
  fetch('/monkey.babylon').then(res => res.clone()).then(res => res.json()).then(jsonObject => {
      let objects = jsonObject.meshes;
      var materials = [];

   
      for (var materialIndex = 0; materialIndex < jsonObject.materials.length; materialIndex++) {
          var material:any = {};

         material.Name = jsonObject.materials[materialIndex].name;
         material.ID = jsonObject.materials[materialIndex].id;
          if (jsonObject.materials[materialIndex].diffuseTexture){
              material.DiffuseTextureName = jsonObject.materials[materialIndex].diffuseTexture.name;
          }
          materials[material.ID] = material;
      }
      for (let i = 0; i < objects.length; i++) {
        let position:number[]=[],uv:number[]=[]
         let newMesh=new Mesh(new Geometry())
          let obj = objects[i]
          let vertices = obj.vertices
          let indices = obj.indices;
          var uvCount = obj.uvCount;
          var verticesStep = 1;
          if (uvCount > 0) {
              var meshTextureID = obj.materialId;
              var meshTextureName = materials[meshTextureID].DiffuseTextureName;
              
              newMesh.material.map = Texture.fromImageUrl('/' + meshTextureName, 512, 512);
          }
          switch (uvCount) {
              case 0:
                  verticesStep = 6;
                  break;
              case 1:
                  verticesStep = 8;
                  break;
              case 2:
                  verticesStep = 10;
                  break;
          }

          var verticesCount = vertices.length / verticesStep;

          for (let i = 0; i < verticesCount; i++) {
              let index = i * verticesStep;
              var x = vertices[index];
              var y = vertices[index + 1];
              var z = vertices[index + 2];

              var nx = vertices[index + 3];
              var ny = vertices[index + 4];
              var nz = vertices[index + 5];
               let vertex =  Vertex.fromXYZ(x, y, z)
              // vec3.set(vertex.normal, nx, ny, nz)
              vertex.normal.set([nx,ny,nz])
              newMesh.geometry.vertices.push(vertex)
              position.push(x,y,z)
              if (uvCount > 0) {
                  var u = vertices[index + 6];
                  var v = vertices[index + 7];
                  uv.push(u,v)
                  vertex.uv.set([u,v])
              }
          }
          var facesCount = indices.length / 3;
          for (let i = 0; i < facesCount; i++) {
              let index = i * 3;
              newMesh.geometry.faces.push(Face3.from(indices[index], indices[index + 1], indices[index + 2]))
          }
    
          // newMesh.geometry.position=new Float32Array(position)
          // newMesh.geometry.uv=new Float32Array(uv)
          // newMesh.geometry.index=new Uint16Array(indices)
          scene.add(newMesh)
      }


  })
}
loadModel()
       //== scene.add(mesh)
       //r.clearColor=[1,1,1,1]

        ctx.animate((ctx) => {
            r.clear()
            scene.rotation[1]+=1
            r.render(scene,camera)
       
            ctx.putImageData(r.imageData,0,0)
        })
    }
    return <Canvas width={window.innerWidth} height={window.innerHeight} dpr={1} onInit={onInit}></Canvas>
}