import { Color } from "../color";
import { Transform } from "../path";
import { LinearGradient } from "./linear_gradient";
import { Pattern } from "./pattern";
import { RadialGradient } from "./radial_gradient";


export class Shader {
    static SolidColor: number = 1
    static LinerGradient: number = 2
    static RadialGradient: number = 3
    static Pattern: number = 4

    static createSolidColor(color: Color) {
        const shader = new this(this.SolidColor)
        shader.color = color
        return shader
    }
    static createLinearGradient(linearGradient: LinearGradient) {
        const shader = new this(this.LinerGradient)
        shader.linearGradient = linearGradient
        return shader
    }
    static createRadialGradient(radialGradient: RadialGradient) {
        const shader = new this(this.RadialGradient)
        shader.radialGradient = radialGradient
        return shader
    }

    static createPattern(pattern: Pattern) {
        const shader = new this(this.Pattern)
        shader.pattern = pattern
        return shader
    }
    pattern?: Pattern
    linearGradient?: LinearGradient
    color?: Color
    radialGradient?: RadialGradient
    type: number
    constructor(type: number) {
        this.type = type;
    }
    apply_opacity(opacity: number) {
        switch (this.type) {
            case Shader.SolidColor:
                this.color!.apply_opacity(opacity);
                break;
            case Shader.LinerGradient:
                if (!this.linearGradient) return;
                this.linearGradient!.apply_opacity(opacity);
                break;
            case Shader.RadialGradient:
                if (!this.radialGradient) return;
                this.radialGradient.apply_opacity(opacity);
                break;
            case Shader.Pattern:
                if (!this.radialGradient) return;
                this.radialGradient.apply_opacity(opacity);
                break;
        }
    }
    transform(ts:Transform){
        switch (this.type) {
            case Shader.LinerGradient:
                this.linearGradient!.transform=this.linearGradient!.transform.post_concat(ts)
                break;
            case Shader.RadialGradient:
                this.radialGradient!.transform=this.radialGradient!.transform.post_concat(ts);
                break;
            case Shader.Pattern:
              this.pattern!.transform=this.radialGradient!.transform.post_concat(ts);
                    break;
        }
    }
    is_opaque(){
        switch(this.type){
            case Shader.SolidColor:
                return this.color!.is_opaque();
            case Shader.LinerGradient:

                return this.linearGradient!.is_opaque();
            case Shader.RadialGradient:
                return false
            case Shader.Pattern:
                return false
        }
    }
}