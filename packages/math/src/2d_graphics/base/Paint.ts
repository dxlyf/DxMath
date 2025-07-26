
import {Color,ColorValue} from '../image/Color'
export enum PaintStyle{
    Fill=1,// 填充模式
    Stroke=2,// 描边模式
    FillAndStroke=3,// 填充和描边模式
}
export type PaintColor=ColorValue
export interface IPaint{
    paintStyle:PaintStyle;
    color:Color|ColorValue|null;
}

export class Paint implements IPaint{
    paintStyle=PaintStyle.Fill;
    color=null;

}