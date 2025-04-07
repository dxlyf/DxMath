export abstract class BaseLayer{
    abstract createDom():HTMLElement
    abstract add():this
    abstract addGroup():this
    abstract setSize(width:number,height:number):this
}