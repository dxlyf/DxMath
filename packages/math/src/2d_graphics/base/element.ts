import {EventTarget} from '../event'
import deepmerge from '../utils/deepmerge'
export interface IElement{
    children:Element[]
    add(child: Element): this;
    remove(child: Element): this;
}


export abstract class Element<Options=any,Events extends Record<string,any>=any> extends EventTarget<Events> implements IElement{
    children:Element[]= [];
    parent: Element | null = null;
    data: any = null;
    
    constructor(options:Options){
        super()
    }
    getDefaultOptions(){
        return {}
    }
    add(child: Element) {
        // 将子元素添加到children数组中
        this.children.push(child);
        // 将当前对象设置为子元素的父元素
        child.parent = this;
        // 返回当前对象
        return this
    }
    remove(child: Element) {
        this.children = this.children.filter(c => c !== child);
        child.parent = null;
        return this;
    }
}