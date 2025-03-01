import { Color } from "../color"
import { Num } from "../number";
import { Transform } from "../path";

export class GradientStop{
    static new(position:number,color:Color){
        const stop=new GradientStop()
        stop.position=position
        stop.color=color
        return stop;
    }
    position:number=0
    color:Color=Color.BLACK
}
export enum SpreadMode{
    Pad,
    Reflect,
    Repeat
}
export class Gradient{
    static new(stops:GradientStop[],tile_mode=SpreadMode.Pad,transform=Transform.default(),points_to_unit=Transform.identity()){
        const gradient=new Gradient()
       
        let dummy_first=stops[0].position!=0
        let dummy_last=stops[stops.length-1].position!=1
        if(dummy_first){
             stops.unshift(GradientStop.new(0,stops[0].color))
        }
        if(dummy_last){
            stops.push(GradientStop.new(1,stops[stops.length-1].color))
        }
        let colors_are_opaque=stops.every(stop=>stop.color.is_opaque())
        let start_index=dummy_first?0:1
        let prev=0
        let has_uniform_stops=true
        let uniform_step=stops[start_index].position-prev
        for(let i=start_index;i<stops.length;++i){
            let curr=i+1===stops.length?1:Num.new(stops[i].position).bound(prev,1).value
            has_uniform_stops=Num.new(uniform_step).is_nearly_equal(curr-prev)
            stops[i].position=Num.new(curr).clamp(0,1).value
            prev=curr

        }

        gradient.stops=stops
        gradient.tile_mode=tile_mode
        gradient.transform=transform
        gradient.points_to_unit=points_to_unit
        return gradient;
    }
    stops:GradientStop[]=[]
    tile_mode:SpreadMode=SpreadMode.Pad
    transform:Transform=Transform.default()
    points_to_unit:Transform=Transform.identity()
    colors_are_opaque:boolean=false
    has_uniform_stops:boolean=false

    apply_opacity(opacity:number){
        for(let i=0;i<this.stops.length;++i){
            this.stops[i].color.apply_opacity(opacity)
        }
        this.colors_are_opaque=this.stops.every(stop=>stop.color.is_opaque())
    }
    is_opaque(){
        return this.colors_are_opaque
    }
}