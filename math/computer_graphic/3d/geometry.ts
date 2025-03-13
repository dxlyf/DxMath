
import { mat4, vec3 } from '../../gl_matrix'

import { Face3, Vertex } from './vertex'



export function createCubeVertices(size) {
    size = size || 1;
    const k = size / 2;
    const CUBE_FACE_INDICES = [
        [3, 7, 5, 1],  // right
        [6, 2, 0, 4],  // left
        [6, 7, 3, 2],  // ??
        [0, 1, 5, 4],  // ??
        [7, 6, 4, 5],  // front
        [2, 3, 1, 0],  // back
      ];
    const cornerVertices = [
        [-k, -k, -k],
        [+k, -k, -k],
        [-k, +k, -k],
        [+k, +k, -k],
        [-k, -k, +k],
        [+k, -k, +k],
        [-k, +k, +k],
        [+k, +k, +k],
    ];

    const faceNormals = [
        [+1, +0, +0],
        [-1, +0, +0],
        [+0, +1, +0],
        [+0, -1, +0],
        [+0, +0, +1],
        [+0, +0, -1],
    ];

    const uvCoords = [
        [1, 0],
        [0, 0],
        [0, 1],
        [1, 1],
    ];

    const numVertices = 6 * 4;
    const positions = new Float32Array(3 * numVertices);
    const normals = new Float32Array(3 * numVertices);
    const texcoords = new Float32Array(2 * numVertices);
    const indices = new Uint16Array(3 * 6 * 2);

    let positionIndex=0,normalIndex=0,uvIndex=0,indiceIndex=0;
    for (let f = 0; f < 6; ++f) {
        const faceIndices = CUBE_FACE_INDICES[f];
        for (let v = 0; v < 4; ++v) {
            const position = cornerVertices[faceIndices[v]];
            const normal = faceNormals[f];
            const uv = uvCoords[v];

            // Each face needs all four vertices because the normals and texture
            // coordinates are not all the same.
            positions[positionIndex]=position[0];
            positions[positionIndex+1]=position[1];
            positions[positionIndex+2]=position[2];
            positionIndex+=3;
            normals[normalIndex]=normal[0];
            normals[normalIndex+1]=normal[1];
            normals[normalIndex+2]=normal[2];
            normalIndex+=3
            texcoords[uvIndex]=uv[0];
            texcoords[uvIndex+1]=uv[1];
            uvIndex+=2
        }
        // Two triangles make a square face.
        const offset = 4 * f;

        indices[indiceIndex]=offset+0
        indices[indiceIndex+1]=offset+1
        indices[indiceIndex+2]=offset+2

        indices[indiceIndex+3]=offset+0
        indices[indiceIndex+4]=offset+2
        indices[indiceIndex+5]=offset+3
        indiceIndex+=6
    }

    return {
        position: positions,
        normal: normals,
        texcoord: texcoords,
        indices: indices,
    };
}

export class Geometry {
    position: Float32Array | null = null
    uv: Float32Array | null = null
    index: Uint16Array | null = null
    faces: Face3[] = []
    vertices: Vertex[] = []
    constructor() {

    }

    buildRenderFaces() {
        if(this.faces.length>0) {
            return  this.faces
        }

        let { position, uv, index } = this
        if (!position) return [];
        
        let vertices: Vertex[] = this.vertices
        for (let i = 0; i < position.length; i += 3) {
            let x = position[i]
            let y = position[i + 1]
            let z = position[i + 2]
            vertices.push(Vertex.fromXYZ(x,y,z))
        }

        // uv
        if (uv) {
            for (let i = 0; i < vertices.length; i ++) {
                let uvIndex=i*2
                let u = uv[uvIndex]
                let v = uv[uvIndex + 1]
                vertices[i].uv.x = u
                vertices[i].uv.y = v
            }
        }

        const faces: Face3[] = []
        if(index) {
            for (let i = 0; i < index.length; i += 3) {
       
                let face = new Face3()
                face.a = index[i]
                face.b = index[i+1]
                face.c = index[i+2]
                
                let va=vertices[face.a]
                let vb=vertices[face.b]
                let vc=vertices[face.c]

                let ab = vec3.sub(vec3.create(), va.position, va.position)
                let ac = vec3.sub(vec3.create(), vc.position, va.position)
    
                vec3.cross(face.normal, ab, ac)
                vec3.normalize(face.normal, face.normal)
    
                
                vec3.copy(va.normal, face.normal)
                vec3.copy(vb.normal, face.normal)
                vec3.copy(vc.normal, face.normal)
                faces.push(face)
            }
        }else{
            for (let i = 0; i < vertices.length; i += 3) {
                let face = new Face3()
                face.a = i
                face.b = i + 1
                face.c = i + 2
                
                let va=vertices[face.a]
                let vb=vertices[face.b]
                let vc=vertices[face.c]

                let ab = vec3.sub(vec3.create(), va.position, va.position)
                let ac = vec3.sub(vec3.create(), vc.position, va.position)
    
                vec3.cross(face.normal, ab, ac)
                vec3.normalize(face.normal, face.normal)
    
                
                vec3.copy(va.normal, face.normal)
                vec3.copy(vb.normal, face.normal)
                vec3.copy(vc.normal, face.normal)
                faces.push(face)
            }
        }
        this.faces = faces
        return faces;
    }
}