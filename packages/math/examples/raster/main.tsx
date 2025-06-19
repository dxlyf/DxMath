import { Bitmap } from "./lib/Bitmap";
import { PathBuilder } from "math/2d_raster/soft2d";
import { Path } from "math/2d_path/path";
import { Rasterizer,FillRule } from "./lib/Rasterizer";
import { Paint } from "./lib/Paint";
import { LineJoin,LineCap, Stroker } from "./lib/Stroker";

function test(){
  
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width=window.innerWidth
canvas.height=window.innerHeight
const ctx = canvas.getContext("2d")!;


// 创建画布
const bmp = new Bitmap(500, 500);

// 创建路径
 const path = PathBuilder.default()


 path.moveTo(100,100)
 path.lineTo(200,100)
 path.lineTo(200,200)
// path.lineTo(200,200)
//path.rect(100, 100, 100,100)
//path.ellipse(100,100,50,50,0,0,Math.PI*2,false)

//path.ellipse(100,100,70,70,0,1,Math.PI*2,true)
 let invPath=new PathBuilder()
//invPath.rect(80, 80, 140,140)
//invPath.ellipse(100,100,70,70,0,0,Math.PI*2,false)

 //path.addPath(invPath)
const paint=new Paint()
paint.lineWidth=20
paint.lineJoin=LineJoin.MITER
paint.lineCap=LineCap.ROUND
paint.setColor([255,0,0,255])

const raster=new Rasterizer()

//path.closePath()

// 填充路径到 Bitmap
//raster.drawLine(bmp, path,paint)

let stroke=new Stroker()
let strokePath=stroke.stroke(path,paint)

strokePath.toCanvas(ctx)
//paint.toCanvas(ctx)
ctx.stroke()
return
raster.stroke(bmp,strokePath,paint)
let imageData=new ImageData(bmp.data, bmp.width, bmp.height)

 ctx.putImageData(imageData, 0, 0)
  path.toCanvas(ctx)
  ctx.lineJoin=paint.lineJoin
  ctx.lineCap=paint.lineCap
ctx.lineWidth=paint.lineWidth
 // ctx.stroke()

// ctx.beginPath()
// ctx.fillStyle='green'
// ctx.ellipse(100,100,50,50,0,0,Math.PI/2,false)
// ctx.fill()
// 现在 bmp.data 就是一个填好颜色的像素数组了

}
test()