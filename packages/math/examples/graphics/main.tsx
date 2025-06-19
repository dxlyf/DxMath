import { Bitmap } from "./lib/Bitmap";
import { PathBuilder } from "math/2d_graphics/path/PathBuilder";
import { LineCap, LineJoin, Rasterizer } from "./lib/Rasterizer";
import { FillRule } from "./lib/FillRule";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width=window.innerWidth
canvas.height=window.innerHeight
const ctx = canvas.getContext("2d")!;
// 创建画布
const bmp = new Bitmap(500, 500);

// 创建路径
const path = new PathBuilder();
path.moveTo(100, 100);
path.quadraticBezierTo(200,50,300,100)
path.lineTo(200,200)
   

// 填充路径到 Bitmap
Rasterizer.stroke(bmp, path, {
    color: [255, 0, 0, 255],
    lineWidth: 10,
    lineCap:LineCap.BUTT,
    lineJoin:LineJoin.ROUND,
    miterLimit:10
}); // 红色填充

let imageData=new ImageData(bmp.data, bmp.width, bmp.height)
ctx.putImageData(imageData, 0, 0)
// 现在 bmp.data 就是一个填好颜色的像素数组了
