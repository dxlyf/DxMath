
// @ts-nocheck
import {vec3,Vec3Like,Vec4Like,Vec2Like,vec2,vec4,mat4,mat3, Vec2,quat,QuatLike, Mat4Like} from '../gl_matrix'
function interpolate(start:number, end:number, t:number) {
    return start + (end - start) * t;
}

function interpolateColor(out:number[], start:number[], end:number[], t:number) {
    out[0] = interpolate(start[0], end[0], t)
    out[1] = interpolate(start[1], end[1], t)
    out[2] = interpolate(start[2], end[2], t)
    return out
}

class Vertex3 {
    position:Vec3Like
    positionWorld:Vec3Like
    positionScreen:Vec3Like
    positionProjClip:Vec4Like
    uv:Vec2Like
    normal:Vec3Like

    constructor(x:number, y:number, z:number) {
        this.position = vec3.fromValues(x, y, z)
        this.positionWorld = vec3.create()
        this.positionProjClip = vec4.fromValues(0, 0, 0, 1) //投影裁剪坐标 -1~ 1
        this.positionScreen = vec3.create() // 屏幕坐标 0~width

        this.uv = vec2.fromValues(0, 0)
        this.normal = vec3.create()
    }
}
class Face3 {
    color:number[]
    normal:Vec3Like
    a:number
    b:number
    c:number
    constructor(a:number, b:number, c:number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.color = [1, 0, 0, 1]
        this.normal = vec3.create()
    }
}
class Mesh {
    vertices:Vertex3[]
    faces:Face3[]
    normals:Vec3Like[]
    uvs:Vec2Like[]
    color:number[]
    texture:Texture|null
    position:Vec3Like
    rotation:Vec3Like
    quation:QuatLike
    matrixWorld:Mat4Like
    constructor() {
        this.vertices = []
        this.faces = []
        this.normals = []
        this.uvs = []
        this.color = [1, 0, 0, 1]
        this.texture = null
        this.position = vec3.create()
        this.rotation = vec3.create()
        this.quation = quat.create()
        this.matrixWorld = mat4.create()
    }
    updateMatrix() {
        quat.fromEuler(this.quation, this.rotation[0] / Math.PI / 180, this.rotation[1] / Math.PI * 180, this.rotation[2] / Math.PI / 180)
        mat4.fromRotationTranslation(this.matrixWorld, this.quation, this.position)
    }
}
class Texture {
    loaded:boolean
    width:number
    height:number
    img:HTMLImageElement
    canvas:HTMLCanvasElement
    ctx:CanvasRenderingContext2D
    textureBuffer:ImageData|null


