// Copyright 2010 The Freetype-Go Authors. All rights reserved.
// Use of this source code is governed by your choice of either the
// FreeType License or the GNU General Public License version 2 (or
// any later version), both of which can be found in the LICENSE file.


type uint32=number
type int=number
type uint8=number
// A Span is a horizontal segment of pixels with constant alpha. X0 is an
// inclusive bound and X1 is exclusive, the same as for slices. A fully opaque
// Span has Alpha == 0xffff.
export interface Span {
	Y:int
    X0:int
    X1:int
	Alpha:uint32
}

// A Painter knows how to paint a batch of Spans. Rasterization may involve
// Painting multiple batches, and done will be true for the final batch. The
// Spans' Y values are monotonically increasing during a rasterization. Paint
// may use all of ss as scratch space during the call.
export interface Painter {
	Paint(ss:Span[], done:boolean):void
}

function rgbaModel(c:RGBA) {
	let {r, g, b, a }= c.RGBA()
    
	return RGBA.fromRGBA(r >> 8, g >> 8, b >> 8, a >> 8)
}
export class Image{

    pixels:Uint8ClampedArray // 像素数据
    stride:int
    rect:{
        Min:{x:number, y:number},
        Max:{x:number, y:number},
    }
    imageData:ImageData
    constructor(width:number, height:number) {
        this.pixels = new Uint8ClampedArray(width * height*4)
        this.imageData=new ImageData(this.pixels, width,height)
        this.stride=width*4
        this.rect={
            Min:{x:0, y:0},
            Max:{x:width, y:height},
        }
    }
    ColorModel(){
        return rgbaModel
    }
    Bounds(){
        return this.rect
    }
    PixOffset(x:int, y:int) {
        return (y - this.rect.Min.y) * this.stride + (x - this.rect.Min.x)*4
    }
    RGBAAt(x:int, y:int) {
        if(x<this.rect.Min.x || x>=this.rect.Max.x || y<this.rect.Min.y || y>=this.rect.Max.y) {
            return RGBA.fromRGBA(0, 0, 0, 0)
        }
        let i = this.PixOffset(x, y)
        let s = this.pixels.slice(i,i+4);//[i : i+4: i+4] // Small cap improves performance, see https://golang.org/issue/27857
        return RGBA.fromRGBA(s[0], s[1], s[2], s[3])
    }
}

  

export class RGBA{
    static fromRGBA(r:uint8, g:uint8, b:uint8, a:uint8){
        return new this(r, g, b, a)
    }
    static fromRGB(r:uint8, g:uint8, b:uint8){
        return new this(r, g, b, 255)
    }
    color=new Uint8Array(8)

    constructor(r:uint8, g:uint8, b:uint8, a:uint8) {
        this.color[0]=r
        this.color[1]=g
        this.color[2]=b
        this.color[3]=a
    }
    get R(){
        return this.color[0]
    }
    set R(value:uint8) {
        this.color[0] = value
    }
    get G(){
        return this.color[1]
    }
    set G(value:uint8) {
        this.color[1] = value
    }
    get B(){
        return this.color[2]
    }
    set B(value:uint8) {
        this.color[2] = value
    }
    get A(){
        return this.color[3]
    }
    set A(value:uint8) {
        this.color[3] = value
    }

    RGBA():{r:uint32, g:uint32, b:uint32, a:uint32}{
        const r = (this.R << 8) | this.R;
        const g = (this.G << 8) | this.G;
        const b = (this.B << 8) | this.B;
        const a = (this.A << 8) | this.A;
        return { r, g, b, a };
    }
}
export function NewRGBAPainter(image:Image):Painter{
    return new RGBAPainter(image)
}

export class RGBAPainter implements Painter{
    static fromImage(image:Image){
        return new this(image,)
    }
    image:Image
    op:'src'|'over'='over'
    cr:number
    cg:number
    cb:number
    ca:number
    constructor(image:Image) {
        this.image = image; // 目标图像
        this.cr = 0; // 红色分量
        this.cg = 0; // 绿色分量
        this.cb = 0; // 蓝色分量
        this.ca = 0; // 透明度分量
    }

    Paint(ss:Span[], done:boolean) {
        const b = this.image.Bounds(); // 获取图像的边界
        
        for (const s of ss) {
            if (s.Y < b.Min.y) {
                continue
            }
            if (s.Y >= b.Max.y) {
                return
            }
            if( s.X0 < b.Min.x) {
                s.X0 = b.Min.x
            }
            if (s.X1 > b.Max.x) {
                s.X1 = b.Max.x
            }
            if( s.X0 >= s.X1) {
                continue
            }

        // This code mimics drawGlyphOver in $GOROOT/src/image/draw/draw.go.
		let ma = s.Alpha
		const m = 1<<16 - 1
		let i0 = (s.Y-b.Min.y)*this.image.stride + (s.X0-b.Min.x)*4
		let i1 = i0 + (s.X1-s.X0)*4
		if(this.op == "over") {

			for(let i = i0; i < i1; i += 4) {
              
				let dr= (this.image.pixels[i+0])
				let dg= (this.image.pixels[i+1])
				let db= (this.image.pixels[i+2])
				let da= (this.image.pixels[i+3])
				let a = (m - (this.ca * ma / m)) * 0x101
				this.image.pixels[i+0] =((dr*a + this.cr*ma) / m >> 8)&0xff
				this.image.pixels[i+1] =((dg*a + this.cg*ma) / m >> 8)&0xff
				this.image.pixels[i+2] =((db*a + this.cb*ma) / m >> 8)&0xff
				this.image.pixels[i+3] =((da*a + this.ca*ma) / m >> 8)&0xff
               
			}
		} else {
			for(let i = i0; i < i1; i += 4 ){
				this.image.pixels[i+0] = (this.cr * ma / m >> 8)&0xff
				this.image.pixels[i+1] = (this.cg * ma / m >> 8)&0xff
				this.image.pixels[i+2] = (this.cb * ma / m >> 8)&0xff
				this.image.pixels[i+3] = (this.ca * ma / m >> 8)&0xff
			}
		}
        }
    }

    setColor(color:RGBA) {
        const {r,g,b,a}=color.RGBA()
        // 设置颜色分量
        this.cr = r;
        this.cg = g;
        this.cb = b;
        this.ca = a;
    }
}

