function clamp(x:number, min:number, max:number):number{
    return Math.max(min, Math.min(x, max))
}

function lerp(start:number, end:number, t:number):number{
    return start + (end - start) *t
}
function smoonthstep(start:number, end:number, t:number):number{
    return start + (end - start)*(t*t*(3-2*t))
}

export class Texture{

    static setTextureData(texture:Texture, img:HTMLImageElement|HTMLCanvasElement, width:number, height:number,drp:number=1, mipmap:boolean=false){
        const ctx=document.createElement('canvas').getContext('2d',{willReadFrequently:true})!
       // ctx!.imageSmoothingEnabled=true
      //  ctx!.imageSmoothingQuality='high'
     
        ctx.canvas.style.width=width+'px'
        ctx.canvas.style.height=height+'px'
        ctx.canvas.width=width*drp
        ctx.canvas.height=height*drp
        
      //  ctx.scale(drp,drp)
        ctx.drawImage(img, 0, 0,img.width, img.height, 0, 0, width, height)
        const imageData=ctx!.getImageData(0, 0, width,height)
        // ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
        // ctx.putImageData(imageData,0,0)
        // document.body.appendChild(ctx.canvas)

        texture.width=width
        texture.height=height
        texture.data=imageData.data
        texture.loaded=true
    }
    static loadImage(imageUrl:string):Promise<HTMLImageElement>{
        return new Promise((resolve, reject)=>{
           let img=new Image()

           img.onload=()=>{
                resolve(img)
           }
           img.src=imageUrl

        })
    }
    static fromImageUrl(imageUrl:string,width:number, height:number){
        const texture=new this()
        const img=new Image()

        img.onload=()=>{
            this.setTextureData(texture,img,width,height,window.devicePixelRatio)
        }
        img.src=imageUrl
        return texture
    }
    static fromImage(img:HTMLImageElement|HTMLCanvasElement){
        const texture=new this()
   
        const ctx=document.createElement('canvas').getContext('2d')
        ctx!.canvas.width=img.width
        ctx!.canvas.height=img.height
        ctx!.drawImage(img, 0, 0)
        const imageData=ctx!.getImageData(0, 0, img.width, img.height)
        texture.data=imageData.data
        texture.width=imageData.width
        texture.height=imageData.height

        texture.loaded=true
        return texture
    }
    static fromCanvas(canvas:HTMLCanvasElement){
        return this.fromImage(canvas)
    }
    width:number=0
    height:number=0

    data!:Uint8ClampedArray
    loaded:boolean=false
    flipY:boolean=false
    constructor(){

    }

    getColor(u:number, v:number):number[]{
        if(u>1){
            u=u-Math.floor(u)
        }
        if(v>1){
            v=v-Math.floor(v)
        }
     
        const width=this.width-1>>0
        const height=this.height-1>>0

        const x=clamp(u*width, 0, width)>>0
        const y=clamp(this.flipY?height-v*height:v*height, 0, height)>>0
        if(x>=0 && x<this.width && y>=0 && y<this.height){
            
            const index=4*(x+y*this.width)
            return [this.data[index]/255, this.data[index+1]/255, this.data[index+2]/255,1];
        }
        return [0, 0, 0,1];
    }
    getTextureData(pixelX:number, pixelY:number) {
        pixelX = pixelX >> 0
        pixelY = pixelY >> 0
        let index = (pixelY * this.width + pixelX) * 4;

        let r = this.data[index]
        let g = this.data[index + 1]
        let b = this.data[index + 2]
        let a = this.data[index + 3]
        return [r, g, b, a]
    }
    getTexture(u:number, v:number) {
        let pixelX = u * (this.width - 1)
        let pixelY = v * (this.height - 1)

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


        // var color = [];
        // interpolationColor(color, color1, color2, fracX);
        // var colorTemp = []
        // interpolationColor(colorTemp, color3, color4, fracX);
        // interpolationColor(color, color, colorTemp, fracY);

        // let alpha = (color1[3] + color2[3] + color3[3] + color4[3]) / 4;
        // return [color[0], color[1], color[2], 255]
    }
    map(u:number, v:number,color?:number[] ) {
        color=color||[0,0,0,1] 
        if (!this.loaded) {
            return color
        }
        let texture = this.getTexture(u, v) // 尺寸

        color[0] = texture[0] / 255;
        color[1] = texture[1] / 255;
        color[2] = texture[2] / 255;
        color[3] = texture[3] / 255;
        return color;
    }
}