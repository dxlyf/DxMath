import {Matrix2dLike} from '../math/Matrix2d'

export enum PatternRepeat{
    repeat='repeat',
    noRepeat='no-repeat',
    repeatX='repeat-x',
    repeatY='repeat-y'
}
export class Pattern implements CanvasPattern{
    image:CanvasImageSource|null=null
    repetition:string=PatternRepeat.repeat
    constructor(image: CanvasImageSource, repetition: string=PatternRepeat.repeat){
        this.image = image;
        this.repetition = repetition
    }
    setTransform(transform?: Matrix2dLike|DOMMatrixInit): void {
        throw new Error("Method not implemented.");
    }

}
