export class Vec<T> extends Array<T>{
    constructor(...args: T[]){
        super(...args);
    }

    get length(): number {
        return this.length;
    }
    clone(){
        return new Vec<T>(...this);
    }
}