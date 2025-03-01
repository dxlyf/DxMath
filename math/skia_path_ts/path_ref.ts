export class PathVerbAnalysis {
    static default(){
        return new this()
    }
    static create(opts:any){
        const instance = new this()
        Object.assign(instance, opts)
        return instance

    }
    static make(valid:boolean, points:number, weights:number, segmentMask:number){
        return this.create({valid, points, weights, segmentMask})
    }
    valid:boolean;
    points:number
    weights:number;
    segmentMask:number;
};
