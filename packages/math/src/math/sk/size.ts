export class Size{
    static default(){
        return new Size(0, 0);
    }
    static from(width: number, height: number){
        return new Size(width, height);
    }
    constructor(public width: number, public height: number){

    }
    set(width: number, height: number){
        this.width = width;
        this.height = height;
    }
    setEmpty(){
        return this.set(0,0)
    }
    isEmpty(){
        return this.width <= 0 || this.height <= 0;
    }
    isZero(){
        return this.width === 0 && this.height === 0;
    }
    round(){
        return this.set(Math.round(this.width), Math.round(this.height))
    }
    ceil(){
        return this.set(Math.ceil(this.width), Math.ceil(this.height))
    }
    floor(){
        return this.set(Math.floor(this.width), Math.floor(this.height))
    }
    trunc(){
        return this.set(Math.trunc(this.width), Math.trunc(this.height))
    }
    clone(){
        return new Size(this.width, this.height);
    }

    equals(other: Size){
        return this.width === other.width && this.height === other.height;
    }
    equalsWithEpsilon(other: Size, epsilon = 0.0001){
        return Math.abs(this.width - other.width) < epsilon &&
            Math.abs(this.height - other.height) < epsilon;
    }
}