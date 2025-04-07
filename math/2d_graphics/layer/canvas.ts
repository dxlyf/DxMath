
import {BaseLayer} from '../base/layer'


export class CanvasLayer extends BaseLayer{
    createDom(): HTMLElement {
        return document.createElement('canvas')
    }
    add(): this {
        throw new Error('Method not implemented.');
    }
    addGroup(): this {
        throw new Error('Method not implemented.');
    }
    
}