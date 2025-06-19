
import { Vertex } from './vertex'
import { mat4, vec3, mat3,vec4 } from '../../gl_matrix'

import { Mesh, Camera, Object3D, Material } from './mesh'
import { Geometry } from './geometry'
import { fillTriangle } from './tirangle'

export class Raster3D {
    canvas!: HTMLCanvasElement
    ctx!: CanvasRenderingContext2D
    colorBuffer!: Uint8ClampedArray
    depthBuffer!: Float32Array
    imageData: ImageData
    projectScreen = mat4.create()
    clearColor = [0, 0, 0, 1]
    clearDepth = Number.MAX_SAFE_INTEGER
    constructor(width: number, height: number) {
        this.canvas = document.createElement('canvas')
        this.canvas.width = width
        this.canvas.height = height
        this.ctx = this.canvas.getContext('2d')!

        this.colorBuffer = new Uint8ClampedArray(width * height * 4)
        this.depthBuffer = new Float32Array(width * height)

        this.imageData = new ImageData(this.colorBuffer, width, height)

        //   mat3.projection(this.projectScreen,width/2,-height/2,0,0,1,width)

        this.viewport(0,0,this.width,this.height)

    }
    get width() {
        return this.canvas.width
    }
    get height() {
        return this.canvas.height
    }
    viewport(x:number,y:number,width:number,height:number){
        // mat4.set(this.projectScreen,
        //     width / 2, 0, 0,0,
        //     0, height / -2, 0,0,
        //     0,0,1,0,
        //     x+width / 2,(this.height-y)-height / 2, 1
        // )
         mat4.set(this.projectScreen,
            width / 2, 0, 0, 0,
            0, height / -2, 0, 0,
            0, 0, 1, 0,
            x + width / 2, ((this.height - height) - y) + height / 2, 0, 1)
    }
    setClearColor(color: number[]) {
        this.clearColor = color
    }
    setClearDepth(depth: number) {
        this.clearDepth = depth
    }
    clear() {
        for (let i = 0; i < this.colorBuffer.length; i++) {
            this.colorBuffer[i] = this.clearColor[i % 4] * 255
        }
        for (let i = 0; i < this.depthBuffer.length; i++) {
            this.depthBuffer[i] = this.clearDepth
        }
    }
    getDepth(x: number, y: number) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return Infinity
        }
        x >>= 0
        y >>= 0
        return this.depthBuffer[((y * this.width) + x)]
    }

    setPixel(x: number, y: number, depth: number, color: number[]) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
        x >>= 0
        y >>= 0
        let depth_index = ((y * this.width) + x)
        let index = depth_index * 4
        if (depth < this.depthBuffer[depth_index]) {
            this.colorBuffer[index + 0] = color[0] * 255
            this.colorBuffer[index + 1] = color[1] * 255
            this.colorBuffer[index + 2] = color[2] * 255
            this.colorBuffer[index + 3] = color[3] * 255
            this.depthBuffer[depth_index] = depth
        }
    }


    render(scene: Object3D, camera: Camera) {

        scene.updateMatrixWorld()
        camera.updateMatrixWorld()

        const projectionMatrix = camera.projectionMatrix
        const viewMatrix = camera.matrixWorldInverse
       // mat4.lookAt(viewMatrix, camera.position,[0,0,0], [0,1,0])
        let modelViewMatrix = mat4.create()


        scene.traverse((node) => {
            if (node.type === 'Mesh') {

                let mesh = node as Mesh
                let material = mesh.material
                
                let faces = mesh.geometry.buildRenderFaces()
                let vertices=mesh.geometry.vertices
                let modelMatrix = mesh.matrixWorld

                mat4.multiply(modelViewMatrix, viewMatrix, modelMatrix)

   
                for(let i=0;i<vertices.length;i++){
                    let vertex=vertices[i]

                    vec3.copy(vertex.positionWorld,vertex.position)
                    // 视图和模型变换
                    vec3.transformMat4(vertex.positionWorld, vertex.positionWorld, modelViewMatrix)

                    vec3.copy(vertex.positionClip,vertex.positionWorld)
                    vertex.positionClip[3]=1

                    // 转换为投影裁剪坐标（投影变换）
                    vec4.transformMat4(vertex.positionClip, vertex.positionClip, projectionMatrix)
     
                    //（齐次）除法
                    // vertex.positionClip[0] /= vertex.positionClip[3]
                    // vertex.positionClip[1] /= vertex.positionClip[3]
                    // vertex.positionClip[2] /= vertex.positionClip[3]

                    vec3.scale(vertex.positionClip, vertex.positionClip, 1 / vertex.positionClip[3])

                    // 屏幕坐标
                    vec4.copy(vertex.positionScreen,vertex.positionClip)

                    vertex.invW=1/ vertex.positionScreen[3]
                     //转换为屏幕坐标（视口变换）
                    vec3.transformMat4(vertex.positionScreen, vertex.positionScreen, this.projectScreen)
                    
                }

                for (let face of faces) {

                    let v1 = vertices[face.a]
                    let v2 = vertices[face.b]
                    let v3 = vertices[face.c]
                  

                    // // 背面剔除
                   // const d=vec3.cross(vec3.create(),vec3.subtract(vec3.create(),v2.positionWorld,v1.positionWorld),vec3.subtract(vec3.create(),v3.positionWorld,v1.positionWorld))
                    // if(vec3.dot(d,vec3.fromValues(0,0,-1))<0){
                    //     continue;
                    // }
                 
                   
                    fillTriangle(v1, v2, v3, (x, y, depth, u, v) => {
                        const curDepth = this.getDepth(x, y)
                        if (depth < curDepth) {
                            let color=material.color
                            if(material.map&&material.map.loaded){
                                color=material.map.getColor(u,v)
                            }
                            this.setPixel(x, y, depth, color)
                        }
                    })
                }

            }
        })

        // this.ctx.putImageData(this.imageData,0,0)
    }
}