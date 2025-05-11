// main.ts
import { Path2DImpl } from './core/Path2DImpl.ts';
import {BezierFlattener} from './core/BezierFlattener.ts'
import {StrokeGenerator} from './core/StrokeGenerator.ts'
import {Rasterizer2D} from './core/Rasterizer2D.ts'
import {Renderer2D} from './core/Renderer2D.ts'

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
const raster = new Rasterizer2D(canvas.width, canvas.height);

const path = new Path2DImpl();
path.moveTo(50, 50);
path.lineTo(150, 50);
path.lineTo(100, 150);
path.closePath();
