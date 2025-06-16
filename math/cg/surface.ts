
export class Surface{
    static create(width:int,height:int):Surface{
        const surface=new Surface()
        surface.width=width
        surface.height=height
        surface.stride=width*4
        surface.owndata=1
        surface.pixels=new Uint8ClampedArray(surface.stride*height)
        return surface
    }
    width:int=0
    height:int=0
    stride:int=0
    owndata:int=0
    pixels:ImageDataArray|null=null

    destroy(){
        this.pixels=null
    }
}