import {PathBuilder,PixelImage} from 'math/2d_raster/soft2d'
import {Renderer2D} from './lib/Renderer2D'
import {rasterizePath} from './lib/Rasterizer2D'
const canvas=document.createElement('canvas') as HTMLCanvasElement
canvas.width=500
canvas.height=500
canvas.style.display='block'
document.body.appendChild(canvas)
const ctx=canvas.getContext('2d')!


const renderer=new Renderer2D()
const path=new PathBuilder()

const pixel=new PixelImage(500,500)


path.rect(100,100,100,100)
rasterizePath(path,pixel,'evenodd')

ctx.putImageData(pixel.imageData,0,0)