    constructor(src:string, width:number, height:number) {
        let devicePixelRatio = 1 //window.devicePixelRatio
        this.loaded = false
        this.width = width
        this.height = height
        this.img = new Image()
        this.canvas = document.createElement('canvas')
        this.canvas.width = width * devicePixelRatio;
        this.canvas.height = width * devicePixelRatio;
        if (devicePixelRatio !== 1) {
            this.canvas.style.width = this.width + 'px'
            this.canvas.style.height = this.height + 'px'
        }
        this.ctx = this.canvas.getContext('2d')!
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.textureBuffer = null
        this.img.src = src;
        this.img.onload = () => {
            if (devicePixelRatio !== 1) {
                this.ctx.scale(devicePixelRatio, devicePixelRatio)
            }
            this.ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, 0, 0, this.width, this.height)
            this.textureBuffer = this.ctx.getImageData(0, 0, this.width, this.height)
            this.loaded = true;
        }
    }
    getTextureData(pixelX:number, pixelY:number) {

        let index = (pixelY * this.width + pixelX) * 4;

        let r = this.textureBuffer!.data[index]
        let g = this.textureBuffer!.data[index + 1]
        let b = this.textureBuffer!.data[index + 2]
        let a = this.textureBuffer!.data[index + 3]
        return [r, g, b, a]
    }
    getTexture(u:number, v:number) {
        let pixelX = u * (this.width - 1)
        let pixelY = v * (this.height - 1)
        pixelX = Math.round(pixelX)
        pixelY = Math.round(pixelY)
        return this.getTextureData(pixelX, pixelY)
    }

    // 双线性插值计算
    bilinearMap(u:number, v:number) {

        // 将纹理坐标映射到纹理图像上的像素坐标
        let pixelX = u * (this.width - 1)
        let pixelY = v * (this.height - 1)

        // 获取四个最近的像素坐标
        var x1 = Math.floor(pixelX);
        var y1 = Math.floor(pixelY);
        var x2 = Math.ceil(pixelX);
        var y2 = Math.ceil(pixelY);

        // 获取四个最近的颜色值
        var color1 = this.getTextureData(x1, y1);
        var color2 = this.getTextureData(x2, y1);
        var color3 = this.getTextureData(x1, y2);
        var color4 = this.getTextureData(x2, y2);

        // 进行双线性插值计算
        var fracX = pixelX - x1;
        var fracY = pixelY - y1;


        var color:number[] = [];
        interpolateColor(color, color1, color2, fracX);
        var colorTemp:number[] = []
        interpolateColor(colorTemp, color3, color4, fracX);
        interpolateColor(color, color, colorTemp, fracY);

        let alpha = (color1[3] + color2[3] + color3[3] + color4[3]) / 4;
        return [color[0], color[1], color[2], 255]
    }
    map(color:number[],u:number, v:number) {
        if (!this.loaded) {
            return
        }
        let texture = this.bilinearMap(u, v) // 尺寸

        color[0] = texture[0] / 255;
        color[1] = texture[1] / 255;
        color[2] = texture[2] / 255;
        color[3] = texture[3] / 255;

    }
}
class Renderer3D {
    static COLOR_BUFFER_BIT = 1 << 0
    static DEPTH_BUFFER_BIT = 1 << 1
    static DRAW_MODE = {
        POINTS: 1,
        LINE_STRIP: 2,
        LINE_LOOP: 3,
        LINES: 4,
        TRIANGLE_STRIP: 5,
        TRIANGLE_FAN: 6,
        TRIANGLES: 7
    }
    isInterpolateFill = true
    canvas:HTMLCanvasElement
    ctx:CanvasRenderingContext2D
    viewportMatrix:Mat4Like
    _clearColor:Vec4Like
    _depth:number
    frameBuffer!:ImageData
    depthBuffer!:Float32Array
    constructor(domElement:HTMLDivElement, width = 500, height = 500) {
        var canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        domElement.appendChild(canvas)
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')!

        this.viewportMatrix = mat4.create() // 视口矩阵，把剪切坐标转为屏幕坐标，进行光栅化
        this.viewport(0, 0, width, height)
        this._clearColor = [0, 0, 0, 1]
        this._depth = 100000;
        this.initBuffer()
    }

