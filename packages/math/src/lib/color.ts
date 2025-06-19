import { clamp01 } from "./math"
import { Num } from "./number"

export class Color{
    elements:Float32Array=new Float32Array(4)
    static TRANSPARENT= Color.from_rgba(0,0,0,0)
    static WHITE=Color.from_rgba(1,1,1,1)
    static RED= Color.from_rgba(1,0,0,1)
    static GREEN= Color.from_rgba(0,1,0,1)
    static BLUE= Color.from_rgba(0,0,1,1)
    static YELLOW= Color.from_rgba(1,1,0,1)
    static CYAN= Color.from_rgba(0,1,1,1)
    static MAGENTA= Color.from_rgba(1,0,1,1)
    static BLACK= Color.from_rgba(0,0,0,1)
    static from_rgba8(r:u8,g:u8,b:u8,a:u8){
        return new this([r/255,g/255,b/255,a/255])
    }
    static from_rgba(r:u8,g:u8,b:u8,a:u8){
        return new this([r,g,b,a])
    }
    constructor(elements:number[]){
        this.elements.set(elements)
    }
    get r(){return this.elements[0]}
    set r(value){this.elements[0]=value}
    get g(){return this.elements[1]}
    set g(value){this.elements[1]=value}
    get b(){return this.elements[2]}
    set b(value){this.elements[2]=value}
    get a(){return this.elements[3]}
    set a(value){this.elements[3]=value}
    get red(){return this.elements[0]}
    set red(value){this.elements[0]=value}
    get green(){return this.elements[1]}
    set green(value){this.elements[1]=value}
    get blue(){return this.elements[2]}
    set blue(value){this.elements[2]=value}
    get alpha(){return this.elements[3]}
    set alpha(value){this.elements[3]=value}
    apply_opacity(opacity:number){
        this.a*=Num.new(opacity).bound(0,1).value
    }
    is_opaque(){
       return this.a==ALPHA_OPAQUE
    }

    premultiply(){
        if(this.is_opaque()){
            return PremultipliedColorU8.from_rgba_unchecked(this.r,this.g,this.b,this.a)
        }else{
            return PremultipliedColorU8.from_rgba_unchecked(
                Num.new(this.r*this.a).clamp01().value,
                Num.new(this.g*this.a).clamp01().value,
                Num.new(this.b*this.a).clamp01().value,this.a)
        }
    }
    to_color_u8(){

    }

}

/// 8-bit type for an alpha value. 255 is 100% opaque, zero is 100% transparent.
 type AlphaU8 = u8;

/// Represents fully transparent AlphaU8 value.
export const ALPHA_U8_TRANSPARENT: AlphaU8 = 0x00;

/// Represents fully opaque AlphaU8 value.
export const ALPHA_U8_OPAQUE: AlphaU8 = 0xFF;

/// Represents fully transparent Alpha value.
export const ALPHA_TRANSPARENT: NormalizedF32 =0;

/// Represents fully opaque Alpha value.
export const ALPHA_OPAQUE: NormalizedF32 =1;

export class ColorU8{
    static from_rgba(r:u8,g:u8,b:u8,a:u8):ColorU8{
        return new this([r,g,b,a])
    }

    elements:Uint8Array=new Uint8Array(4)
    constructor(elements:number[]){
        this.elements.set(elements)
    }
    get red(){return this.elements[0]}
    get green(){return this.elements[1]}
    get blue(){return this.elements[2]}
    get alpha(){return this.elements[3]}
    is_opaque(){return this.alpha==ALPHA_U8_OPAQUE}
    premultiply():PremultipliedColorU8 {
        const self=this;
        let a = this.alpha;
        if(a != ALPHA_U8_OPAQUE) {
           return PremultipliedColorU8.from_rgba_unchecked(
                premultiply_u8(self.red, a),
                premultiply_u8(self.green, a),
                premultiply_u8(self.blue, a),
                a,
            )
        } else {
           return PremultipliedColorU8.from_rgba_unchecked(self.red, self.green, self.blue, a)
        }
    }
}
export class PremultipliedColor{
    
