type PixelRendererOptions = {
    ctx: CanvasRenderingContext2D
    width?:number
    height?:number
}
export class PixelRenderer {
    ctx: CanvasRenderingContext2D
    width: number = 0
    height: number = 0
    colorBuffer: ImageDataArray
    imageData: ImageData
    constructor(opts: PixelRendererOptions) {
        this.ctx = opts.ctx
        this.width = Math.floor(opts.width??this.ctx.canvas.width)
        this.height = Math.floor(opts.height??this.ctx.canvas.height)
        this.colorBuffer = new Uint8ClampedArray(this.width * this.height * 4)
        this.imageData = new ImageData(this.colorBuffer, this.width, this.height)
    }
    setPixel(x: number, y: number, color: number[]) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
        x=x>>0
        y=y>>0
        let index = (x + y * this.width) * 4
        this.colorBuffer[index] = color[0]
        this.colorBuffer[index + 1] = color[1]
        this.colorBuffer[index + 2] = color[2]
        if (color.length === 4) {
            this.colorBuffer[index + 3] = color[3]
        } else {
            this.colorBuffer[index + 3] = 255
        }
    }
    
    flush(){
        const canvasWidth=this.ctx.canvas.width,canvasHeight=this.ctx.canvas.height;
        this.ctx.clearRect(0, 0,canvasWidth, canvasHeight)
        const width_rate=canvasWidth/this.width
        const height_rate=canvasHeight/this.height
        const w=Math.floor(width_rate),h=Math.floor(height_rate);
        if(w===1&&h===1) {
            this.ctx.putImageData(this.imageData, 0, 0)
            return
        }
        let marginLeft=(width_rate-w)*this.width/2
        let marginTop=(height_rate-h)*this.height/2
        const data=this.imageData,height=data.height,width=data.width,colorBuffer=this.colorBuffer;

    
        for(let y=0;y<height;++y){
            for(let x=0;x<width;++x){
                const index = (x + y * width) * 4
                this.ctx.beginPath();
                this.ctx.fillStyle=`rgba(${colorBuffer[index]},${colorBuffer[index+1]},${colorBuffer[index+2]},${colorBuffer[index+3]/255})`;
                this.ctx.fillRect(x*w+marginLeft,y*h+marginTop,w,h);
            }
        }

    

        for(let y=0;y<height*4;++y){
            this.ctx.beginPath();
            this.ctx.lineWidth=1
            this.ctx.strokeStyle=y%4==0?"black":"rgba(0,0,0,0.2)";
            this.ctx.moveTo(marginLeft,y*h/4+marginTop)
            this.ctx.lineTo(this.width*w,y*h/4+marginTop)
            this.ctx.stroke()
        }
        for(let x=0;x<width*4;++x){
            this.ctx.beginPath();
            this.ctx.lineWidth=1
            this.ctx.strokeStyle=x%4==0?"black":"rgba(0,0,0,0.2)";
            this.ctx.moveTo(x*w/4+marginLeft,marginTop)
            this.ctx.lineTo(x*w/4+marginLeft,this.height*h)
            this.ctx.stroke()
          
        }
      
    }


}


type PixelGridRendererOptions = {
    ctx: CanvasRenderingContext2D
    width?:number
    height?:number
    scale?:number
    offset?:number[]
}

export class PixelGridRenderer {
    ctx: CanvasRenderingContext2D
    width: number = 0
    height: number = 0
    dimensions:number=64
    row:number=4
    col:number=4
    rows:number=10
    cols:number=10
    grid:{}[]=[]
    constructor(opts: PixelGridRendererOptions) {
        this.ctx = opts.ctx
        this.width = this.cols*this.dimensions
        this.height =this.rows*this.dimensions

    }

    setPixel(x: number, y: number, color: number[]) {
        if(x>=0&&y>=0&&x<this.width&&y<this.height) {

        }

    }
    drawAxis(x:number,y:number,x2:number,y2:number){
        this.ctx.beginPath()
        this.ctx.lineWidth=1
        this.ctx.strokeStyle="black";
        this.ctx.moveTo(x,y)
        this.ctx.lineTo(x2,y2)
        this.ctx.stroke()
    }
    draw(){
        this.ctx.clearRect(0, 0,this.ctx.canvas.width, this.ctx.canvas.height)
        this.ctx.save()

        this.ctx.restore()
    }


}