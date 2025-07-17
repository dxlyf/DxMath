import { RGBColor,Color } from "./Color";

export interface GradientStop{
    offset:number;
    color:Color;
}
export class Gradient implements CanvasGradient{
    colorStops:GradientStop[]=[];
    addColorStop(offset: number, color: string | Color){
        this.colorStops.push({offset,color:Color.parse(color)});
    }
}