    get width() {
        return this.canvas.width
    }
    get height() {
        return this.canvas.height
    }
    initBuffer() {
        this.frameBuffer = this.ctx.createImageData(this.width, this.height) // 颜色缓冲区
        this.depthBuffer = new Float32Array(this.width * this.height) // 深度缓冲区

    }
    clearColor(red:number, green:number, blue:number, alpha:number) {
        this._clearColor = [red, green, blue, alpha]
    }
    clearDepth(depth:number) {
        this._depth = depth
    }
    clear(mask:number) {

        if (mask & Renderer3D.COLOR_BUFFER_BIT) {
            const pixelData = this.frameBuffer.data;
            for (let i = 0, len = pixelData.length; i < len; i += 4) {
                pixelData[i] = this._clearColor[0] * 255
                pixelData[i + 1] = this._clearColor[1] * 255
                pixelData[i + 2] = this._clearColor[2] * 255
                pixelData[i + 3] = this._clearColor[3] * 255
            }
        }
        if (mask & Renderer3D.DEPTH_BUFFER_BIT) {
            for (let i = 0, len = this.depthBuffer.length; i < len; i++) {
                this.depthBuffer[i] = this._depth;
            }
        }

    }
    /**
     * 将截剪坐标转为物理屏幕坐标 
     * -1~1 转为(0~width)
    */
    viewport(x:number, y:number, w:number, h:number) {
        //{{{w/2., 0, 0, x+w/2.}, {0, h/2., 0, y+h/2.}, {0,0,1,0}, {0,0,0,1}}}
        return mat4.set(this.viewportMatrix,
            w / 2, 0, 0, 0,
            0, h / -2, 0, 0,
            0, 0, 1, 0,
            x + w / 2, ((this.height - h) - y) + h / 2, 0, 1
        )
    }
    drawFrameBuffer(frameBuffer:ImageData) {
        this.ctx.putImageData(frameBuffer, 0, 0)
    }
    flush() {
        this.drawFrameBuffer(this.frameBuffer)
    }
    // 像素行列坐标
    getPixelIndexFromPoint(x:number, y:number) {
        return (y * this.width + x) * 4
    }
    getDepthIndexFromPoint(x:number, y:number) {
        return (x + y * this.width);
    }
    getDepth(x:number ,y:number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return -Infinity
        }
        x = x << 0
        y = y << 0
        const depthIndex = this.getDepthIndexFromPoint(x, y)
        const zdepth = this.depthBuffer[depthIndex]
        return zdepth
    }
    drawPoint(x:number, y:number, z:number, color:number[]) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return
        }
        x = x << 0
        y = y << 0
        const depthIndex = this.getDepthIndexFromPoint(x, y)
        const zdepth = this.depthBuffer[depthIndex]
        if (zdepth < z) {
            return
        }
        this.depthBuffer[depthIndex] = z;

        const index = this.getPixelIndexFromPoint(x, y)
        this.frameBuffer.data[index] = color[0] * 255
        this.frameBuffer.data[index + 1] = color[1] * 255
        this.frameBuffer.data[index + 2] = color[2] * 255
        this.frameBuffer.data[index + 3] = color[3] * 255
    }

    projectScreen(out:number[], v:number[]) {
        // 将-1 ~ 1 转换为0~width
        out[0] = (v[0] + 1) * this.width * 0.5 >> 0
        out[1] = (-v[1] + 1) * this.height * 0.5 >> 0
        //  vec3.transformMat4(out, v, this.viewportMatrix)
        // v.x = v.x * this.width * 0.5 + this.width * 0.5 >> 0
        /// v.y = -v.y * this.height * 0.5 + this.height * 0.5 >> 0
    }
    barycentric(a:Vec3Like, b:Vec3Like, c:Vec3Like, p:Vec3Like) {
        let u = [
            b[0] - c[0],
            c[0] - a[0],
            p[0] - c[0]
        ]
        let v = [
            b[1] - c[1],
            c[1] - a[1],
            p[1] - c[1]
        ]
        let area = u[0] * v[1] - v[0] * u[1]
        const alpha = (u[2] * v[0] - v[2] * u[0]) / area
        const beta = (u[2] * v[1] - v[2] * u[1]) / area
        const gamma = 1 - alpha - beta
        if (Math.abs(area) < 1) return [-1, 1, 1];
        return new Float32Array([alpha, beta, gamma])
    }
    barycentric2(a:number[], b:number[], c:number[], p:number[]) {
        // 重心算法，求三角形总面积，再以p中心，划分三个角形的面积等于总面积，证明p点在三角形内

        // 划公三角形 ，ac ab ap 叉乘求面积比
        let u = [
            c[0] - a[0],
            b[0] - a[0],
            a[0] - p[0]
        ]

        let v = [
            c[1] - a[1],
            b[1] - a[1],
            a[1] - p[1]
        ];
        //  y z x y 
        //  y z x y
        // x=y*z-z*y
        // y =z*x-x*z
        // z=x*y-y*x
        let uv = [
            u[1] * v[2] - u[2] * v[1], // ab*ap的叉剩面积
            u[2] * v[0] - u[0] * v[2], // ac* ap的叉乘面积
            u[0] * v[1] - u[1] * v[0]  // 整个三角形  ac*ab 叉乘面积
        ]

        // `pts` and `P` has integer value as coordinates
        // so `Math.abs(u[2]) < 1` means `u[2]` is 0, that means
        // triangle is degenerate, in this case return something with negative coordinates
        if (Math.abs(uv[2]) < 1) return [-1, 1, 1];

        // uv[2]是整个三角形的面积*2= cross(ac,ab)    ac*ap/(ac*cb) ab*ap/(ac*cb)
        // 总比===1 
        return vec3.fromValues(
            1 - (uv[0] + uv[1]) / uv[2], // 用1-(ac*ap)+ab*ap的比，等a的比例
            uv[1] / uv[2],
            uv[0] / uv[2] // 
        );
    }
    // 插值填充
    fillTriangleWithInterpolate(a:Vertex3, b:Vertex3, c:Vertex3, data:any) {
        let { color, texture } = data;

        let temp;
        if (a.positionScreen[1] > b.positionScreen[1]) {
            temp = a;
            a = b;
            b = temp;
        }
        if (b.positionScreen[1] > c.positionScreen[1]) {
            temp = b;
            b = c;
            c = temp;
        }
        if (a.positionScreen[1] > b.positionScreen[1]) {
            temp = a;
            a = b;
            b = temp;
        }


        let ax = a.positionScreen[0], ay = a.positionScreen[1], az = a.positionScreen[2]
        let bx = b.positionScreen[0], by = b.positionScreen[1], bz = b.positionScreen[2]
        let cx = c.positionScreen[0], cy = c.positionScreen[1], cz = c.positionScreen[2]
        let left, right;

        let k = 0;
        let k2 = 0
        if (by - ay > 0) {
            k = (bx - ax) / (by - ay) //k 是正数：b 在a的右边，负数：b在a的左边
        }
        if (cy - ay > 0) {
            k2 = (cx - ax) / (cy - ay)//k2 是正数：c 在a的右边，负数：c在a的左边
        }
        let textureColor = [1, 0, 0, 1]
        let u1, u2, v1, v2, t, t2, t3, u, v, z, z1, z2, depth;
        // b在a的右边，否则b在a的左边
        let isRight = k > k2// bx >= cx; 表示b在c的右边
        let isFlatBottom = by === cy
        let isFlatTop = ay === by;
        // 从Y轴，最小y开始逐行扫描 

        for (let y = ay >> 0; y <= cy >> 0; y++) {
            t = (cy - y) > 0 ? (y - ay) / (cy - ay) : 1
            // 如果是平底或其它
            if (y < by) {
                t2 = isFlatBottom ? t : (y - ay) / (by - ay);
                if (isRight) {
                    left = interpolate(ax, cx, t)
                    right = interpolate(ax, bx, t2)

                    u1 = interpolate(a.uv[0], c.uv[0], t)
                    u2 = interpolate(a.uv[0], b.uv[0], t2)

                    v1 = interpolate(a.uv[1], c.uv[1], t)
                    v2 = interpolate(a.uv[1], b.uv[1], t2)

                    z1 = interpolate(az, cz, t)
                    z2 = interpolate(az, bz, t2)
                } else {
                    left = interpolate(ax, bx, t2)
                    right = interpolate(ax, cx, t)

                    u1 = interpolate(a.uv[0], b.uv[0], t2)
                    u2 = interpolate(a.uv[0], c.uv[0], t)

                    v1 = interpolate(a.uv[1], b.uv[1], t2)
                    v2 = interpolate(a.uv[1], c.uv[1], t)

                    z1 = interpolate(az, bz, t2)
                    z2 = interpolate(az, cz, t)
                }

            } else {
                // 如果是平顶或其它
                t2 = isFlatTop ? t : (y - by) / (cy - by);
                if (isRight) {
                    left = interpolate(ax, cx, t)
                    right = interpolate(bx, cx, t2)


                    u1 = interpolate(a.uv[0], c.uv[0], t)
                    u2 = interpolate(b.uv[0], c.uv[0], t2)

                    v1 = interpolate(a.uv[1], c.uv[1], t)
                    v2 = interpolate(b.uv[1], c.uv[1], t2)

                    z1 = interpolate(az, cz, t)
                    z2 = interpolate(bz, cz, t2)
                } else {
                    left = interpolate(bx, cx, t2)
                    right = interpolate(ax, cx, t)


                    u1 = interpolate(b.uv[0], c.uv[0], t2)
                    u2 = interpolate(a.uv[0], c.uv[0], t)

                    v1 = interpolate(b.uv[1], c.uv[1], t2)
                    v2 = interpolate(a.uv[1], c.uv[1], t)

                    z1 = interpolate(bz, cz, t2)
                    z2 = interpolate(az, cz, t)
                }

            }
            left = left >> 0
            right = right >> 0

            for (let x = left; x <= right; x++) {
                t3 = right - left > 0 ? (x - left) / (right - left) : 1
                u = interpolate(u1, u2, t3)
                v = interpolate(v1, v2, t3)
                z = interpolate(z1, z2, t3)

                depth = this.getDepth(x, y)
                if (depth < z) {
                    continue
                }
                if (texture && texture.loaded) {
                    texture.map(color, u, v)
                }
                this.drawPoint(x, y, z, color)
            }
        }
    }
    // 重心算法
    // 三角形光栅化阶段
    fillTriangle(a:Vertex3, b:Vertex3, c:Vertex3, data:any) {
        let { color, texture } = data;

        const bboxmin = { x: Infinity, y: Infinity }
        const bboxmax = { x: -Infinity, y: -Infinity }
        bboxmin.x = Math.max(0, Math.min(a.positionScreen[0], b.positionScreen[0], c.positionScreen[0]))
        bboxmin.y = Math.max(0, Math.min(a.positionScreen[1], b.positionScreen[1], c.positionScreen[1]))
        bboxmax.x = Math.min(this.width - 1, Math.max(a.positionScreen[0], b.positionScreen[0], c.positionScreen[0]))
        bboxmax.y = Math.min(this.height - 1, Math.max(a.positionScreen[1], b.positionScreen[1], c.positionScreen[1]))
        for (let x = Math.round(bboxmin.x); x <= bboxmax.x; x++) {
            for (let y = Math.round(bboxmin.y); y <= bboxmax.y; y++) {

                // 计算重心坐标
                let screen = this.barycentric(a.positionScreen, b.positionScreen, c.positionScreen, [x, y])
                if (screen[0] < 0 || screen[1] < 0 || screen[2] < 0) {
                    continue;
                }
                // 根据重心会标权重，计算uv
                let u = a.uv[0] * screen[0] + b.uv[0] * screen[1] + c.uv[0] * screen[2]
                let v = a.uv[1] * screen[0] + b.uv[1] * screen[1] + c.uv[1] * screen[2]
                //  u=this.roundPrecision(u,2)
                //  v=this.roundPrecision(v,2)

                let z = a.positionScreen[2] * screen[0] + b.positionScreen[2] * screen[1] + c.positionScreen[2] * screen[2];

                // 正常深度是在片段着色器之后运行
                // 片段着色器会返回最终像素颜色，例如纹理，光照 都是在片段着色器完
                // 片段着色器执行完成，会进入模板测试(Stencil Test)会开始执行 ，它也有可能丢失当前像素
                // 最后进行深度测试，深度测试通过，就写入颜色
                let depth = this.getDepth(x, y)
                if (depth < z) {
                    continue
                }
                if (texture && texture.loaded) {
                    texture.map(color, u, v)
                }
                this.drawPoint(x, y, z, color)
            }
        }

    }

    interpolate(start, end, t, defaultValue = 0) {
        if (!Number.isFinite(t)) {
            t = defaultValue;
        }
        return start + (end - start) * t;
    }
    interpolateRound(start, end, t) {
        return Math.round(start + (end - start) * t)
    }

    roundPrecision(value, p) {
        return Math.round(Math.pow(10, p) * value) * 1 / Math.pow(10, p)
    }
    drawTriangleLine(a, b, c, data) {
        let { color } = data
        const abc = [a, b, c]
        for (let i = 0; i < 3; i++) {
            let s = abc[i]
            let e = abc[(i + 1) % 3]
            let pa = s.positionScreen, pb = e.positionScreen;
            let x0 = pa[0], y0 = pa[1], x1 = pb[0], y1 = pb[1]
            let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
            if (steep) {
                [x0, y0] = [y0, x0];
                [x1, y1] = [y1, x1];
            }
            if (x0 > x1) {
                [x0, x1] = [x1, x0];
                [y0, y1] = [y1, y0];
            }
            let deltax = x1 - x0;
            let deltay = Math.abs(y1 - y0);
            let error = deltax / 2;
            let ystep = (y0 < y1) ? 1 : -1;
            let y = y0;

            for (let x = x0; x <= x1; x++) {
                // let screen=this.barycentric(a.positionScreen,b.positionScreen,c.positionScreen,[x,y])
                // if (screen[0] < 0 || screen[1] < 0 || screen[2] < 0) {
                //     continue;
                // }
                let t = x / x1;
                let z = pa[2] + (pb[2] - pa[2]) * t;

                if (steep) {
                    this.drawPoint(y, x, z, color)
                } else {
                    this.drawPoint(x, y, z, color)
                }
                error -= deltay;
                if (error < 0) {
                    y += ystep;
                    error += deltax;
                }
            }
        }
    }
    drawLine(x0, y0, x1, y1, z, color) {

        let steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
        if (steep) {
            [x0, y0] = [y0, x0];
            [x1, y1] = [y1, x1];
        }
        if (x0 > x1) {
            [x0, x1] = [x1, x0];
            [y0, y1] = [y1, y0];
        }
        let deltax = x1 - x0;
        let deltay = Math.abs(y1 - y0);
        let error = deltax / 2;
        let ystep = (y0 < y1) ? 1 : -1;
        let y = y0;

        for (let x = x0; x <= x1; x++) {
            if (steep) {
                this.drawPoint(y, x, z, color)
            } else {
                this.drawPoint(x, y, z, color)
            }
            error -= deltay;
            if (error < 0) {
                y += ystep;
                error += deltax;
            }
        }

    }
    render(objects, projectionMatrix, viewMatrix) {

        let projectionViewMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);
        let projectionViewModelMatrix = mat4.create()
        let data = {}
        for (let i = 0; i < objects.length; i++) {

            let object = objects[i]
            let faces = object.faces
            let vertices = object.vertices;
            let modelMatrixWorld = object.matrixWorld


            for (let j = 0; j < vertices.length; j++) {
                let vertex = vertices[j]
                let position = vertex.position
                let positionWorld = vertex.positionWorld;
                let positionProjClip = vertex.positionProjClip;
                let positionScreen = vertex.positionScreen
                vec3.copy(positionWorld, position)
                vec3.transformMat4(positionWorld, positionWorld, modelMatrixWorld)

                vec3.copy(positionProjClip, positionWorld)
                positionProjClip[3] = 1
                // -1 ~ 1
                vec4.transformMat4(positionProjClip, positionProjClip, projectionViewMatrix)
                positionProjClip[0] /= positionProjClip[3]
                positionProjClip[1] /= positionProjClip[3]
                positionProjClip[2] /= positionProjClip[3]

                vec3.copy(positionScreen, positionProjClip)
                // 投影到屏幕
                vec3.transformMat4(positionScreen, positionScreen, this.viewportMatrix)
                // vec2.round(positionScreen,positionScreen)

                // positionScreen[2]*=this._
                //this.projectScreen(positionScreen,positionScreen)
                // 屏幕坐标变整数

                //  console.log('positionScreen',positionScreen)

            }
            for (let j = 0; j < faces.length; j++) {

                let f = faces[j]
                let va = vertices[f.a]
                let vb = vertices[f.b]
                let vc = vertices[f.c]
                data.color = f.color;
                data.texture = object.texture
                if (this.isInterpolateFill) {
                    this.fillTriangleWithInterpolate(va, vb, vc, data)
                } else {
                    this.fillTriangle(va, vb, vc, data)
                }

            }
        }
        this.flush()
    }

}
function init(){
    
let gl = new Renderer3D(container, 500, 500)

let projectionMatrix = mat4.perspective([], 50 * Math.PI / 180, gl.width / gl.height, 0.1, 100)
let viewMatrix = mat4.lookAt([], [0, 1, 3], [0, 0, 0], [0, 1, 0])

let cube = new Cube(1, 1, 1)

let meshs = []
let mesh = new Mesh()
mesh.vertices = cube.vertices.map(v => {
    return new Vertex3(v.position.x, v.position.y, v.position.z)
})
let faceColors = [[1, 0, 0, 1], [0, 1, 0, 1], [0, 0, 1, 1], [1, 1, 0, 1], [1, 0, 1, 1], [0, 1, 1, 1]]
cube.faces.forEach((v, i) => {
    // if(i!=0){
    //     return
    // }
    let face = new Face3(v.a, v.b, v.c)
    let face2 = new Face3(v.a, v.c, v.d)
    face2.color = face.color = faceColors[i]
    face.normal = vec3.fromValues(v.normal.x, v.normal.y, v.normal.z)
    face2.normal = vec3.fromValues(v.normal.x, v.normal.y, v.normal.z)

    mesh.faces.push(face)
    mesh.faces.push(face2)
})


gl.clear(Renderer3D.COLOR_BUFFER_BIT | Renderer3D.DEPTH_BUFFER_BIT)
// gl.viewport(0,0,250,250)
gl.render([mesh], projectionMatrix, viewMatrix)

function loadModel() {
    fetch('../softEngineJSPart6Sample2/monkey.babylon').then(res => res.clone()).then(res => res.json()).then(jsonObject => {
        let objects = jsonObject.meshes;
        let newMesh = new Mesh()
        var materials = [];

        for (var materialIndex = 0; materialIndex < jsonObject.materials.length; materialIndex++) {
            var material = {};

            material.Name = jsonObject.materials[materialIndex].name;
            material.ID = jsonObject.materials[materialIndex].id;
            if (jsonObject.materials[materialIndex].diffuseTexture)
                material.DiffuseTextureName = jsonObject.materials[materialIndex].diffuseTexture.name;

            materials[material.ID] = material;
        }
        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i]
            let vertices = obj.vertices
            let indices = obj.indices;
            var uvCount = obj.uvCount;
            var verticesStep = 1;
            if (uvCount > 0) {
                var meshTextureID = obj.materialId;
                var meshTextureName = materials[meshTextureID].DiffuseTextureName;
                newMesh.texture = new Texture('../softEngineJSPart6Sample2/' + meshTextureName, 512, 512);
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
                let vertex = new Vertex3(x, y, z)
                vec3.set(vertex.normal, nx, ny, nz)

                newMesh.vertices.push(vertex)
                if (uvCount > 0) {
                    var u = vertices[index + 6];
                    var v = vertices[index + 7];
                    vec2.set(vertex.uv, u, v)
                }
            }
            var facesCount = indices.length / 3;
            for (let i = 0; i < facesCount; i++) {
                let index = i * 3;
                newMesh.faces.push(new Face3(indices[index], indices[index + 1], indices[index + 2]))
            }
            meshs.push(newMesh)
        }

    })
}
loadModel()
// meshs.push(mesh)
function animate() {

    if (meshs.length > 0) {
        meshs[0].rotation[1] += 0.03;
        meshs[0].updateMatrix()
    }
    gl.clear(Renderer3D.COLOR_BUFFER_BIT | Renderer3D.DEPTH_BUFFER_BIT)
    // gl.viewport(0,0,250,250)
    gl.render(meshs, projectionMatrix, viewMatrix)
    requestAnimationFrame(animate)
}

}