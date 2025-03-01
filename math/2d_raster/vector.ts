
export class Ref<T>{
    static from<T>(value:T){
        return new Ref<T>(value)
    }
    value:T
    constructor(value:T){
        this.value=value
    }
}
export class VectorLinked<T>{
    value:T
    next:VectorLinked<T>|null=null
    constructor(value:T){
        this.value=value
    }

}
