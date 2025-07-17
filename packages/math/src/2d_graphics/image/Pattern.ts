import {Matrix2dLike} from '../math/Matrix2d'
export class Pattern implements CanvasPattern{
    setTransform(transform?: Matrix2dLike|DOMMatrixInit): void {
        throw new Error("Method not implemented.");
    }

}