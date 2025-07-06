import { Matrix } from "./matrix";
import { Surface } from "./surface";
import { clamp } from "./util";

export enum TextureType{
    PLAIN=0,
    TILED=1
}

export class TextureData{
    matrix:Matrix=Matrix.identity();
    width:int=0
    height:int=0
    stride:int=0
    alpha:int=0
    pixels:Uint8ClampedArray|null=null;
}

export class Texture{
    static create(surface:Surface,type:TextureType=TextureType.PLAIN){
        const text= new Texture()
        text.type=type;
        text.surface=surface;
        return text
    }
    type:TextureType=TextureType.PLAIN;
    surface:Surface|null=null;
    matrix:Matrix=Matrix.identity();
    opacity:float64=1;
    init(surface:Surface,type:TextureType=TextureType.PLAIN){
        this.type=type;
        this.surface=surface;
        this.opacity=1
        this.matrix.identity()
    }
    setType(type:TextureType=TextureType.PLAIN){
        this.type=type;
    }
    setSurface(surface:Surface|null=null){
        this.surface=surface;
    }
    setMatrix(matrix:Matrix){
        this.matrix.copy(matrix)
    }
    setOpacity(opacity:float64){
        this.opacity=clamp(opacity,0,1);
    }
    destory(){
        this.surface=null
    }
    copy(texture:Texture){
        this.type=texture.type;
        this.surface=texture.surface;
        this.matrix.copy(texture.matrix);
        this.opacity=texture.opacity;
    }
    clone(){
        const texture= new Texture()
        texture.copy(this)
        return texture
    }
}