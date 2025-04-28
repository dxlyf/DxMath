import { Bitmap } from "./lib/Bitmap";
import { PathBuilder } from "math/2d_raster/soft2d";
import { Rasterizer,FillRule } from "./lib/Rasterizer";
import { Paint } from "./lib/Paint";


const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width=window.innerWidth
canvas.height=window.innerHeight
const ctx = canvas.getContext("2d")!;
// 创建画布
const bmp = new Bitmap(500, 500);

// 创建路径
 const path = new PathBuilder();
// path.rect(100, 100, 100,100)
path.ellipse(100,100,50,50,0,0,Math.PI*2,false)
// let invPath=new PathBuilder()
// invPath.rect(80, 80, 140,140)
// path.addReversePath(invPath)
const paint=new Paint()
paint.setColor([255,0,0,255])
const raster=new Rasterizer()
// 填充路径到 Bitmap
raster.stroke(bmp, path,paint)

let imageData=new ImageData(bmp.data, bmp.width, bmp.height)


ctx.putImageData(imageData, 0, 0)
//path.toCanvas(ctx)

//ctx.fill('nonzero')
// 现在 bmp.data 就是一个填好颜色的像素数组了
