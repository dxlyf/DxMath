import { RGBColor,Color } from "./Color";
import {Matrix2D,Matrix2dLike} from '../math/Matrix2d'
export interface GradientStop{
    offset:number;
    color:Color;
}

export class Gradient implements CanvasGradient{
    colorStops:GradientStop[]=[];
    matrix:Matrix2D|null=null;
    transform(matrix:Matrix2dLike){
        this.matrix =Matrix2D.fromMatrix2D(matrix)
    }
    addColorStop(offset: number, color: string | Color){
        this.insertColorStop(offset,color);
      
    }
    private insertColorStop(offset:number,color:string | Color){
        let index = this.colorStops.findIndex((stop)=>{return stop.offset>offset})
        if (index==-1) {
            this.colorStops.push({offset,color:Color.parse(color)})
        }else{
            this.colorStops.splice(index,0,{offset,color:Color.parse(color)})
        }
    }
}

export class LinearGradient extends Gradient{
    constructor(public x0:number,public  y0:number,public  x1:number,public  y1:number){
        super()
    }
}

export class RadialGradient extends Gradient{
    constructor(public x0:number,public  y0:number,public  r0:number,
                public  x1:number,public  y1:number,public  r1:number){
        super()
    }
}
export class ConicGradient extends Gradient{
    constructor(public startAngle:number,public x:number,public  y:number){
        super()
    }
}