    static from_rgba(r:u8,g:u8,b:u8,a:u8):PremultipliedColor{
        return new this([r,g,b,a])
    }
    static from_rgba_unchecked(r: u8, g: u8, b: u8, a: u8){
       return new this([r, g, b, a])
    }
    elements:Uint8Array=new Uint8Array(4)
    constructor(elements:number[]){
        this.elements.set(elements)
    }
    get r(){return this.elements[0]}
    get g(){return this.elements[1]}
    get b(){return this.elements[2]}
    get a(){return this.elements[3]}
    get red(){return this.elements[0]}
    get green(){return this.elements[1]}
    get blue(){return this.elements[2]}
    get alpha(){return this.elements[3]}
    is_opaque(){return this.alpha==ALPHA_U8_OPAQUE}
    demultiply(): Color {
        const self=this;
        let alpha = self.alpha;
        if (alpha ==0 ){
           return Color.TRANSPARENT
        } else {
            let a = alpha as f64 / 255.0;
            return Color.from_rgba(
                clamp01(this.red/a),
                clamp01(this.g/a),
                clamp01(this.b/a),
                this.a
            
            )
        }
    }
    to_color_u8():PremultipliedColorU8 {
        const self=this;
        let c = color_f32_to_u8(self.r, self.g, self.b, self.a);
        return PremultipliedColorU8.from_rgba_unchecked(c[0], c[1], c[2], c[3])
    }
}
export class PremultipliedColorU8{

    static from_rgba(r:u8,g:u8,b:u8,a:u8):Option<PremultipliedColorU8>{
        if(r<=a&&g<=a&&b<=a){
            return new this([r,g,b,a])
        }else{

        }
    }
    static from_rgba_unchecked(r: u8, g: u8, b: u8, a: u8){
       return new this([r, g, b, a])
    }
    elements:Uint8Array=new Uint8Array(4)
    constructor(elements:number[]){
        this.elements.set(elements)
    }
    get r(){return this.elements[0]}
    get g(){return this.elements[1]}
    get b(){return this.elements[2]}
    get a(){return this.elements[3]}
    get red(){return this.elements[0]}
    get green(){return this.elements[1]}
    get blue(){return this.elements[2]}
    get alpha(){return this.elements[3]}
    is_opaque(){return this.alpha==ALPHA_U8_OPAQUE}
    demultiply(): ColorU8 {
        const self=this;
        let alpha = self.alpha;
        if (alpha == ALPHA_U8_OPAQUE ){
           return ColorU8.from_rgba(self.red, self.green, self.blue, alpha)
        } else {
            let a = alpha as f64 / 255.0;
            return ColorU8.from_rgba(
                (self.red as f64 / a + 0.5) as u8,
                (self.green as f64 / a + 0.5) as u8,
                (self.blue as f64 / a + 0.5) as u8,
                alpha,
            )
        }
    }
}


export enum ColorSpace{
    Linear,
    Gamma2,
    SimpleSRGB,
    FullSRGBGamma
}
export function expand_channel(colorSpace:ColorSpace,x:number){
    switch(colorSpace){
        case ColorSpace.Linear:return x
        case ColorSpace.Gamma2:return x**2
        case ColorSpace.SimpleSRGB:return clamp01(Math.pow(x,2.2))
        case ColorSpace.FullSRGBGamma:{

            if(x <= 0.04045){
                x=x / 12.92
            } else {
                x=Math.pow((x + 0.055) / 1.055, 2.4)
            };
            return clamp01(x)
        };
    }

}
function premultiply_u8(c: u8, a: u8):u8 {
    let prod = c * a+ 128;
    return ((prod + (prod >> 8)) >> 8) as u8
}

function color_f32_to_u8(
    r: NormalizedF32,
    g: NormalizedF32,
    b: NormalizedF32,
    a: NormalizedF32,
):u8[]{
    return [
        (r * 255.0 + 0.5) as u8,
        (g * 255.0 + 0.5) as u8,
        (b * 255.0 + 0.5) as u8,
        (a * 255.0 + 0.5) as u8,
    ]
}
